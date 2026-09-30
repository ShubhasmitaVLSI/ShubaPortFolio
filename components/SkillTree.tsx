"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { skillTree } from "@/lib/structure";
import { projects } from "@/lib/data";

// Logical canvas; the tree is laid out in these units and scaled to fit.
const W = 1000;
const ROOT = { x: 10, w: 220, h: 66 };
const BR = { x: 345, w: 230, h: 48 };
const LF = { x: 715, w: 270, h: 32 };
const LEAF_GAP = 38;
const BRANCH_GAP = 22;
const COLLAPSED = 56;

type Sel = { b: number; l: number };

function curve(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

function related(name: string) {
  const key = name.toLowerCase().split(/[\s/·×]+/)[0];
  if (key.length < 3) return [];
  return projects.filter((p) => `${p.title} ${p.detail} ${p.tags.join(" ")}`.toLowerCase().includes(key));
}

export default function SkillTree() {
  const { root, branches } = skillTree;
  const [open, setOpen] = useState<boolean[]>(() => branches.map(() => true));
  const [sel, setSel] = useState<Sel>({ b: 2, l: 2 });
  const [scale, setScale] = useState(1);
  const [grown, setGrown] = useState(false);
  const [settled, setSettled] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // Layout: leaves stack per open branch; a closed branch takes one slot.
  const layout = useMemo(() => {
    let y = 10;
    const bs = branches.map((b, bi) => {
      if (!open[bi]) {
        const cy = y + COLLAPSED / 2;
        y += COLLAPSED + BRANCH_GAP;
        return { cy, leaves: b.leaves.map(() => cy) };
      }
      const leaves = b.leaves.map((_, li) => y + li * LEAF_GAP + LF.h / 2);
      y += b.leaves.length * LEAF_GAP + BRANCH_GAP;
      return { cy: (leaves[0] + leaves[leaves.length - 1]) / 2, leaves };
    });
    const H = y - BRANCH_GAP + 10;
    const rootY = (bs[0].cy + bs[bs.length - 1].cy) / 2;
    return { bs, H, rootY };
  }, [branches, open]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let settleTimer = 0;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / W)));
    ro.observe(el);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setGrown(true);
          settleTimer = window.setTimeout(() => setSettled(true), 2400);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => {
      clearTimeout(settleTimer);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const toggle = (bi: number) => setOpen((o) => o.map((v, i) => (i === bi ? !v : v)));
  const active = branches[sel.b];
  const leaf = active.leaves[sel.l];
  const rel = related(leaf.name);
  const { bs, H, rootY } = layout;

  return (
    <div className={`tree ${grown ? "grown" : ""} ${settled ? "settled" : ""}`}>
      {/* Desktop: component hierarchy canvas */}
      <div className="tree-canvas" ref={wrap} style={{ height: H * scale }}>
        <div className="tree-stage" style={{ width: W, height: H, transform: `scale(${scale})` }}>
          <svg className="tree-links" width={W} height={H} aria-hidden="true">
            {branches.map((b, bi) => {
              const d = curve(ROOT.x + ROOT.w, rootY, BR.x, bs[bi].cy);
              const on = sel.b === bi;
              return (
                <g key={b.id}>
                  <path className={`tl ${on ? "on" : ""}`} d={d} pathLength={1} style={{ d: `path("${d}")`, "--d": `${bi * 70}ms` } as React.CSSProperties} />
                  {grown && (
                    <circle r={3.5} className="pulse">
                      <animateMotion dur={`${2.4 + bi * 0.35}s`} repeatCount="indefinite" path={d} />
                    </circle>
                  )}
                  {b.leaves.map((l, li) => {
                    const ld = curve(BR.x + BR.w, bs[bi].cy, LF.x, bs[bi].leaves[li]);
                    const lon = on && sel.l === li;
                    return (
                      <g key={l.name} className={open[bi] ? "" : "shut"}>
                        <path
                          className={`tl leaf ${lon ? "on" : ""}`}
                          d={ld}
                          pathLength={1}
                          style={{ d: `path("${ld}")`, "--d": `${400 + bi * 70 + li * 40}ms` } as React.CSSProperties}
                        />
                        {grown && open[bi] && lon && (
                          <circle r={3} className="pulse hot">
                            <animateMotion dur="1.6s" repeatCount="indefinite" path={ld} />
                          </circle>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>

          <div className="tn root" style={{ left: ROOT.x, top: rootY - ROOT.h / 2, width: ROOT.w, height: ROOT.h, "--d": "0s" } as React.CSSProperties}>
            <span className="tn-inst">{root.inst}</span>
            <strong>{root.label}</strong>
          </div>

          {branches.map((b, bi) => (
            <div key={b.id}>
              <button
                className={`tn branch ${sel.b === bi ? "on" : ""} ${open[bi] ? "" : "closed"}`}
                style={{ left: BR.x, top: bs[bi].cy - BR.h / 2, width: BR.w, height: BR.h, "--d": `${0.25 + bi * 0.07}s` } as React.CSSProperties}
                onClick={() => toggle(bi)}
                aria-expanded={open[bi]}
              >
                <span className="tn-caret" aria-hidden="true">
                  ▸
                </span>
                <span className="tn-text">
                  <span className="tn-inst">{b.inst}</span>
                  <strong>{b.label}</strong>
                </span>
                <span className="tn-count">{b.leaves.length}</span>
              </button>
              {b.leaves.map((l, li) => (
                <button
                  key={l.name}
                  className={`tn leaf ${sel.b === bi && sel.l === li ? "on" : ""} ${open[bi] ? "" : "gone"}`}
                  style={{
                    left: LF.x,
                    top: bs[bi].leaves[li] - LF.h / 2,
                    width: LF.w,
                    height: LF.h,
                    "--d": `${0.7 + bi * 0.08 + li * 0.05}s`,
                  } as React.CSSProperties}
                  tabIndex={open[bi] ? 0 : -1}
                  aria-hidden={!open[bi]}
                  onMouseEnter={() => setSel({ b: bi, l: li })}
                  onFocus={() => setSel({ b: bi, l: li })}
                  onClick={() => setSel({ b: bi, l: li })}
                >
                  <i aria-hidden="true" />
                  {l.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Verdi-style hierarchy browser */}
      <ul className="tree-list" role="tree">
        <li role="treeitem" aria-expanded="true">
          <div className="tl-root">
            <span className="tn-inst">{root.inst}</span> {root.label}
          </div>
          <ul role="group">
            {branches.map((b, bi) => (
              <li key={b.id} role="treeitem" aria-expanded={open[bi]}>
                <button className={`tl-branch ${open[bi] ? "open" : ""}`} onClick={() => toggle(bi)}>
                  <span className="tn-caret">▸</span>
                  <span className="tn-inst">{b.inst}</span>
                  <strong>{b.label}</strong>
                </button>
                <ul role="group" className={open[bi] ? "" : "hidden"}>
                  {b.leaves.map((l, li) => (
                    <li key={l.name} role="treeitem">
                      <button
                        className={`tl-leaf ${sel.b === bi && sel.l === li ? "on" : ""}`}
                        onClick={() => setSel({ b: bi, l: li })}
                      >
                        {l.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </li>
      </ul>

      <div className="inspector" aria-live="polite">
        <div className="inspector-bar">
          <span>
            <i className="dot g" /> inspector
          </span>
          <code key={`${sel.b}-${sel.l}`} className="inspector-path">
            {root.inst}.{active.inst}.{leaf.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}
          </code>
        </div>
        <div className="inspector-body" key={`b-${sel.b}-${sel.l}`}>
          <div>
            <p className="inspector-kind">{active.label}</p>
            <h3>{leaf.name}</h3>
            <p>{leaf.note}</p>
          </div>
          {rel.length > 0 && (
            <div className="inspector-rel">
              <p className="inspector-kind">Seen in</p>
              {rel.slice(0, 3).map((p) => (
                <span className="tag" key={p.id}>
                  {p.id} · {p.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
