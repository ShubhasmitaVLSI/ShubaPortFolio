// A looping, waveform-viewer style strip. Every pattern has period N so two
// copies side by side scroll seamlessly with a single CSS translate.

const W = 36; // px per cycle
const N = 24; // cycles per period
const ROW = 34;
const HI = 8;
const LO = 24;

type Bus = { v: string; kind?: "x" | "z" }[];

const tck = Array.from({ length: N }, (_, i) => (i % 2 === 0 ? 1 : 0));
const tms = [1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1];
const tdi = [0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0];
const valid = [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0];
const data: Bus = [
  { v: "0000" }, { v: "0000" }, { v: "xxxx", kind: "x" }, { v: "A5C3" }, { v: "A5C3" }, { v: "3C0F" },
  { v: "3C0F" }, { v: "zzzz", kind: "z" }, { v: "7E21" }, { v: "7E21" }, { v: "7E21" }, { v: "FF00" },
  { v: "FF00" }, { v: "0B1D" }, { v: "0B1D" }, { v: "C0DE" }, { v: "C0DE" }, { v: "C0DE" },
  { v: "5A5A" }, { v: "5A5A" }, { v: "D1E7" }, { v: "D1E7" }, { v: "0000" }, { v: "0000" },
];
const checks = [4, 10, 15, 21]; // cycles where an assertion fires and passes

function bitPath(bits: number[], y0: number, copies = 2) {
  let d = "";
  const all = Array.from({ length: copies }, () => bits).flat();
  all.forEach((b, i) => {
    const x = i * W;
    const y = y0 + (b ? HI : LO);
    if (i === 0) d += `M${x},${y}`;
    else {
      const prev = y0 + (all[i - 1] ? HI : LO);
      if (prev !== y) d += `L${x},${prev}L${x},${y}`;
    }
    d += `L${x + W},${y}`;
  });
  return d;
}

function clkPath(y0: number, cycles: number) {
  let d = `M0,${y0 + LO}`;
  for (let i = 0; i < cycles; i++) {
    const x = i * W;
    d += `L${x},${y0 + HI}L${x + W / 2},${y0 + HI}L${x + W / 2},${y0 + LO}L${x + W},${y0 + LO}`;
  }
  return d;
}

function busSegments(bus: Bus, y0: number) {
  const all = [...bus, ...bus];
  const segs: { x: number; w: number; v: string; kind?: string }[] = [];
  let start = 0;
  for (let i = 1; i <= all.length; i++) {
    if (i === all.length || all[i].v !== all[start].v) {
      segs.push({ x: start * W, w: (i - start) * W, v: all[start].v, kind: all[start].kind });
      start = i;
    }
  }
  const s = 5;
  const top = y0 + HI;
  const bot = y0 + LO;
  const mid = (top + bot) / 2;
  return segs.map((g, i) => {
    const x1 = g.x;
    const x2 = g.x + g.w;
    const d = `M${x1},${mid}L${x1 + s},${top}L${x2 - s},${top}L${x2},${mid}L${x2 - s},${bot}L${x1 + s},${bot}Z`;
    return (
      <g key={i} className={`bus ${g.kind ?? ""}`}>
        <path d={d} />
        {g.w > 40 && (
          <text x={x1 + g.w / 2} y={mid + 3.5} textAnchor="middle">
            {g.v}
          </text>
        )}
      </g>
    );
  });
}

const signals = ["clk", "jtag.tck", "jtag.tms", "jtag.tdi", "valid", "data[15:0]", "sva.chk"];

export default function Waveform() {
  const total = N * W * 2;
  const H = signals.length * ROW + 6;

  return (
    <section className="wave-wrap" aria-label="Decorative waveform viewer" data-reveal>
      <div className="wave">
        <div className="wave-bar">
          <span className="wave-title">
            <i className="dot g" /> waves.fsdb
          </span>
          <span className="wave-meta">
            <b>cursor</b> 1,284 ns · <b>zoom</b> 1:1 · <b>SDF</b> annotated
          </span>
        </div>
        <div className="wave-body">
          <ul className="wave-names">
            {signals.map((s) => (
              <li key={s} style={{ height: ROW }}>
                {s}
              </li>
            ))}
          </ul>
          <div className="wave-view">
            <svg className="wave-svg" width={total} height={H} viewBox={`0 0 ${total} ${H}`} aria-hidden="true">
              <defs>
                <pattern id="wgrid" width={W} height={H} patternUnits="userSpaceOnUse">
                  <path d={`M${W},0V${H}`} className="wgrid" />
                </pattern>
              </defs>
              <rect width={total} height={H} fill="url(#wgrid)" />
              <path className="sig clk" d={clkPath(0, N * 2)} />
              <path className="sig" d={bitPath(tck, ROW)} />
              <path className="sig alt" d={bitPath(tms, ROW * 2)} />
              <path className="sig alt" d={bitPath(tdi, ROW * 3)} />
              <path className="sig hot" d={bitPath(valid, ROW * 4)} />
              {busSegments(data, ROW * 5)}
              {[0, 1].flatMap((copy) =>
                checks.map((c) => {
                  const x = (copy * N + c) * W + W / 2;
                  const y = ROW * 6 + 16;
                  return (
                    <g key={`${copy}-${c}`} className="chk">
                      <path d={`M${x},${y - 8}L${x + 7},${y}L${x},${y + 8}L${x - 7},${y}Z`} />
                    </g>
                  );
                })
              )}
            </svg>
            <div className="wave-cursor" />
          </div>
        </div>
      </div>
    </section>
  );
}
