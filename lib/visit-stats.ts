// Turns raw analytics events into what the author dashboard shows. Pure
// functions over the event list and daily totals, so they're easy to test.

import type { DayCount, Visit } from "@/lib/visits";

export type Range = "7d" | "30d" | "all";
export const RANGES: { id: Range; label: string; days: number | null }[] = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "all", label: "Since launch", days: null },
];

export type Row = { label: string; value: number; note?: string; key?: string };
export type PageRow = { path: string; title: string; views: number; visitors: number; avgSec: number; readThrough: number };
export type Journey = { steps: string[]; count: number };
export type FeedItem = { time: string; tag: string; page: string; title: string; place: string; source: string; device: string; sec: number };

const SESSION_GAP = 30 * 60_000;
const kindOf = (e: Visit) => e.kind ?? "view";
const tagOf = (e: Visit) => e.v ?? e.time; // views recorded before visitor tags count individually

/** Where a visit came from: utm_source first, then the referring site, grouped into familiar names. */
export function sourceOf(e: Pick<Visit, "referrer" | "source">) {
  const known: [RegExp, string][] = [
    [/linkedin|lnkd\.in/, "LinkedIn"],
    [/google\./, "Google"],
    [/bing\./, "Bing"],
    [/duckduckgo/, "DuckDuckGo"],
    [/github/, "GitHub"],
    [/(^|\.)(t\.co|twitter\.com|x\.com)$|^twitter$|^x$/, "X / Twitter"],
    [/facebook|^fb$|fb\.com/, "Facebook"],
    [/reddit/, "Reddit"],
    [/youtube|youtu\.be/, "YouTube"],
    [/chatgpt|openai|perplexity|claude\.ai|gemini\.google/, "AI assistants"],
    [/mail|outlook|newsletter|^email$/, "Email"],
  ];
  for (const raw of [e.source, e.referrer]) {
    if (!raw) continue;
    const hit = known.find(([re]) => re.test(raw));
    if (hit) return hit[1];
  }
  return e.source || e.referrer || "Direct";
}

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();

/** "India" from "IN". (Flag emoji are skipped: Windows renders them as bare letters.) */
export const countryLabel = (code?: string) => (code ? (regionNames?.of(code) ?? code) : "Unknown");

export const formatDuration = (sec: number) => {
  if (!sec) return "–";
  const s = Math.round(sec);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};

