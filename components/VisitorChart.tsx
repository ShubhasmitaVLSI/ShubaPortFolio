"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "day" | "week" | "month";
type Point = { date: string; count: number; visitors: number };

const H = 300;
const BASE = 245; // y of the zero line
const PLOT = 195; // height of the plot area
const LEFT = 56;
const RIGHT = 64; // room for the end label
const MIN_WIDTH = 800;
const SLOT = 18; // minimum room per period, so long ranges scroll instead of squeezing
const BAR_MAX = 24;

function group(points: Point[], mode: Mode): Point[] {
  const out = new Map<string, Point>();
  for (const p of points) {
    let key = p.date;
    if (mode === "month") key = p.date.slice(0, 7);
    if (mode === "week") {
      const date = new Date(p.date + "T00:00:00Z");
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
      key = date.toISOString().slice(0, 10);
    }
    const row = out.get(key) ?? { date: key, count: 0, visitors: 0 };
    row.count += p.count;
    row.visitors += p.visitors;
    out.set(key, row);
  }
  return [...out.values()];
}

/** Two counts on one axis: visitors as the line, page views as quiet columns. */
export default function VisitorChart({ daily }: { daily: Point[] }) {
  const [mode, setMode] = useState<Mode>("day");
  const [hover, setHover] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const rows = group(daily, mode);
  const max = Math.max(1, ...rows.map((p) => Math.max(p.count, p.visitors)));
  // An even top keeps the middle gridline on a whole number.
  const top = max === 1 ? 1 : max + (max % 2);
  const ticks = top === 1 ? [0, 1] : [0, top / 2, top];
  const width = Math.max(MIN_WIDTH, LEFT + RIGHT + rows.length * SLOT);
  const step = (width - LEFT - RIGHT) / Math.max(1, rows.length);
  const barW = Math.min(BAR_MAX, Math.max(3, step - 2)); // keeps a 2px surface gap between columns
  const every = Math.ceil(64 / step);
  const x = (i: number) => LEFT + i * step + step / 2;
  const y = (n: number) => BASE - (n / top) * PLOT;
  const line = rows.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.visitors).toFixed(1)}`).join("");
  const last = rows[rows.length - 1];
  const focus = hover ?? null;
  const label = (date: string) => (mode === "month" ? date : date.slice(5));

  // Open on the most recent periods when the history is wider than the screen.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
    setHover(null);
  }, [mode, daily.length]);

  const pick = (clientX: number, svg: SVGSVGElement) => {
    const box = svg.getBoundingClientRect();
    const px = ((clientX - box.left) / box.width) * width;
    setHover(Math.max(0, Math.min(rows.length - 1, Math.floor((px - LEFT) / step))));
  };

  return (
    <section className="an-card visitor-chart" aria-labelledby="visitor-chart-title">
      <div className="an-card-head">
        <h2 id="visitor-chart-title">Visitors and page views</h2>
        <div className="an-seg" role="group" aria-label="Group by">
          {(["day", "week", "month"] as const).map((m) => (
            <button aria-pressed={mode === m} key={m} onClick={() => setMode(m)}>
              {m === "day" ? "Day" : m === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>
      <ul className="an-legend" aria-label="Legend">
        <li>
          <i className="key-line" aria-hidden="true" /> Visitors <small>(unique per day)</small>
        </li>
        <li>
          <i className="key-bar" aria-hidden="true" /> Page views
        </li>
      </ul>
      <div className="visitor-chart-scroll" ref={scroller}>
        <div className="visitor-chart-plot" style={{ minWidth: width }}>
          <svg
            viewBox={`0 0 ${width} ${H}`}
            role="img"
            aria-label={`Visitors and page views by ${mode}. Use the arrow keys to read each ${mode}; exact values are in the table below.`}
            tabIndex={0}
            onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
            onPointerLeave={() => setHover(null)}
            onBlur={() => setHover(null)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              e.preventDefault();
              const d = e.key === "ArrowRight" ? 1 : -1;
              setHover((h) => Math.max(0, Math.min(rows.length - 1, (h ?? rows.length - 1) + (h === null ? 0 : d))));
            }}
          >
            {ticks.map((t) => (
              <g key={t} className="an-gridline">
                <line x1={LEFT - 6} y1={y(t)} x2={width - RIGHT + 8} y2={y(t)} />
                <text x={LEFT - 12} y={y(t) + 4} textAnchor="end">
                  {t}
                </text>
                {/* Repeated at the right edge, which is in view when a scrolled chart opens on today. */}
                {t > 0 && (
                  <text x={width - 8} y={y(t) + 4} textAnchor="end">
                    {t}
                  </text>
                )}
              </g>
            ))}
            <g key={`bars-${mode}`}>
              {rows.map((p, i) => {
                const h = BASE - y(p.count);
                const r = Math.min(4, barW / 2, h);
                const left = x(i) - barW / 2;
                // Rounded data end, square at the baseline.
                const d = h > 0 ? `M${left},${BASE}V${BASE - h + r}Q${left},${BASE - h} ${left + r},${BASE - h}H${left + barW - r}Q${left + barW},${BASE - h} ${left + barW},${BASE - h + r}V${BASE}Z` : "";
                return d ? <path key={p.date} className={`an-bar ${focus === i ? "on" : ""}`} d={d} style={{ animationDelay: Math.min(i, 60) * 12 + "ms" }} /> : null;
              })}
            </g>
            <path key={`line-${mode}`} className="an-line" d={line} pathLength={1} />
            {last && (
              <g className="an-end">
                <circle cx={x(rows.length - 1)} cy={y(last.visitors)} r="4.5" />
                <text x={x(rows.length - 1) + 10} y={y(last.visitors) + 4}>
                  {last.visitors}
                </text>
              </g>
            )}
            {rows.map((p, i) =>
              i % every === 0 || i === rows.length - 1 ? (
                <text key={p.date} className="an-axis" x={x(i)} y="272" textAnchor="middle">
                  {label(p.date)}
                </text>
              ) : null
            )}
            {focus !== null && rows[focus] && (
              <g className="an-cross" aria-hidden="true">
                <line x1={x(focus)} y1={BASE - PLOT - 6} x2={x(focus)} y2={BASE} />
                <circle cx={x(focus)} cy={y(rows[focus].visitors)} r="4.5" />
              </g>
            )}
          </svg>
          {focus !== null && rows[focus] && (
            <div className="an-tip" role="status" style={{ left: `${(x(focus) / width) * 100}%` }}>
              <strong>{mode === "week" ? "Week of " + rows[focus].date : rows[focus].date}</strong>
              <span>
                <i className="key-line" /> <b>{rows[focus].visitors}</b> visitors
              </span>
              <span>
                <i className="key-bar" /> <b>{rows[focus].count}</b> page views
              </span>
            </div>
          )}
        </div>
      </div>
      {daily.every((p) => p.count === 0) && <p className="an-empty">No page views recorded in this range yet.</p>}
      <details className="an-table">
        <summary>View as table</summary>
        <div className="visitor-table">
          <table>
            <thead>
              <tr>
                <th>{mode === "week" ? "Week starting" : mode === "month" ? "Month" : "Day"}</th>
                <th>Visitors</th>
                <th>Page views</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.date}>
                  <td>{p.date}</td>
                  <td>{p.visitors}</td>
                  <td>{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
