"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track, trackingAllowed } from "@/lib/track";

/**
 * Records one anonymous view per page, then how long the page was actually
 * visible and how far down it was read. Time only counts while the tab is
 * visible; it is sent when the reader leaves the page or switches away.
 */
export default function VisitTracker() {
  const pathname = usePathname();
  const last = useRef("");

  useEffect(() => {
    if (!pathname || !trackingAllowed(pathname)) return;
    // One view per page, even if the effect re-runs (e.g. React's development double mount).
    if (last.current !== pathname) {
      last.current = pathname;
      let referrer = "";
      try {
        if (document.referrer) {
          const url = new URL(document.referrer);
          if (url.origin !== location.origin) referrer = url.hostname;
        }
      } catch {}
      const source = new URLSearchParams(location.search).get("utm_source") ?? undefined;
      track({ path: pathname, referrer, source });
    }

    let visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
    let seconds = 0;
    let depth = 0;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      depth = Math.max(depth, max > 0 ? Math.round(((h.scrollTop + h.clientHeight) / h.scrollHeight) * 100) : 100);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    const flush = () => {
      if (visibleSince) seconds += (Date.now() - visibleSince) / 1000;
      visibleSince = 0;
      // The path is captured here: on navigation this runs after the URL has already changed.
      if (seconds >= 1) track({ type: "engage", path: pathname, seconds: Math.round(seconds), depth });
      seconds = 0;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else visibleSince = Date.now();
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [pathname]);

  return null;
}
