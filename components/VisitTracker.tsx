"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
export default function VisitTracker() {
  const pathname = usePathname();
  const last = useRef("");
  useEffect(() => {
    if (!pathname || last.current === pathname || /^\/blog\/(login|manage|new|visitors)(\/|$)/.test(pathname) || pathname.endsWith("/edit")) return;
    last.current = pathname;
    if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
    let referrer = "";
    try { if (document.referrer) { const url = new URL(document.referrer); if (url.origin !== location.origin) referrer = url.hostname; } } catch {}
    void fetch("/api/visits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: pathname, referrer }), keepalive: true }).catch(() => {});
  }, [pathname]);
  return null;
}
