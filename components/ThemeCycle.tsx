"use client";
import { useEffect } from "react";
import { themes } from "@/components/Nav";

export default function ThemeCycle() {
  useEffect(() => {
    const root = document.documentElement;
    let timer: ReturnType<typeof setTimeout>;
    let fade: ReturnType<typeof setTimeout>;
    const enabled = () => { try { return localStorage.getItem("dv-theme-auto") !== "off"; } catch { return true; } };
    const schedule = () => {
      clearTimeout(timer);
      if (!enabled() || document.hidden) return;
      timer = setTimeout(() => {
        const i = themes.findIndex(t => t.id === root.getAttribute("data-theme"));
        const next = themes[(i + 1) % themes.length].id;
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          root.classList.add("theme-anim");
          clearTimeout(fade);
          fade = setTimeout(() => root.classList.remove("theme-anim"), 700);
        }
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("dv-theme", next); } catch {}
        schedule();
      }, 5 * 60_000);
    };
    // Manual selections also restart the five-minute interval.
    const observer = new MutationObserver(schedule);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("dv-theme-auto-change", schedule);
    document.addEventListener("visibilitychange", schedule);
    schedule();
    return () => { clearTimeout(timer); clearTimeout(fade); observer.disconnect(); root.classList.remove("theme-anim"); window.removeEventListener("dv-theme-auto-change", schedule); document.removeEventListener("visibilitychange", schedule); };
  }, []);
  return null;
}
