"use client";

import { useEffect, useRef, useState } from "react";

type Item = { id: string; label: string };

/**
 * Numbered section navigator: a sticky rail with a progress line on wide screens,
 * a sticky swipeable chip bar on narrow ones. Highlights the section being read.
 */
export function SectionRail({ items }: { items: readonly Item[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");
  const bar = useRef<HTMLOListElement>(null);
  const at = Math.max(0, items.findIndex((i) => i.id === active));

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items]);

  // Keep the active chip in view in the horizontal bar, without moving the page.
  useEffect(() => {
    const list = bar.current;
    const chip = list?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!list || !chip || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: chip.offsetLeft - list.clientWidth / 2 + chip.offsetWidth / 2, behavior: "smooth" });
  }, [active]);

  return (
    <nav className="lex-rail" aria-label="Sections">
      <ol ref={bar} style={{ "--rail": `${((at + 1) / items.length) * 100}%` } as React.CSSProperties}>
        {items.map((it, i) => (
          <li key={it.id} data-id={it.id} className={i < at ? "passed" : i === at ? "on" : ""}>
            <a href={`#${it.id}`} aria-current={i === at ? "true" : undefined}>
              <span className="lex-rail-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="lex-rail-label">{it.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
