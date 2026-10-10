import type { Row } from "@/lib/visit-stats";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
export const formatCount = (n: number) => (n < 10_000 ? n.toLocaleString("en-IN") : compact.format(n));

/** Signed change against the previous period; up is good for every metric shown here. */
function Delta({ now, before, label }: { now: number; before: number; label: string }) {
  if (!before && !now) return null;
  const pct = before ? Math.round(((now - before) / before) * 100) : null;
  const dir = pct === null ? "up" : pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  return (
    <span className={`an-delta ${dir}`}>
      <span aria-hidden="true">{dir === "up" ? "▲" : dir === "down" ? "▼" : "■"}</span>{" "}
      {pct === null ? "new" : `${pct > 0 ? "+" : ""}${pct}%`} <small>vs {label}</small>
    </span>
  );
}

/** 12-point (or more) trend line: history in the quiet ink, the latest point in the accent. */
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const w = 120;
  const h = 32;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (w - 6) + 3, h - 3 - (v / max) * (h - 6)]);
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg className="an-spark" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ")} />
      <circle cx={lx} cy={ly} r="3" />
    </svg>
  );
}

export function StatTile({
  label,
  value,
  hint,
  previous,
  previousLabel,
  trend,
  live,
}: {
  label: string;
  value: string;
  hint?: string;
  previous?: { now: number; before: number } | null;
  previousLabel?: string;
  trend?: number[];
  live?: boolean;
}) {
  return (
    <div className="an-tile">
      <p className="an-tile-label">
        {live && <i className="an-live" aria-hidden="true" />}
        {label}
      </p>
      <p className="an-tile-value">{value}</p>
      {previous && previousLabel && <Delta now={previous.now} before={previous.before} label={previousLabel} />}
      {hint && <p className="an-tile-hint">{hint}</p>}
      {trend && <Sparkline values={trend} />}
    </div>
  );
}

/** Horizontal bars for one measure: a single colour, values as text beside each bar. */
export function BarList({ rows, limit = 6, empty, unit = "visitors" }: { rows: Row[]; limit?: number; empty: string; unit?: string }) {
  if (!rows.length) return <p className="an-empty">{empty}</p>;
  const shown = rows.slice(0, limit);
  const rest = rows.slice(limit).reduce((n, r) => n + r.value, 0);
  // The grouped remainder can outweigh the top row; the scale covers both.
  const max = Math.max(rest, ...rows.map((r) => r.value));
  return (
    <ul className="an-bars">
      {shown.map((r, i) => (
        <li key={r.key ?? r.label} style={{ "--w": `${(r.value / max) * 100}%`, "--i": i } as React.CSSProperties} title={`${r.label}: ${r.value} ${unit}`}>
          <span className="an-bars-label">{r.label}</span>
          <span className="an-bars-value">{formatCount(r.value)}</span>
        </li>
      ))}
      {rest > 0 && (
        <li className="an-bars-other" style={{ "--w": `${(rest / max) * 100}%`, "--i": shown.length } as React.CSSProperties}>
          <span className="an-bars-label">Other ({rows.length - limit})</span>
          <span className="an-bars-value">{formatCount(rest)}</span>
        </li>
      )}
    </ul>
  );
}
