import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createHmac, randomUUID } from "node:crypto";

// Cookie-free, anonymous analytics for the author dashboard.
//
// Events (page views, engaged reading time, site searches and bookings) are kept
// for 30 days. A count of views and of unique visitors per IST day is kept
// permanently, so trends run from launch. Visitors are counted with a hash of
// IP + browser and a salt that changes every day: the IP is never stored, and
// the same person cannot be linked from one day to the next.

export type EventKind = "view" | "engage" | "search" | "booking";

export type Visit = {
  kind?: EventKind; // absent on views recorded before event kinds existed
  time: string;
  path: string;
  referrer: string;
  browser: string;
  device: string;
  /** Daily-rotating anonymous visitor tag. */
  v?: string;
  /** utm_source from the landing URL, when present. */
  source?: string;
  country?: string;
  city?: string;
  /** engage: seconds the page was visible, and furthest scroll depth (0-100). */
  sec?: number;
  depth?: number;
  /** search: the query and how many results it found. */
  q?: string;
  hits?: number;
  /** booking: what the guest chose to share (never their email or message). */
  name?: string;
  company?: string;
  topic?: string;
};

export type DayCount = { date: string; count: number; visitors: number };

const DAYS = 30;
const LIMIT = 10_000;
const KEY = "portfolio:visits";
const DAY_KEY = "portfolio:visits:days";
const VISITOR_DAY_KEY = "portfolio:visitors:days";
const TOTALS_FILE = "daily-totals.json";
const VISITOR_TOTALS_FILE = "daily-visitors.json";

const directory = () => path.resolve(process.env.ANALYTICS_DIR || path.join(process.cwd(), ".analytics"));
const url = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const cutoff = () => Date.now() - DAYS * 86400_000;

/** Calendar day in IST, the time zone the dashboard reports in (YYYY-MM-DD). */
export const istDay = (time: string | number | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(time));

/** On Vercel the disk is read-only, so analytics need Redis there. */
export const analyticsAvailable = () => Boolean(url() && token()) || !process.env.VERCEL;

/** Anonymous visitor tag: stable for one IST day, unlinkable across days, not reversible to the IP. */
export function visitorTag(ip: string, userAgent: string, time = Date.now()) {
  const secret = process.env.ANALYTICS_SALT || process.env.BLOG_AUTH_SECRET || "local-analytics";
  const daySalt = createHmac("sha256", secret).update("visitors:" + istDay(time)).digest();
  return createHmac("sha256", daySalt).update(ip + "\u0000" + userAgent).digest("hex").slice(0, 12);
}

