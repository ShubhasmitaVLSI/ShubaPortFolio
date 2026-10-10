// Client-side helper for the cookie-free analytics endpoint (/api/visits).
// Respects Do Not Track and Global Privacy Control; failures are ignored.

const PRIVATE_PATH = /^\/blog\/(login|manage|new|visitors)(\/|$)/;

export function trackingAllowed(pathname = window.location.pathname) {
  const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
  return navigator.doNotTrack !== "1" && !gpc && !PRIVATE_PATH.test(pathname) && !pathname.endsWith("/edit");
}

export function track(data: Record<string, unknown>) {
  if (!trackingAllowed(typeof data.path === "string" ? data.path : undefined)) return;
  void fetch("/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: window.location.pathname, ...data }),
    keepalive: true,
  }).catch(() => {});
}

const searched = new Set<string>();
let pending = 0;

/** Record a site search once the visitor stops typing; each query is sent once per page. */
export function trackSearch(query: string, hits: number) {
  window.clearTimeout(pending);
  const q = query.trim().toLowerCase();
  if (q.length < 2) return;
  pending = window.setTimeout(() => {
    if (searched.has(q)) return;
    searched.add(q);
    track({ type: "search", q, hits });
  }, 1500);
}
