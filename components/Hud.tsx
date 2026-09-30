"use client";

import { useEffect, useRef, useState } from "react";
import { phases } from "@/lib/dv";

const R = 15;
const C = 2 * Math.PI * R;

/** UVM phase rail (desktop) + "page coverage" meter that closes at 100%. */
export default function Hud() {
  const [active, setActive] = useState("top");
  const [cov, setCov] = useState(0);
  const [closed, setClosed] = useState(false);
  const burstRef = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    phases.forEach((p) => {
      const el = document.getElementById(p.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? Math.min(100, Math.round((h.scrollTop / max) * 100)) : 0;
      setCov(pct);
      if (pct >= 99 && !fired.current) {
        fired.current = true;
        setClosed(true);
        burst();
      }
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Coverage closed: a burst of 0/1 bits from the meter.
  function burst() {
    const host = burstRef.current;
    if (!host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < 26; i++) {
      const b = document.createElement("span");
      b.className = "bit";
      b.textContent = Math.random() > 0.5 ? "1" : "0";
      const a = (Math.PI * 2 * i) / 26 + Math.random() * 0.3;
      const d = 50 + Math.random() * 70;
      b.style.setProperty("--tx", `${Math.cos(a) * d}px`);
      b.style.setProperty("--ty", `${Math.sin(a) * d - 30}px`);
      b.style.animationDelay = `${Math.random() * 120}ms`;
      host.appendChild(b);
      window.setTimeout(() => b.remove(), 1400);
    }
  }

  const idx = phases.findIndex((p) => p.id === active);

  return (
    <>
      <nav className="phase-rail" aria-label="Sections as UVM phases">
        <span className="phase-rail-line" aria-hidden="true">
          <i style={{ transform: `scaleY(${Math.max(0, idx) / (phases.length - 1)})` }} />
        </span>
        {phases.map((p, i) => (
          <a
            key={p.id}
            href={`#${p.id}`}
            className={`phase-dot ${p.id === active ? "on" : ""} ${i < idx ? "done" : ""}`}
            aria-label={`${p.phase}: ${p.label}`}
            aria-current={p.id === active ? "true" : undefined}
          >
            <span className="phase-tip">
              <code>{p.phase}</code>
              <small>{p.label}</small>
            </span>
          </a>
        ))}
      </nav>

      <div className={`cov ${closed ? "closed" : ""}`} role="status" aria-label={`Page coverage ${cov} percent`}>
        <div className="cov-burst" ref={burstRef} aria-hidden="true" />
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r={R} className="cov-track" />
          <circle
            cx="20"
            cy="20"
            r={R}
            className="cov-fill"
            strokeDasharray={C}
            strokeDashoffset={C - (C * cov) / 100}
          />
        </svg>
        <span className="cov-text">
          <small>{closed ? "coverage closed" : "page coverage"}</small>
          <b>{closed ? "100% ✓" : `${cov}%`}</b>
        </span>
        <span className="cov-phase" key={active}>
          {phases[Math.max(0, idx)].phase}
        </span>
      </div>
    </>
  );
}
