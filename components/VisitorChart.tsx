"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "day" | "week" | "month";
type Point = { date: string; count: number };

const H = 300;
const BASE = 245; // y of the zero line
const PLOT = 195; // height of the plot area
const LEFT = 60;
const MIN_WIDTH = 800;
const SLOT = 18; // minimum horizontal room per bar, so long ranges scroll instead of squeezing

function group(points: Point[], mode: Mode) {
  const counts = new Map<string, number>();
  for (const p of points) {
    let key = p.date;
    if (mode === "month") key = p.date.slice(0, 7);
    if (mode === "week") {
      const date = new Date(p.date + "T00:00:00Z");
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
      key = date.toISOString().slice(0, 10);
    }
    counts.set(key, (counts.get(key) || 0) + p.count);
  }
  return [...counts].map(([date, count]) => ({ date, count }));
}

/** Day, week and month page-view bars from the first recorded day to today. */
export default function VisitorChart({ daily }: { daily: Point[] }) {
  const [mode, setMode] = useState<Mode>("day");
  const scroller = useRef<HTMLDivElement>(null);
  const rows = group(daily, mode);
  const max = Math.max(1, ...rows.map((p) => p.count));
  // An even top keeps the middle gridline on a whole number.
  const top = max === 1 ? 1 : max + (max % 2);
  const ticks = top === 1 ? [0, 1] : [0, top / 2, top];
  const width = Math.max(MIN_WIDTH, LEFT + 40 + rows.length * SLOT);
  const step = (width - LEFT - 40) / Math.max(1, rows.length);
  const every = Math.ceil(64 / step);

  // Open on the most recent bars when the history is wider than the screen.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [mode, daily.length]);

  return (
    <section className="visitor-chart" aria-labelledby="visitor-chart-title">
      <h2 id="visitor-chart-title">Page-view trends</h2>
      <div className="hero-actions" role="group" aria-label="Chart grouping">
        {(["day", "week", "month"] as const).map((m) => (
          <button className={mode === m ? "btn primary" : "btn ghost"} aria-pressed={mode === m} key={m} onClick={() => setMode(m)}>
            {m === "day" ? "Day" : m === "week" ? "Week" : "Month"}
          </button>
        ))}
      </div>
      <p>Since {daily[0]?.date ?? "launch"} · IST. Weeks start Monday; edge weeks and months may be partial.</p>
      <div className="visitor-chart-scroll" ref={scroller}>
        <svg viewBox={`0 0 ${width} ${H}`} style={{ minWidth: width }} role="img" aria-label={"Page views grouped by " + mode}>
          <title>{"Page views by " + mode}</title>
          <desc>Exact dates and counts are in the data table below the chart.</desc>
          {ticks.map((t) => {
            const y = BASE - (t / top) * PLOT;
            return (
              <g key={t}>
                <line x1={LEFT - 5} y1={y} x2={width - 20} y2={y} stroke="var(--line)" />
                <text x={LEFT - 12} y={y + 5} textAnchor="end" fill="var(--muted)" fontSize="13">
                  {t}
                </text>
                {/* Repeated at the right edge, which is in view when a scrolled chart opens on today. */}
                {t > 0 && (
                  <text x={width - 22} y={y - 6} textAnchor="end" fill="var(--muted)" fontSize="13">
                    {t}
                  </text>
                )}
              </g>
            );
          })}
          <g key={mode}>
            {rows.map((p, i) => {
              const height = (p.count / top) * PLOT;
              const x = LEFT + i * step;
              const labelled = i % every === 0 || i === rows.length - 1;
              return (
                <g key={p.date}>
                  <rect
                    className="visitor-bar"
                    x={x}
                    y={BASE - height}
                    width={Math.max(3, step * 0.65)}
                    height={height}
                    rx="3"
                    fill="var(--accent)"
                    style={{ animationDelay: Math.min(i, 60) * 15 + "ms" }}
                  >
                    <title>{p.date + ": " + p.count + " page views"}</title>
                  </rect>
                  {labelled && (
                    <text x={x + step * 0.325} y="272" textAnchor="middle" fill="var(--muted)" fontSize="13">
                      {mode === "month" ? p.date : p.date.slice(5)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      {daily.every((p) => p.count === 0) && <p>No recorded page views yet.</p>}
      <details>
        <summary>View chart data</summary>
        <div className="visitor-table">
          <table>
            <thead>
              <tr>
                <th>{mode === "week" ? "Week starting" : mode === "month" ? "Month" : "Day"}</th>
                <th>Page views</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.date}>
                  <td>{p.date}</td>
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
