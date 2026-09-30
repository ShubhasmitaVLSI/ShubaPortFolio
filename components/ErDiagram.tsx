"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { schema, type Entity } from "@/lib/structure";

type Pos = Record<string, { x: number; y: number }>;
type Size = Record<string, { w: number; h: number }>;

const initial = (): Pos => Object.fromEntries(schema.entities.map((e) => [e.id, { x: e.x, y: e.y }]));
const byId = Object.fromEntries(schema.entities.map((e) => [e.id, e])) as Record<string, Entity>;

function connector(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  const acx = a.x + a.w / 2,
    acy = a.y + a.h / 2,
    bcx = b.x + b.w / 2,
    bcy = b.y + b.h / 2;
  const dx = bcx - acx,
    dy = bcy - acy;
  let p0, p1, p2, p3;
  if (Math.abs(dx) > Math.abs(dy) * 0.9) {
    const s = Math.sign(dx) || 1;
    p0 = { x: s > 0 ? a.x + a.w : a.x, y: acy };
    p3 = { x: s > 0 ? b.x : b.x + b.w, y: bcy };
    const k = Math.max(40, Math.abs(p3.x - p0.x) / 2);
    p1 = { x: p0.x + s * k, y: p0.y };
    p2 = { x: p3.x - s * k, y: p3.y };
  } else {
    const s = Math.sign(dy) || 1;
    p0 = { x: acx, y: s > 0 ? a.y + a.h : a.y };
    p3 = { x: bcx, y: s > 0 ? b.y : b.y + b.h };
    const k = Math.max(30, Math.abs(p3.y - p0.y) / 2);
    p1 = { x: p0.x, y: p0.y + s * k };
    p2 = { x: p3.x, y: p3.y - s * k };
  }
  const d = `M${p0.x},${p0.y} C${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
  const mid = { x: (p0.x + 3 * p1.x + 3 * p2.x + p3.x) / 8, y: (p0.y + 3 * p1.y + 3 * p2.y + p3.y) / 8 };
  return { d, mid };
}

function Console({ entity }: { entity: Entity }) {
  const sql = `SELECT * FROM ${entity.label.toLowerCase()};`;
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTyped(sql);
      setDone(true);
      return;
    }
    setTyped("");
    setDone(false);
    let i = 0;
    let finish = 0;
    const t = window.setInterval(() => {
      i++;
      setTyped(sql.slice(0, i));
      if (i >= sql.length) {
        clearInterval(t);
        finish = window.setTimeout(() => setDone(true), 180);
      }
    }, 28);
    return () => { clearInterval(t); clearTimeout(finish); };
  }, [sql]);

  const cols = entity.fields.map((f) => f.name);
  return (
    <div className="sql">
      <div className="terminal-bar">
        <i className="dot r" />
        <i className="dot y" />
        <i className="dot g" />
        <span>career.db — query console</span>
      </div>
      <div className="sql-body">
        <div className="sql-line">
          <span className="prompt">sql&gt; </span>
          {typed}
          {!done && <i className="caret" />}
        </div>
        {done && (
          <>
            <div className="sql-table-wrap">
              <table className="sql-table">
                <thead>
                  <tr>
                    {cols.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entity.rows.map((r, i) => (
                    <tr key={i} style={{ animationDelay: `${i * 55}ms` }}>
                      {cols.map((c) => (
                        <td key={c}>{r[c] ?? "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sql-foot">
              ({entity.rows.length} row{entity.rows.length === 1 ? "" : "s"}) · click another table to query it
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ErDiagram() {
  const [pos, setPos] = useState<Pos>(initial);
  const [size, setSize] = useState<Size>({});
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState("engineer");
  const [scale, setScale] = useState(1);
  const [shown, setShown] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const cards = useRef<Record<string, HTMLDivElement | null>>({});
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  const measure = useCallback(() => {
    const s: Size = {};
    for (const e of schema.entities) {
      const el = cards.current[e.id];
      if (el) s[e.id] = { w: el.offsetWidth, h: el.offsetHeight };
    }
    setSize(s);
  }, []);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setScale(Math.max(0.56, Math.min(1, e.contentRect.width / schema.width)));
      measure();
    });
    ro.observe(el);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [measure]);

  const onDown = (id: string) => (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id, sx: e.clientX, sy: e.clientY, ox: pos[id].x, oy: pos[id].y, moved: false };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / scale;
    const dy = (e.clientY - d.sy) / scale;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    const sz = size[d.id] ?? { w: 220, h: 160 };
    setPos((p) => ({
      ...p,
      [d.id]: {
        x: Math.max(0, Math.min(schema.width - sz.w, d.ox + dx)),
        y: Math.max(0, Math.min(schema.height - sz.h, d.oy + dy)),
      },
    }));
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) setSelected(d.id);
  };

  const linked = (id: string) =>
    new Set(
      schema.relations.flatMap((r) => (r.from === id || r.to === id ? [r.from, r.to] : []))
    );
  const focus = hover ? linked(hover) : null;
  const ready = Object.keys(size).length === schema.entities.length;

  return (
    <div className={`er ${shown ? "shown" : ""}`}>
      <div className="er-toolbar">
        <span className="er-legend">
          <svg width="34" height="14" aria-hidden="true">
            <path d="M2,7 H32 M26,2 V12 M22,2 V12" />
          </svg>
          one
        </span>
        <span className="er-legend">
          <svg width="34" height="14" aria-hidden="true">
            <path d="M2,7 H32 M22,7 L32,1 M22,7 L32,13" />
          </svg>
          many
        </span>
        <span className="er-hint">Drag tables · hover to trace joins · click to query</span>
        <button className="er-reset" onClick={() => setPos(initial())}>
          ↺ Reset layout
        </button>
      </div>

      <div className="er-scroll" ref={wrap}>
        <div className="er-canvas" style={{ width: schema.width * scale, height: schema.height * scale }}>
          <div
            className="er-stage"
            style={{ width: schema.width, height: schema.height, transform: `scale(${scale})` }}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <svg className="er-links" width={schema.width} height={schema.height} aria-hidden="true">
              <defs>
                {["base", "hot"].map((k) => (
                  <g key={k}>
                    <marker id={`one-${k}`} viewBox="0 0 16 16" refX="16" refY="8" markerWidth="16" markerHeight="16" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
                      <path d="M10,2 V14 M5,2 V14" className={`mk ${k}`} />
                    </marker>
                    <marker id={`many-${k}`} viewBox="0 0 16 16" refX="16" refY="8" markerWidth="16" markerHeight="16" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
                      <path d="M4,8 L16,2 M4,8 L16,14 M4,8 H16 M3,2 V14" className={`mk ${k}`} />
                    </marker>
                  </g>
                ))}
              </defs>
              {ready &&
                schema.relations.map((r, i) => {
                  const a = { ...pos[r.from], ...size[r.from] };
                  const b = { ...pos[r.to], ...size[r.to] };
                  const { d, mid } = connector(a, b);
                  const hot = hover ? r.from === hover || r.to === hover : selected === r.from || selected === r.to;
                  const k = hot ? "hot" : "base";
                  return (
                    <g key={`${r.from}-${r.to}`} className={`rel ${hot ? "hot" : ""} ${focus && !hot ? "dim" : ""}`}>
                      <path
                        d={d}
                        className="rel-line"
                        pathLength={1}
                        markerStart={`url(#${r.fromCard}-${k})`}
                        markerEnd={`url(#${r.toCard}-${k})`}
                        style={{ animationDelay: `${0.5 + i * 0.09}s` }}
                      />
                      <path d={d} className="rel-flow" />
                      <g transform={`translate(${mid.x},${mid.y})`} className="rel-tag">
                        <rect x={-r.verb.length * 3.6 - 10} y={-10} width={r.verb.length * 7.2 + 20} height={20} rx={10} />
                        <text textAnchor="middle" y={4}>
                          {r.verb}
                        </text>
                      </g>
                    </g>
                  );
                })}
            </svg>

            {schema.entities.map((e, i) => {
              const dim = focus && !focus.has(e.id);
              return (
                <div
                  key={e.id}
                  ref={(el) => {
                    cards.current[e.id] = el;
                  }}
                  className={`ent hue-${e.hue} ${selected === e.id ? "sel" : ""} ${hover === e.id ? "hov" : ""} ${dim ? "dim" : ""}`}
                  style={{ left: pos[e.id].x, top: pos[e.id].y, animationDelay: `${i * 90}ms` }}
                  onPointerEnter={() => setHover(e.id)}
                  onPointerLeave={() => setHover(null)}
                >
                  <div
                    className="ent-head"
                    onPointerDown={onDown(e.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${e.label} table, press Enter to query`}
                    onKeyDown={(k) => {
                      if (k.key === "Enter" || k.key === " ") {
                        k.preventDefault();
                        setSelected(e.id);
                      }
                    }}
                  >
                    <span className="ent-grip" aria-hidden="true">
                      ⋮⋮
                    </span>
                    {e.label}
                    <span className="ent-rows">{e.rows.length}</span>
                  </div>
                  <ul>
                    {e.fields.map((f) => (
                      <li key={f.name}>
                        <span className={`key ${f.key ?? ""}`}>{f.key ?? ""}</span>
                        <span className="fname">{f.name}</span>
                        <span className="ftype">{f.type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Console entity={byId[selected]} />
    </div>
  );
}
