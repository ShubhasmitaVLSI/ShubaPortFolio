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
    const LEVELS = 6;
    // Reused each frame: line endpoints per opacity level, for nets and cursor probes.
    const nets: number[][] = Array.from({ length: LEVELS }, () => []);
    const probes: number[][] = Array.from({ length: LEVELS }, () => []);

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
      // Nets. Lines are grouped into a few opacity levels and each group is stroked
      // once, instead of one stroke per line (thousands per frame).
      for (const p of nets) p.length = 0;
      for (const p of probes) p.length = 0;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = Math.abs(a.x - b.x);
          if (dx >= LINK) continue;
          const d = Math.hypot(dx, a.y - b.y);
          if (d < LINK) {
            nets[Math.min(LEVELS - 1, Math.floor((1 - d / LINK) * LEVELS))].push(a.x, a.y, b.x, b.y);
            if (!reduce && packets.length < 14 && Math.random() < 0.0009) {
              packets.push({ a: i, b: j, t: 0, speed: 0.012 + Math.random() * 0.02 });
            }
          }
        }
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < 170) probes[Math.min(LEVELS - 1, Math.floor((1 - md / 170) * LEVELS))].push(a.x, a.y);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.line;
      nets.forEach((segs, level) => {
        if (!segs.length) return;
        ctx.globalAlpha = ((level + 1) / LEVELS) * 0.55;
        ctx.beginPath();
        // Manhattan-routed like a real net
        for (let k = 0; k < segs.length; k += 4) {
          ctx.moveTo(segs[k], segs[k + 1]);
          ctx.lineTo(segs[k + 2], segs[k + 1]);
          ctx.lineTo(segs[k + 2], segs[k + 3]);
        }
        ctx.stroke();
      });
      ctx.strokeStyle = colors.a;
      probes.forEach((pts, level) => {
        if (!pts.length) return;
        ctx.globalAlpha = ((level + 1) / LEVELS) * 0.9;
        ctx.beginPath();
        for (let k = 0; k < pts.length; k += 2) {
          ctx.moveTo(pts[k], pts[k + 1]);
          ctx.lineTo(mouse.x, mouse.y);
        }
        ctx.stroke();
      });
      // Cells
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = colors.a;
      ctx.beginPath();
      for (const n of nodes) ctx.rect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
      ctx.fill();
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
        // A faint halo instead of shadowBlur, which is slow to draw.
        ctx.fillStyle = colors.b;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
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
