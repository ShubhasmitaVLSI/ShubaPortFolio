import { currentAdmin } from "@/lib/auth";
import { recordVisit, visitorTag, type Visit } from "@/lib/visits";

export const runtime = "nodejs";

// Best-effort flood guard per server instance.
let windowStart = 0;
let count = 0;

const PUBLIC_PATH = /^\/(?:[a-zA-Z0-9_/-]*)$/;
const PRIVATE_PATH = /^\/blog\/(login|manage|new|visitors)(\/|$)/;
const isPublic = (page: string) =>
  page === "/" || page === "/projects" || page === "/book" || page === "/blog" || page.startsWith("/blog/") || page === "/lexicon" || page.startsWith("/lexicon/");

/** Search text worth keeping: short, plain words. Anything that looks personal is dropped. */
function cleanQuery(raw: unknown) {
  if (typeof raw !== "string") return "";
  const q = raw.toLowerCase().replace(/\s+/g, " ").trim();
  if (q.length < 2 || q.length > 40 || q.includes("@") || /\d{5,}/.test(q) || !/^[a-z0-9 +#./_-]+$/.test(q)) return "";
  return q;
}

const int = (raw: unknown, min: number, max: number) =>
  typeof raw === "number" && Number.isFinite(raw) ? Math.min(max, Math.max(min, Math.round(raw))) : null;

export async function POST(request: Request) {
  const empty = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1" || (await currentAdmin())) return empty();
  if (Date.now() - windowStart > 60_000) {
    windowStart = Date.now();
    count = 0;
  }
  if (++count > 300) return new Response(null, { status: 429 });
  if (Number(request.headers.get("content-length")) > 1024) return new Response(null, { status: 413 });
  const text = await request.text();
  if (text.length > 1024) return new Response(null, { status: 413 });
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }

  const page = body?.path;
  if (typeof page !== "string" || page.length > 240 || !PUBLIC_PATH.test(page) || page.includes("//") || !isPublic(page))
    return new Response(null, { status: 400 });
  if (PRIVATE_PATH.test(page) || page.endsWith("/edit")) return empty();
  const ua = request.headers.get("user-agent") || "";
  if (/bot|crawler|spider|headless/i.test(ua)) return empty();

  const kind = body.type === "engage" || body.type === "search" ? body.type : "view";
  const time = new Date().toISOString();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
  const event: Visit = {
    kind,
    time,
    path: page,
    referrer: typeof body.referrer === "string" && /^[a-zA-Z0-9.-]{1,253}$/.test(body.referrer) ? body.referrer.toLowerCase() : "",
    browser: /Edg/i.test(ua) ? "Edge" : /Firefox/i.test(ua) ? "Firefox" : /Chrome|CriOS/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : "Other",
    device: /iPad|Tablet/i.test(ua) ? "Tablet" : /Mobile|iPhone|Android/i.test(ua) ? "Mobile" : "Desktop",
    v: visitorTag(ip, ua),
  };

  // Coarse location from the host's geo headers (Vercel); the IP itself is never stored.
  const country = request.headers.get("x-vercel-ip-country") ?? "";
  if (/^[A-Z]{2}$/.test(country)) event.country = country;
  try {
    const city = decodeURIComponent(request.headers.get("x-vercel-ip-city") ?? "").replace(/[\u0000-\u001f<>]/g, "").trim();
    if (city && city.length <= 60) event.city = city;
  } catch {}
  if (typeof body.source === "string" && /^[a-zA-Z0-9._-]{1,32}$/.test(body.source)) event.source = body.source.toLowerCase();

  if (kind === "engage") {
    const sec = int(body.seconds, 0, 3600);
    const depth = int(body.depth, 0, 100);
    if (sec === null || sec < 1 || depth === null) return new Response(null, { status: 400 });
    Object.assign(event, { sec, depth });
  }
  if (kind === "search") {
    const q = cleanQuery(body.q);
    const hits = int(body.hits, 0, 999);
    if (!q || hits === null) return empty();
    Object.assign(event, { q, hits });
  }

  try {
    await recordVisit(event);
  } catch {
    return new Response(null, { status: 503 });
  }
  return empty();
}