async function redis<T>(command: string[]): Promise<T> {
  const response = await fetch(url()!, {
    method: "POST",
    headers: { Authorization: "Bearer " + token(), "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  const data = (await response.json()) as { result: T; error?: string };
  if (!response.ok || data.error) throw Error("Analytics storage unavailable");
  return data.result;
}

function parse(raw: string): Visit | null {
  try {
    const v = JSON.parse(raw);
    const valid = ["time", "path", "referrer", "browser", "device"].every((k) => typeof v[k] === "string");
    return valid && Date.parse(v.time) >= cutoff() ? v : null;
  } catch {
    return null;
  }
}

const isDayFile = (name: string) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(name);
const isView = (e: Visit) => (e.kind ?? "view") === "view";

async function readJson(name: string): Promise<Record<string, unknown>> {
  try {
    const data = JSON.parse(await fs.readFile(path.join(directory(), name), "utf8"));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

/** Local file store: per-day count of distinct visitor tags, from a small seen-list kept for recent days. */
async function countLocalVisitor(day: string, tag: string) {
  const seenFile = `seen-${day}.json`;
  const seen = new Set((await readJson(seenFile)).tags as string[] | undefined);
  if (seen.has(tag)) return;
  seen.add(tag);
  await fs.writeFile(path.join(directory(), seenFile), JSON.stringify({ tags: [...seen] }), "utf8");
  const totals = await readJson(VISITOR_TOTALS_FILE);
  totals[day] = seen.size;
  await fs.writeFile(path.join(directory(), VISITOR_TOTALS_FILE), JSON.stringify(totals), "utf8");
}

export async function recordVisit(visit: Visit) {
  if (!analyticsAvailable()) return;
  const day = istDay(visit.time);
  const view = isView(visit);
  if (url() && token()) {
    // Random event ID prevents same-millisecond events overwriting one another; it is not a visitor ID.
    await redis(["ZADD", KEY, String(Date.parse(visit.time)), JSON.stringify({ ...visit, event: randomUUID() })]);
    if (view) {
      await redis(["HINCRBY", DAY_KEY, day, "1"]);
      if (visit.v) {
        const hll = `portfolio:visitors:${day}`;
        await redis(["PFADD", hll, visit.v]);
        await redis(["EXPIRE", hll, String(3 * 86400)]);
        await redis(["HSET", VISITOR_DAY_KEY, day, String(await redis<number>(["PFCOUNT", hll]))]);
      }
    }
    await redis(["ZREMRANGEBYSCORE", KEY, "-inf", String(cutoff())]);
    await redis(["ZREMRANGEBYRANK", KEY, "0", String(-LIMIT - 1)]);
    await redis(["EXPIRE", KEY, String(DAYS * 86400)]);
    return;
  }
  const dir = directory();
  await fs.mkdir(dir, { recursive: true });
  for (const name of await fs.readdir(dir)) {
    const stale = (date: string) => Date.parse(date) + 86400_000 < cutoff();
    if (isDayFile(name) && stale(name.slice(0, 10))) await fs.rm(path.join(dir, name), { force: true });
    // Seen-lists exist only to count today's visitors; keep two days for the IST/UTC overlap.
    const seen = name.match(/^seen-(\d{4}-\d{2}-\d{2})\.json$/);
    if (seen && Date.parse(seen[1]) + 2 * 86400_000 < Date.now()) await fs.rm(path.join(dir, name), { force: true });
  }
  const file = path.join(dir, visit.time.slice(0, 10) + ".jsonl");
  const size = await fs.stat(file).then((s) => s.size).catch(() => 0);
  // Raw detail is capped per day; the day's totals still count every view.
  if (size < 4_000_000) await fs.appendFile(file, JSON.stringify(visit) + "\n", "utf8");
  if (!view) return;
  const totals = await readJson(TOTALS_FILE);
  totals[day] = ((totals[day] as number) ?? 0) + 1;
  await fs.writeFile(path.join(dir, TOTALS_FILE), JSON.stringify(totals), "utf8");
  if (visit.v) await countLocalVisitor(day, visit.v);
}

/** Events from the last 30 days (most recent first, at most 10,000). */
export async function listVisits(): Promise<Visit[]> {
  if (!analyticsAvailable()) return [];
  let rows: string[];
  if (url() && token()) rows = await redis<string[]>(["ZREVRANGEBYSCORE", KEY, "+inf", String(cutoff()), "LIMIT", "0", String(LIMIT)]);
  else {
    const dir = directory();
    const names = await fs.readdir(dir).catch((e: NodeJS.ErrnoException) => {
      if (e.code === "ENOENT") return [];
      throw e;
    });
    rows = [];
    for (const name of names.filter(isDayFile).sort().reverse()) {
      if (Date.parse(name.slice(0, 10)) + 86400_000 < cutoff()) continue;
      rows.push(...(await fs.readFile(path.join(dir, name), "utf8")).trim().split("\n").reverse());
      if (rows.length >= LIMIT) break;
    }
  }
  return rows
    .map(parse)
    .filter((v): v is Visit => v !== null)
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, LIMIT);
}

/**
 * Page views and unique visitors per IST day since the first recorded day,
 * oldest first. Days only present in the 30-day event window (recorded before
 * totals existed) are counted from the events.
 */
export async function listDailyTotals(recent: Visit[]): Promise<DayCount[]> {
  if (!analyticsAvailable()) return [];
  const views: Record<string, number> = {};
  const visitors: Record<string, number> = {};
  const fill = (target: Record<string, number>, flat: string[] | null) => {
    for (let i = 0; i + 1 < (flat?.length ?? 0); i += 2) target[flat![i]] = Number(flat![i + 1]) || 0;
  };
  if (url() && token()) {
    fill(views, await redis<string[] | null>(["HGETALL", DAY_KEY]));
    fill(visitors, await redis<string[] | null>(["HGETALL", VISITOR_DAY_KEY]));
  } else {
    for (const [k, n] of Object.entries(await readJson(TOTALS_FILE))) views[k] = Number(n) || 0;
    for (const [k, n] of Object.entries(await readJson(VISITOR_TOTALS_FILE))) visitors[k] = Number(n) || 0;
  }

  const rawViews = new Map<string, number>();
  const rawVisitors = new Map<string, Set<string>>();
  for (const e of recent.filter(isView)) {
    const day = istDay(e.time);
    rawViews.set(day, (rawViews.get(day) ?? 0) + 1);
    rawVisitors.set(day, (rawVisitors.get(day) ?? new Set()).add(e.v ?? e.time));
  }
  for (const [day, n] of rawViews) if (!(day in views)) views[day] = n;
  for (const [day, set] of rawVisitors) if (!(day in visitors)) visitors[day] = set.size;

  return Object.entries(views)
    .filter(([date, count]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && count > 0)
    .map(([date, count]) => ({ date, count, visitors: Math.min(count, visitors[date] ?? count) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
