"use client";

import { useEffect, useState } from "react";

const phases = ["build_phase", "connect_phase", "end_of_elaboration", "run_phase", "report_phase"];

// A brief UVM-phase boot sequence, shown once per session. The head script adds
// `no-boot` on repeat views, and CSS hides it for reduced motion and no-JS.
export default function Boot() {
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("no-boot")) return setGone(true);
    const t1 = window.setTimeout(() => setLeaving(true), 1650);
    const t2 = window.setTimeout(() => {
      setGone(true);
      try {
        sessionStorage.setItem("dv-booted", "1");
      } catch {}
    }, 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (gone) return null;

  return (
    <div className={`boot ${leaving ? "leaving" : ""}`} aria-hidden="true">
      <div className="boot-inner">
        <div className="boot-mark">SS</div>
        <p className="boot-title">Elaborating testbench…</p>
        <ul>
          {phases.map((p, i) => (
            <li key={p} style={{ animationDelay: `${0.15 + i * 0.24}s` }}>
              <span>{p}</span>
              <b>✓</b>
            </li>
          ))}
        </ul>
        <div className="boot-bar">
          <i />
        </div>
      </div>
    </div>
  );
}
