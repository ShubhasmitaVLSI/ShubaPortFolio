"use client";

import { useEffect, useRef, useState } from "react";
import { markRead } from "@/components/blog/ReadingPath";

type Zoomed = { src: string; alt: string; caption: string };

/**
 * Reading effects for a rendered post: blocks rise in as they scroll into view,
 * images shimmer until loaded and open full size on click, wide tables hint that
 * they scroll, and the post counts as read once its end is reached.
 *
 * Everything is additive: blocks are only hidden by JS, only when they start
 * below the fold, and never under reduced motion or in print.
 */
export function PostMotion({ slug }: { slug: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [zoomed, setZoomed] = useState<Zoomed | null>(null);

  // Scroll reveal
  useEffect(() => {
    const prose = document.querySelector<HTMLElement>(".post .prose");
    if (!prose || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const blocks = [...prose.children] as HTMLElement[];
    let pending = blocks.filter((el) => el.tagName !== "HR" && el.getBoundingClientRect().top >= window.innerHeight);
    for (const el of pending) {
      // Rows and items enter one after another; cap the delay so long lists don't drag.
      el.querySelectorAll<HTMLElement>(":scope > li, :scope tbody > tr").forEach((c, i) => c.style.setProperty("--i", String(Math.min(i, 8))));
      el.classList.add("pm");
    }

    // A block is revealed once its top passes the reveal line, so blocks skipped by a
    // fast scroll or a jump to a section are shown too, never left hidden above the reader.
    let raf = 0;
    const check = () => {
      raf = 0;
      const line = window.innerHeight * 0.94;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top >= line) return true;
        el.classList.add("pm-in");
        return false;
      });
      if (!pending.length) window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Print everything, including blocks the reader never scrolled to.
    const showAll = () => blocks.forEach((b) => b.classList.add("pm-in"));
    window.addEventListener("beforeprint", showAll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("beforeprint", showAll);
      blocks.forEach((b) => b.classList.remove("pm", "pm-in"));
    };
  }, []);

  // Image loading states and click-to-zoom
  useEffect(() => {
    const imgs = [...document.querySelectorAll<HTMLImageElement>(".post .prose img")];
    const cleanups: (() => void)[] = [];
    for (const img of imgs) {
      const holder = img.closest("figure") ?? img;
      const settle = () => {
        holder.classList.remove("img-loading");
        if (!img.naturalWidth) holder.classList.add("img-error");
      };
      if (!img.complete) {
        holder.classList.add("img-loading");
        img.addEventListener("load", settle, { once: true });
        img.addEventListener("error", settle, { once: true });
      } else if (!img.naturalWidth) holder.classList.add("img-error");

      if (img.closest("a")) continue; // a linked image keeps its link
      const open = () => {
        if (!img.naturalWidth) return;
        const caption = img.closest("figure")?.querySelector("figcaption")?.textContent ?? "";
        setZoomed({ src: img.currentSrc || img.src, alt: img.alt, caption });
      };
      const key = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      };
      img.classList.add("zoomable");
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", `Enlarge image${img.alt ? `: ${img.alt}` : ""}`);
      img.addEventListener("click", open);
      img.addEventListener("keydown", key);
      cleanups.push(() => {
        img.removeEventListener("click", open);
        img.removeEventListener("keydown", key);
      });
    }
    return () => cleanups.forEach((c) => c());
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (zoomed && !d.open) d.showModal();
    if (!zoomed && d.open) d.close();
  }, [zoomed]);

  // Wide tables and timing diagrams: fade the edge that still has content to scroll to.
  useEffect(() => {
    const boxes = [...document.querySelectorAll<HTMLElement>(".post .prose .table-wrap, .post .prose .wave-scroll")];
    const update = (el: HTMLElement) => {
      const more = el.scrollWidth - el.clientWidth > 2;
      el.classList.toggle("scroll-x", more);
      el.classList.toggle("scroll-end", !more || el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
      el.classList.toggle("scroll-start", el.scrollLeft <= 2);
    };
    const ro = new ResizeObserver((entries) => entries.forEach((e) => update(e.target as HTMLElement)));
    const onScroll = (e: Event) => update(e.currentTarget as HTMLElement);
    boxes.forEach((b) => {
      ro.observe(b);
      b.addEventListener("scroll", onScroll, { passive: true });
    });
    return () => {
      ro.disconnect();
      boxes.forEach((b) => b.removeEventListener("scroll", onScroll));
    };
  }, []);

  // Count the post as read when its end comes into view.
  useEffect(() => {
    const end = document.querySelector(".post .post-foot");
    if (!end) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        markRead(slug);
        io.disconnect();
      }
    });
    io.observe(end);
    return () => io.disconnect();
  }, [slug]);

  return (
    <dialog
      ref={dialog}
      className="lightbox"
      aria-label={zoomed?.alt || "Image"}
      onClose={() => setZoomed(null)}
      onClick={(e) => e.target === e.currentTarget && setZoomed(null)}
    >
      {zoomed && (
        <figure>
          <img src={zoomed.src} alt={zoomed.alt} />
          {zoomed.caption && <figcaption>{zoomed.caption}</figcaption>}
        </figure>
      )}
      <button type="button" className="lightbox-close" onClick={() => setZoomed(null)} aria-label="Close image">
        ×
      </button>
    </dialog>
  );
}
