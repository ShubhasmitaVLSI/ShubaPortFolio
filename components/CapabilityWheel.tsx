"use client";

import { useEffect, useRef, useState } from "react";
import { profile, projects } from "@/lib/data";
import { focusOn, skillsForProject } from "@/lib/links";
import { capabilityNodes } from "./CircuitAtlas";

const N = capabilityNodes.length;
const STEP = 360 / N;
const R = 200; // orbit radius in the 600-unit viewBox
const AUTO_MS = 5200;

const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
};
// Node i sits at i * STEP, measured clockwise from 12 o'clock.
const angleOf = (i: number) => i * STEP - 90;

/** Radial capability map: the selected capability rotates to the top of the dial. */
export default function CapabilityWheel() {
  const [sel, setSel] = useState(0);
  const [rot, setRot] = useState(0);
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  const [hold, setHold] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const rotRef = useRef(0);

  const select = (i: number) => {
    const next = ((i % N) + N) % N;
    // Turn the shortest way round so the dial never spins a full lap.
    const target = -next * STEP;
    const delta = ((((target - rotRef.current) % 360) + 540) % 360) - 180;
    rotRef.current += delta;
    setRot(rotRef.current);
    setSel(next);
  };
  const pick = (i: number) => {
    setAuto(false);
    select(i);
  };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAuto(false);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Tour the capabilities on its own until the visitor takes over.
  useEffect(() => {
    if (!auto || !visible || hold) return;
    const t = window.setTimeout(() => select(sel + 1), AUTO_MS);
    return () => clearTimeout(t);
  }, [auto, visible, hold, sel]);

  const project = projects[sel];
  const skills = skillsForProject(project.id).slice(0, 6);

  return (
    <div
      className="wheel"
      ref={root}
      style={{ "--rot": `${rot}deg` } as React.CSSProperties}
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          pick(sel + 1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          pick(sel - 1);
        }
      }}
    >
      <div className="wheel-dial">
        <svg className="wheel-svg" viewBox="-300 -300 600 600" aria-hidden="true">
          <defs>
            <radialGradient id="wheel-glow">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle r={290} fill="url(#wheel-glow)" />
          <circle r={284} className="wheel-ticks" pathLength={360} />
          <circle r={268} className="wheel-scan" pathLength={360} />
          <circle r={R} className="wheel-orbit" />
          <circle r={118} className="wheel-inner" />
          <g className="wheel-rotor">
            {capabilityNodes.map((n, i) => {
              const a = polar(angleOf(i), 74);
              const b = polar(angleOf(i), R);
              const on = i === sel;
              return (
                <g key={n.label} className={on ? "on" : ""}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="wheel-spoke" />
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="wheel-signal" />
                  <circle cx={b.x} cy={b.y} r={on ? 5 : 3} className="wheel-pad" />
                </g>
              );
            })}
          </g>
          <path d="M0,-296 l-8,-12 h16 Z" className="wheel-pointer" />
        </svg>

        <div className="wheel-core">
          <span className="atlas-key">PRIMARY ENTITY</span>
          <strong>
            SS<span> / DV</span>
          </strong>
          <small>
            {profile.first} {profile.last}
          </small>
          <span className="wheel-count">
            {String(sel + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}
          </span>
        </div>

        <div className="wheel-orbiter">
          {capabilityNodes.map((n, i) => {
            const p = polar(angleOf(i), (R / 600) * 100);
            return (
              <button
                key={n.label}
                className={`wheel-node ${i === sel ? "on" : ""}`}
                style={{ left: `${50 + p.x}%`, top: `${50 + p.y}%` }}
                aria-pressed={i === sel}
                aria-controls="wheel-detail"
                onClick={() => pick(i)}
              >
                <span className="wheel-node-idx">{String(i + 1).padStart(2, "0")}</span>
                {n.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="wheel-detail" id="wheel-detail" aria-live="polite">
        <div className="wheel-detail-bar">
          <span>
            <i className="live" /> capability {String(sel + 1).padStart(2, "0")}
          </span>
          <span className="wheel-nav">
            <button className="round" onClick={() => pick(sel - 1)} aria-label="Previous capability">
              ←
            </button>
            <button className="round" onClick={() => pick(sel + 1)} aria-label="Next capability">
              →
            </button>
          </span>
        </div>
        <div className="wheel-detail-body" key={project.id}>
          <h3>{project.title}</h3>
          <p>{project.detail}</p>
          <ol className="wheel-flow" aria-label="Verification flow">
            {project.layers.map((l, i) => (
              <li key={l} style={{ animationDelay: `${120 + i * 90}ms` }}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                {l}
              </li>
            ))}
          </ol>
          {skills.length > 0 && (
            <div className="wheel-skills">
              <span className="wheel-label">Skills · open in tree</span>
              {skills.map((s) => (
                <button key={s.name} className="tag link" onClick={() => focusOn({ kind: "skill", name: s.name })}>
                  {s.name}
                </button>
              ))}
            </div>
          )}
          <div className="wheel-actions">
            <button className="btn primary" onClick={() => focusOn({ kind: "project", id: project.id })}>
              Open case file
            </button>
            <a className="btn ghost" href={`/projects#project-${project.id}`}>
              Archive ↗
            </a>
          </div>
        </div>
        <div className={`wheel-timer ${auto && visible && !hold ? "run" : ""}`} key={`t-${sel}`} aria-hidden="true">
          <i style={{ animationDuration: `${AUTO_MS}ms` }} />
        </div>
      </div>
    </div>
  );
}
