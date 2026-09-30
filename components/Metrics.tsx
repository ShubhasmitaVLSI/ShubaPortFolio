"use client";

import { useEffect, useRef, useState } from "react";
import { metrics } from "@/lib/data";

function Count({ to, decimals }: { to: number; decimals: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        if (reduce) return setV(to);
        const start = performance.now();
        const dur = 1600;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - p, 4);
          setV(to * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return <span ref={ref}>{v.toFixed(decimals)}</span>;
}

export default function Metrics() {
  return (
    <div className="metrics stagger">
      {metrics.map((m) => (
        <article className="metric spot" key={m.label}>
          <div className="num">
            <Count to={m.value} decimals={m.decimals} />
            <span>{m.suffix}</span>
          </div>
          <small>{m.label}</small>
          <em>{m.note}</em>
        </article>
      ))}
    </div>
  );
}
