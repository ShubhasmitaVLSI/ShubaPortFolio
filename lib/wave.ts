// Text-to-SVG timing diagrams for ```wave blocks, in the spirit of WaveDrom:
//
//   clk   : p.......
//   rst_n : 0.1.....
//   valid : 0.1..0..
//   data  : x.=.=x.. | A5 3C
//
// One character per cycle: p/n clock (rising/falling first), 0/1 levels,
// x unknown, z high-impedance, = bus value (labels after "|"), . repeats the
// previous state. A line starting with "#" becomes the caption. Output is
// escaped SVG styled by theme classes.

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

const CYCLE = 34;
const ROW = 34;
const HIGH = 8; // y of the high rail within a row
const LOW = 26; // y of the low rail
const MID = (HIGH + LOW) / 2;
const SLEW = 3;
const MAX_SIGNALS = 24;
const MAX_CYCLES = 64;

type Seg = { kind: "0" | "1" | "x" | "z" | "=" | "p" | "n"; start: number; len: number; label?: string };

function segments(wave: string, labels: string[]): Seg[] {
  const segs: Seg[] = [];
  let next = 0;
  for (let i = 0; i < wave.length; i++) {
    const c = wave[i];
    const last = segs[segs.length - 1];
    if (c === "." && last) {
      last.len++;
      continue;
    }
    const kind = (c === "." ? "x" : /[2-9]/.test(c) ? "=" : c) as Seg["kind"];
    if (!"01xz=pn".includes(kind)) continue;
    segs.push({ kind, start: i, len: 1, ...(kind === "=" ? { label: labels[next++] ?? "" } : {}) });
  }
  return segs;
}

const level = (k: Seg["kind"]) => (k === "1" ? HIGH : k === "0" ? LOW : MID);

function drawSignal(segs: Seg[], y: number) {
  const parts: string[] = [];
  segs.forEach((s, idx) => {
    const x0 = s.start * CYCLE;
    const x1 = (s.start + s.len) * CYCLE;
    const prev = segs[idx - 1];
    const top = y + HIGH;
    const bot = y + LOW;
    if (s.kind === "p" || s.kind === "n") {
      let d = "";
      for (let c = 0; c < s.len; c++) {
        const a = x0 + c * CYCLE;
        const h = a + CYCLE / 2;
        const [first, second] = s.kind === "p" ? [top, bot] : [bot, top];
        d += `M${a} ${second}L${a} ${first}L${h} ${first}L${h} ${second}L${a + CYCLE} ${second}`;
      }
      parts.push(`<path class="wv-clk" d="${d}"/>`);
      return;
    }
    if (s.kind === "0" || s.kind === "1" || s.kind === "z") {
      const ly = y + level(s.kind);
      const from = prev ? (prev.kind === "0" || prev.kind === "1" || prev.kind === "z" ? y + level(prev.kind) : y + MID) : ly;
      const edge = prev && from !== ly ? `M${x0} ${from}L${x0 + SLEW} ${ly}` : "";
      parts.push(`<path class="wv-${s.kind === "z" ? "z" : "lvl"}" d="${edge}M${x0 + (edge ? SLEW : 0)} ${ly}L${x1} ${ly}"/>`);
      return;
    }
    // Bus and unknown: a hexagon between the rails.
    const l = x0 + SLEW;
    const r = x1 - SLEW;
    const shape = `M${x0} ${y + MID}L${l} ${top}L${r} ${top}L${x1} ${y + MID}L${r} ${bot}L${l} ${bot}Z`;
    parts.push(`<path class="${s.kind === "x" ? "wv-x" : "wv-bus"}" d="${shape}"/>`);
    if (s.label)
      parts.push(
        `<text class="wv-label" x="${(x0 + x1) / 2}" y="${y + MID + 4}" text-anchor="middle">${esc(s.label.slice(0, Math.max(2, s.len * 5)))}</text>`
      );
  });
  return parts.join("");
}

/** Renders a wave block to an SVG figure, or null when there is nothing to draw. */
export function renderWave(src: string): string | null {
  let caption = "";
  const rows: { name: string; segs: Seg[]; cycles: number }[] = [];
  for (const raw of src.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      caption = line.replace(/^#+\s*/, "");
      continue;
    }
    const m = line.match(/^([^:]{1,32}):\s*([01xzpn=2-9.]{1,256})\s*(?:\|\s*(.*))?$/);
    if (!m || rows.length >= MAX_SIGNALS) continue;
    const wave = m[2].slice(0, MAX_CYCLES);
    rows.push({ name: m[1].trim(), segs: segments(wave, (m[3] ?? "").split(/\s+/).filter(Boolean)), cycles: wave.length });
  }
  if (!rows.length) return null;

  const cycles = Math.max(...rows.map((r) => r.cycles));
  const nameW = Math.max(...rows.map((r) => r.name.length)) * 7.6 + 18;
  const width = Math.ceil(nameW + cycles * CYCLE + 8);
  const height = rows.length * ROW + 8;
  const grid = Array.from({ length: cycles + 1 }, (_, c) => `M${c * CYCLE} 0V${rows.length * ROW}`).join("");

  const body = rows
    .map(
      (r, i) =>
        `<text class="wv-name" x="${nameW - 12}" y="${i * ROW + MID + 4}" text-anchor="end">${esc(r.name)}</text>` +
        `<g transform="translate(${nameW} 0)">${drawSignal(r.segs, i * ROW)}</g>`
    )
    .join("");

  const label = caption || `Timing diagram: ${rows.map((r) => r.name).join(", ")}`;
  return (
    `<figure class="wave"><div class="wave-scroll"><svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(label)}">` +
    `<defs><pattern id="wv-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V6" class="wv-hatch"/></pattern></defs>` +
    `<path class="wv-grid" transform="translate(${nameW} 0)" d="${grid}"/>${body}</svg></div>` +
    (caption ? `<figcaption>${esc(caption)}</figcaption>` : "") +
    `</figure>`
  );
}
