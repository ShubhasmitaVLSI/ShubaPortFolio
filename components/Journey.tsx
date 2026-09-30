"use client";

import { useEffect, useRef } from "react";
import { experience } from "@/lib/data";

export default function Journey() {
  const wrap = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);

  // The spine fills as the timeline scrolls through the viewport.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = wrap.current;
      if (!el || !fill.current) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
      fill.current.style.transform = `scaleY(${p})`;
      el.querySelectorAll<HTMLElement>(".journey-card").forEach((c) => {
        const cr = c.getBoundingClientRect();
        c.classList.toggle("lit", cr.top < vh * 0.6);
      });
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

  return (
    <div className="journey" ref={wrap}>
      <div className="spine" aria-hidden="true">
        <div className="spine-fill" ref={fill} />
      </div>
      {experience.map((r, i) => (
        <article className={`journey-card ${i % 2 ? "left" : "right"}`} key={r.org}>
          <span className="journey-node" aria-hidden="true" />
          <div className="journey-inner spot">
            <time>{r.period}</time>
            <h3>{r.org}</h3>
            <p className="journey-role">
              <strong>{r.title}</strong>. {r.blurb}
            </p>
            {r.duties.length > 0 && (
            <div className="duties">
              {r.duties.map((d) => (
                <div key={d.heading}>
                  <h4>{d.heading}</h4>
                  <ul>
                    {d.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
