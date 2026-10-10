import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Anonymous page-view analytics. Raw views (page, referrer domain, browser and
// device category) are kept for 30 days, up to 5,000 records. Separately, a
// count per IST day is kept permanently, so the trend charts run from launch.

export type Visit = { time: string; path: string; referrer: string; browser: string; device: string };
export type DayCount = { date: string; count: number };

const DAYS = 30;
const LIMIT = 5000;
const KEY = "portfolio:visits";
const DAY_KEY = "portfolio:visits:days";
const TOTALS_FILE = "daily-totals.json";

const directory = () => path.resolve(process.env.ANALYTICS_DIR || path.join(process.cwd(), ".analytics"));
const url = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const cutoff = () => Date.now() - DAYS * 86400_000;

/** Calendar day in IST, the time zone the dashboard reports in (YYYY-MM-DD). */
export const istDay = (time: string | number | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(time));

/** On Vercel the disk is read-only, so analytics need Redis there. */
export const analyticsAvailable = () => Boolean(url() && token()) || !process.env.VERCEL;

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

async function readTotalsFile(): Promise<Record<string, number>> {
  try {
    const data = JSON.parse(await fs.readFile(path.join(directory(), TOTALS_FILE), "utf8"));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

export async function recordVisit(visit: Visit) {
  if (!analyticsAvailable()) return;
  const day = istDay(visit.time);
  if (url() && token()) {
    // Random event ID prevents same-millisecond views overwriting one another; it is not a visitor ID.
    await redis(["ZADD", KEY, String(Date.parse(visit.time)), JSON.stringify({ ...visit, event: randomUUID() })]);
    await redis(["HINCRBY", DAY_KEY, day, "1"]);
    await redis(["ZREMRANGEBYSCORE", KEY, "-inf", String(cutoff())]);
    await redis(["ZREMRANGEBYRANK", KEY, "0", String(-LIMIT - 1)]);
    await redis(["EXPIRE", KEY, String(DAYS * 86400)]);
    return;
  }
  const dir = directory();
  await fs.mkdir(dir, { recursive: true });
  for (const name of await fs.readdir(dir))
    if (isDayFile(name) && Date.parse(name.slice(0, 10)) + 86400_000 < cutoff()) await fs.rm(path.join(dir, name), { force: true });
  const file = path.join(dir, visit.time.slice(0, 10) + ".jsonl");
  const size = await fs.stat(file).then((s) => s.size).catch(() => 0);
  // Raw detail is capped per day; the day's total still counts every view.
  if (size < 2_000_000) await fs.appendFile(file, JSON.stringify(visit) + "\n", "utf8");
  const totals = await readTotalsFile();
  totals[day] = (totals[day] ?? 0) + 1;
  await fs.writeFile(path.join(dir, TOTALS_FILE), JSON.stringify(totals), "utf8");
}

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
 * Page views per IST day since the first recorded day, oldest first. Days only
 * present in the raw 30-day window (views recorded before totals existed) are
 * counted from the raw views.
 */
export async function listDailyTotals(recent: Visit[]): Promise<DayCount[]> {
  if (!analyticsAvailable()) return [];
  const stored: Record<string, number> = {};
  if (url() && token()) {
    const flat = (await redis<string[] | null>(["HGETALL", DAY_KEY])) ?? [];
    for (let i = 0; i + 1 < flat.length; i += 2) stored[flat[i]] = Number(flat[i + 1]) || 0;
  } else Object.assign(stored, await readTotalsFile());

  const fromRaw = new Map<string, number>();
  for (const v of recent) fromRaw.set(istDay(v.time), (fromRaw.get(istDay(v.time)) ?? 0) + 1);
  for (const [day, n] of fromRaw) if (!(day in stored)) stored[day] = n;

  return Object.entries(stored)
    .filter(([date, count]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && count > 0)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
