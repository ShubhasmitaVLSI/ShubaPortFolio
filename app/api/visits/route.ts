import { currentAdmin } from "@/lib/auth";
import { recordVisit } from "@/lib/visits";
export const runtime = "nodejs";
let windowStart = 0;
let count = 0;
export async function POST(request: Request) {
  const empty = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1" || await currentAdmin()) return empty();
  if (Date.now() - windowStart > 60_000) { windowStart = Date.now(); count = 0; }
  if (++count > 120) return new Response(null, { status: 429 });
  if (Number(request.headers.get("content-length")) > 1024) return new Response(null, { status: 413 });
  const text = await request.text();
  if (text.length > 1024) return new Response(null, { status: 413 });
  let body;
  try { body = JSON.parse(text); } catch { return new Response(null, { status: 400 }); }
  const page = body?.path;
  if (typeof page !== "string" || page.length > 240 || !/^\/(?:[a-zA-Z0-9_/-]*)$/.test(page) || page.includes("//") || !(page === "/" || page === "/projects" || page === "/book" || page === "/blog" || page.startsWith("/blog/") || page === "/lexicon" || page.startsWith("/lexicon/"))) return new Response(null, { status: 400 });
  if (/^\/blog\/(login|manage|new|visitors)(\/|$)/.test(page) || page.endsWith("/edit")) return empty();
  const referrer = typeof body.referrer === "string" && /^[a-zA-Z0-9.-]{1,253}$/.test(body.referrer) ? body.referrer.toLowerCase() : "";
  const ua = request.headers.get("user-agent") || "";
  if (/bot|crawler|spider|headless/i.test(ua)) return empty();
  const browser = /Edg/i.test(ua) ? "Edge" : /Firefox/i.test(ua) ? "Firefox" : /Chrome|CriOS/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : "Other";
  const device = /iPad|Tablet/i.test(ua) ? "Tablet" : /Mobile|iPhone|Android/i.test(ua) ? "Mobile" : "Desktop";
  try { await recordVisit({ time: new Date().toISOString(), path: page, referrer, browser, device }); } catch { return new Response(null, { status: 503 }); }
  return empty();
}
