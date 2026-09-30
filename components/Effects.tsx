"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "01XZ#$%&*<>/\\=+";

// Decode a label from random glyphs, like a bus resolving from X to a value.
function scramble(el: HTMLElement) {
  if (el.dataset.scrambled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.dataset.scrambled = "1";
  const text = el.textContent ?? "";
  let frame = 0;
  const total = 22;
  const tick = () => {
    frame++;
    const done = Math.floor((frame / total) * text.length);
    el.textContent = text
      .split("")
      .map((c, i) => (i < done || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
      .join("");
    if (frame < total) requestAnimationFrame(tick);
    else el.textContent = text;
  };
  requestAnimationFrame(tick);
}

/** Global page effects: scroll progress, custom cursor, reveal-on-scroll, card spotlight, tilt, magnetism. */
export default function Effects() {
  const bar = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  // Scroll progress
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (bar.current) bar.current.style.width = `${p}%`;
      document.body.classList.toggle("scrolled", h.scrollTop > 24);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
            e.target
              .querySelectorAll<HTMLElement>(":scope > .section-head .kicker-text, :scope > .kicker .kicker-text")
              .forEach(scramble);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Magnetic buttons + 3D tilt with glare (fine pointers, motion allowed)
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const TILT = ".card, .metric, .road, .edu-card, .approach-card, .ai-card, .stack-card";
    let tilted: HTMLElement | null = null;
    let magnet: HTMLElement | null = null;

    const reset = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.transform = "";
    };
    const move = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const card = t?.closest?.<HTMLElement>(TILT) ?? null;
      if (card !== tilted) {
        reset(tilted);
        tilted = card;
      }
      if (card) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-4px)`;
        card.style.setProperty("--gx", `${(px + 0.5) * 100}%`);
        card.style.setProperty("--gy", `${(py + 0.5) * 100}%`);
      }
      const m = t?.closest?.<HTMLElement>(".magnetic") ?? null;
      if (m !== magnet) {
        reset(magnet);
        magnet = m;
      }
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        m.style.transform = `translate(${dx * 0.28}px, ${dy * 0.4}px)`;
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      reset(tilted);
      reset(magnet);
    };
  }, []);

  // Custom cursor + spotlight (fine pointers only, respects reduced motion)
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onSpot = (e: PointerEvent) => {
      const card = (e.target as HTMLElement)?.closest?.<HTMLElement>(".spot");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    window.addEventListener("pointermove", onSpot, { passive: true });

    if (!fine || reduce) return () => window.removeEventListener("pointermove", onSpot);

    document.body.classList.add("cursor-on");
    let x = innerWidth / 2,
      y = innerHeight / 2,
      rx = x,
      ry = y,
      raf = 0;

    const move = (e: PointerEvent) => {
      document.body.classList.add("cursor-moved");
      x = e.clientX;
      y = e.clientY;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const t = e.target as HTMLElement;
      const hot = !!t?.closest?.("a, button, [role='button'], .card, input, textarea");
      ring.current?.classList.toggle("hot", hot);
    };
    const loop = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    const down = () => ring.current?.classList.add("press");
    const up = () => ring.current?.classList.remove("press");
    const leave = () => document.body.classList.add("cursor-hidden");
    const enter = () => document.body.classList.remove("cursor-hidden");

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.addEventListener("mouseleave", leave);
    document.addEventListener("mouseenter", enter);
    raf = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove("cursor-on");
      window.removeEventListener("pointermove", onSpot);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("mouseleave", leave);
      document.removeEventListener("mouseenter", enter);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="grid-bg" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="progress" ref={bar} />
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
      <div className="cursor-ring" ref={ring} aria-hidden="true" />
    </>
  );
}