function tally(items: string[]): Row[] {
  const counts = new Map<string, number>();
  for (const k of items) counts.set(k, (counts.get(k) ?? 0) + 1);
  return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

/** Distinct visitors per value (a visitor counts once per label). */
function byVisitor(views: Visit[], label: (e: Visit) => string): Row[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const e of views) {
    const key = `${tagOf(e)}\u0000${label(e)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label(e));
  }
  return tally(labels);
}

/** Views grouped into visits: same visitor tag, no gap longer than 30 minutes. */
function sessions(views: Visit[]): Visit[][] {
  const byTag = new Map<string, Visit[]>();
  for (const e of [...views].sort((a, b) => a.time.localeCompare(b.time))) byTag.set(tagOf(e), [...(byTag.get(tagOf(e)) ?? []), e]);
  const out: Visit[][] = [];
  for (const list of byTag.values()) {
    let current: Visit[] = [];
    for (const e of list) {
      if (current.length && Date.parse(e.time) - Date.parse(current[current.length - 1].time) > SESSION_GAP) {
        out.push(current);
        current = [];
      }
      current.push(e);
    }
    if (current.length) out.push(current);
  }
  return out;
}

export function rangeStart(range: Range, today: string) {
  const days = RANGES.find((r) => r.id === range)?.days;
  if (!days) return null;
  const d = new Date(today + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

export function buildStats({
  events,
  daily,
  range,
  today,
  titles,
  dayOf,
  now = Date.now(),
}: {
  /** Last 30 days of events. */
  events: Visit[];
  /** Every day from launch to today (zero-filled). */
  daily: DayCount[];
  range: Range;
  today: string;
  titles: Record<string, string>;
  /** Maps an event time to its IST day. */
  dayOf: (time: string) => string;
  now?: number;
}) {
  const start = rangeStart(range, today);
  const days = RANGES.find((r) => r.id === range)?.days ?? null;
  const trend = start ? daily.filter((d) => d.date >= start) : daily;
  const sum = (list: DayCount[], k: "count" | "visitors") => list.reduce((n, d) => n + d[k], 0);

  // The same number of days just before the range, for the change figures.
  let previous: DayCount[] | null = null;
  if (start && days) {
    const prevStart = new Date(start + "T00:00:00Z");
    prevStart.setUTCDate(prevStart.getUTCDate() - days);
    const from = prevStart.toISOString().slice(0, 10);
    previous = daily.filter((d) => d.date >= from && d.date < start);
    if (!previous.length || previous[0].date !== from) previous = null; // not enough history yet
  }

  // Detail panels use the events inside the range (at most the last 30 days).
  const inRange = events.filter((e) => !start || dayOf(e.time) >= start);
  const views = inRange.filter((e) => kindOf(e) === "view");
  const engages = inRange.filter((e) => kindOf(e) === "engage");
  const title = (path: string) => titles[path] ?? path;

  // Reading time per page: all engaged seconds over all views; read-through: views whose furthest scroll reached 90%.
  const pageAgg = new Map<string, { views: number; tags: Set<string>; sec: number; deep: Set<string> }>();
  for (const e of views) {
    const p = pageAgg.get(e.path) ?? { views: 0, tags: new Set(), sec: 0, deep: new Set() };
    p.views++;
    p.tags.add(tagOf(e));
    pageAgg.set(e.path, p);
  }
  for (const e of engages) {
    const p = pageAgg.get(e.path);
    if (!p) continue;
    p.sec += e.sec ?? 0;
    if ((e.depth ?? 0) >= 90) p.deep.add(`${tagOf(e)}\u0000${dayOf(e.time)}`);
  }
  const pages: PageRow[] = [...pageAgg]
    .map(([path, p]) => ({
      path,
      title: title(path),
      views: p.views,
      visitors: p.tags.size,
      avgSec: p.views ? p.sec / p.views : 0,
      readThrough: p.tags.size ? Math.round((Math.min(p.deep.size, p.tags.size) / p.tags.size) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views || a.title.localeCompare(b.title));

  const engagedSec = engages.reduce((n, e) => n + (e.sec ?? 0), 0);
  const visits = sessions(views);
  const journeys = tally(
    visits
      .map((s) => s.map((e) => title(e.path)).filter((t, i, all) => t !== all[i - 1]))
      .filter((steps) => steps.length > 1)
      .map((steps) => steps.slice(0, 4).join("\u0000"))
  )
    .slice(0, 6)
    .map((r) => ({ steps: r.label.split("\u0000"), count: r.value }));

  // Searches: how often each query was used, and whether its latest run found nothing.
  const searchRows = new Map<string, { count: number; hits: number; time: string }>();
  for (const e of inRange.filter((e) => kindOf(e) === "search" && e.q)) {
    const s = searchRows.get(e.q!) ?? { count: 0, hits: e.hits ?? 0, time: e.time };
    s.count++;
    if (e.time >= s.time) Object.assign(s, { hits: e.hits ?? 0, time: e.time });
    searchRows.set(e.q!, s);
  }
  const searches = [...searchRows]
    .map(([q, s]) => ({ q, count: s.count, noResults: s.hits === 0 }))
    .sort((a, b) => b.count - a.count || a.q.localeCompare(b.q))
    .slice(0, 12);

  // Engaged time for a feed item: the visitor's engagement on that page after the view.
  const engagedFor = (v: Visit) =>
    engages.filter((e) => tagOf(e) === tagOf(v) && e.path === v.path && e.time >= v.time && Date.parse(e.time) - Date.parse(v.time) < SESSION_GAP).reduce((n, e) => n + (e.sec ?? 0), 0);

  return {
    views: sum(trend, "count"),
    visitors: sum(trend, "visitors"),
    previous: previous && { views: sum(previous, "count"), visitors: sum(previous, "visitors") },
    trend,
    avgEngaged: views.length ? engagedSec / views.length : 0,
    pagesPerVisit: visits.length ? views.length / visits.length : 0,
    live: new Set(events.filter((e) => now - Date.parse(e.time) < 5 * 60_000).map(tagOf)).size,
    sources: tally(visits.map((s) => sourceOf(s[0]))),
    countries: byVisitor(views, (e) => e.country ?? "").map((r) => ({ ...r, key: r.label, label: countryLabel(r.label || undefined) })),
    cities: byVisitor(
      views.filter((e) => e.city),
      (e) => `${e.city}${e.country ? `, ${e.country}` : ""}`
    ),
    devices: byVisitor(views, (e) => e.device),
    browsers: byVisitor(views, (e) => e.browser),
    pages,
    journeys,
    searches,
    bookings: inRange.filter((e) => kindOf(e) === "booking").slice(0, 10),
    feed: views.slice(0, 25).map(
      (v): FeedItem => ({
        time: v.time,
        tag: tagOf(v).slice(0, 4),
        page: v.path,
        title: title(v.path),
        place: [v.city, v.country ? (regionNames?.of(v.country) ?? v.country) : ""].filter(Boolean).join(", ") || "Unknown location",
        source: sourceOf(v),
        device: v.device,
        sec: engagedFor(v),
      })
    ),
  };
}
