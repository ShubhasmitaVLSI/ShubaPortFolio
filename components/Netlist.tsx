"use client";

import { useEffect, useRef } from "react";

// Drifting "netlist": cells connect when close, link to the cursor, and
// occasionally fire a signal packet along a net. Colors follow the theme.
type Node = { x: number; y: number; vx: number; vy: number; r: number };
type Packet = { a: number; b: number; t: number; speed: number };

export default function Netlist() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0,
      h = 0,
      dpr = 1,
      raf = 0,
      visible = true;
    let nodes: Node[] = [];
    const packets: Packet[] = [];
    const mouse = { x: -9999, y: -9999 };
    let colors = { a: "#818cf8", b: "#22d3ee", line: "rgba(148,163,184,.2)" };
    const LINK = 130;

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      colors = {
        a: cs.getPropertyValue("--accent").trim() || colors.a,
        b: cs.getPropertyValue("--accent-2").trim() || colors.b,
        line: cs.getPropertyValue("--line-strong").trim() || colors.line,
      };
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / 16000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 1,
      }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        if (!reduce) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
          const dx = mouse.x - n.x,
            dy = mouse.y - n.y,
            d = Math.hypot(dx, dy);
          if (d < 160 && d > 1) {
            n.x += (dx / d) * 0.25;
            n.y += (dy / d) * 0.25;
          }
        }
      }
      // Nets
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i],
            b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.globalAlpha = (1 - d / LINK) * 0.55;
            ctx.strokeStyle = colors.line;
            // Manhattan-routed like a real net
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            if (!reduce && packets.length < 14 && Math.random() < 0.0009) {
              packets.push({ a: i, b: j, t: 0, speed: 0.012 + Math.random() * 0.02 });
            }
          }
        }
        const md = Math.hypot(nodes[i].x - mouse.x, nodes[i].y - mouse.y);
        if (md < 170) {
          ctx.globalAlpha = (1 - md / 170) * 0.9;
          ctx.strokeStyle = colors.a;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
      // Cells
      ctx.globalAlpha = 0.85;
      for (const n of nodes) {
        ctx.fillStyle = colors.a;
        ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
      }
      // Packets travel along the L-shaped route
      for (let k = packets.length - 1; k >= 0; k--) {
        const p = packets[k];
        p.t += p.speed;
        const a = nodes[p.a],
          b = nodes[p.b];
        if (p.t >= 1 || !a || !b) {
          packets.splice(k, 1);
          continue;
        }
        const lx = Math.abs(b.x - a.x),
          ly = Math.abs(b.y - a.y),
          tot = lx + ly || 1;
        const s = p.t * tot;
        const x = s < lx ? a.x + Math.sign(b.x - a.x) * s : b.x;
        const y = s < lx ? a.y : a.y + Math.sign(b.y - a.y) * (s - lx);
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors.b;
        ctx.shadowColor = colors.b;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };

    readColors();
    resize();
    frame();

    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was && !reduce) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) frame();
    });
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas className="netlist" ref={ref} aria-hidden="true" />;
}
