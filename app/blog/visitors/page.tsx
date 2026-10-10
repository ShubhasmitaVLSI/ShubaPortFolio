import type { Metadata } from "next";
import { redirect } from "next/navigation";
import VisitorChart from "@/components/VisitorChart";
import { BarList, StatTile, formatCount } from "@/components/analytics/Panels";
import { currentAdmin } from "@/lib/auth";
import { listPosts } from "@/lib/blog-store";
import { listLexicon } from "@/lib/lexicon-store";
import { RANGES, buildStats, formatDuration, type FeedItem, type Range } from "@/lib/visit-stats";
import { analyticsAvailable, istDay, listDailyTotals, listVisits, type DayCount, type Visit } from "@/lib/visits";
import "./analytics.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Visitor analytics", robots: { index: false, follow: false } };

/** Every day from the first recorded day (launch) to today, with empty days as zero. */
function fillDays(totals: DayCount[], today: string): DayCount[] {
  const counts = new Map(totals.map((d) => [d.date, d]));
  const days: DayCount[] = [];
  for (let d = new Date((totals[0]?.date ?? today) + "T00:00:00Z"); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    days.push(counts.get(date) ?? { date, count: 0, visitors: 0 });
    if (date >= today) break;
  }
  return days;
}

async function pageTitles() {
  const [posts, terms] = await Promise.all([listPosts(), listLexicon()]);
  return {
    "/": "Home",
    "/projects": "Project archive",
    "/book": "Book a call",
    "/blog": "Blog",
    "/lexicon": "DV Lexicon",
    ...Object.fromEntries(posts.map((p) => [`/blog/${p.slug}`, p.title])),
    ...Object.fromEntries(terms.map((t) => [`/lexicon/${t.slug}`, t.term])),
  } as Record<string, string>;
}

const time = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));
const ago = (iso: string, now: number) => {
  const m = Math.round((now - Date.parse(iso)) / 60_000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : time(iso);
};

function feedItem(f: FeedItem, now: number) {
  return (
    <li key={f.time + f.tag}>
      <span className="an-tag" title="Anonymous visitor tag (resets daily)">
        #{f.tag}
      </span>
      <span className="an-feed-main">
        <a href={f.page}>{f.title}</a>
        <small>
          {f.place} · via {f.source} · {f.device}
          {f.sec ? ` · read ${formatDuration(f.sec)}` : ""}
        </small>
      </span>
      <time dateTime={f.time}>{ago(f.time, now)}</time>
    </li>
  );
}

export default async function Visitors({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  if (!(await currentAdmin())) redirect("/blog/login?next=/blog/visitors");
  const requested = (await searchParams).range;
  const range: Range = RANGES.some((r) => r.id === requested) ? (requested as Range) : "30d";

  let events: Visit[] = [];
  let totals: DayCount[] = [];
  let error = "";
  try {
    events = await listVisits();
    totals = await listDailyTotals(events);
  } catch {
    error = "Analytics storage is temporarily unavailable. Try refreshing later.";
  }
  const now = Date.now();
  const today = istDay(now);
  const daily = fillDays(totals, today);
  const s = buildStats({ events, daily, range, today, titles: await pageTitles(), dayOf: istDay, now });
  const rangeLabel = RANGES.find((r) => r.id === range)!.label.toLowerCase();
  const prevLabel = range === "7d" ? "previous 7 days" : "previous 30 days";
  const spark = s.trend.slice(-30).map((d) => d.visitors);
  const detailNote = range === "all" ? "Details below cover the last 30 days." : "";

  return (
    <main className="blog analytics">
      <section className="manage-head">
        <div>
          <p className="kicker">Author dashboard</p>
          <h1>Visitor analytics</h1>
          <p className="an-sub">Cookie-free and anonymous · times in IST · since {daily[0]?.date ?? today}</p>
        </div>
        <a className="btn ghost" href={`/blog/visitors?range=${range}`}>
          Refresh
        </a>
      </section>

      {!analyticsAvailable() && (
        <p className="an-alert" role="status">
          Connect the existing Upstash Redis / Vercel KV storage to collect visits on Vercel. Local analytics work with a
          writable disk.
        </p>
      )}
      {error && (
        <p className="an-alert" role="alert">
          {error}
        </p>
      )}

      <nav className="an-filters" aria-label="Date range">
        <div className="an-seg">
          {RANGES.map((r) => (
            <a key={r.id} href={`/blog/visitors?range=${r.id}`} aria-current={r.id === range ? "page" : undefined}>
              {r.label}
            </a>
          ))}
        </div>
        {detailNote && <span className="an-sub">{detailNote}</span>}
      </nav>

      <div className="an-kpis">
        <StatTile
          label="Visitors"
          value={formatCount(s.visitors)}
          previous={s.previous && { now: s.visitors, before: s.previous.visitors }}
          previousLabel={prevLabel}
          hint="Unique per day; someone visiting on two days counts twice."
          trend={spark}
        />
        <StatTile
          label="Page views"
          value={formatCount(s.views)}
          previous={s.previous && { now: s.views, before: s.previous.views }}
          previousLabel={prevLabel}
          hint={s.pagesPerVisit ? `${s.pagesPerVisit.toFixed(1)} pages per visit` : undefined}
          trend={s.trend.slice(-30).map((d) => d.count)}
        />
        <StatTile label="Avg. reading time" value={formatDuration(s.avgEngaged)} hint="Time a page was visible, per view." />
        <StatTile label="Live now" value={String(s.live)} hint="Visitors active in the last 5 minutes." live={s.live > 0} />
      </div>

      <VisitorChart daily={s.trend} />

      <div className="an-grid">
        <section className="an-card" aria-labelledby="an-sources">
          <h2 id="an-sources">Where visits come from</h2>
          <p className="an-card-sub">Visits by source, {rangeLabel}. Add ?utm_source=… to links you share.</p>
          <BarList rows={s.sources} empty="No visits yet." unit="visits" />
        </section>
        <section className="an-card" aria-labelledby="an-places">
          <h2 id="an-places">Where visitors are</h2>
          <p className="an-card-sub">Country and city from the network location; no IP addresses are stored.</p>
          <BarList rows={s.countries} limit={5} empty="No location data yet (only available on the live site)." />
          {s.cities.length > 0 && (
            <>
              <h3 className="an-h3">Top cities</h3>
              <BarList rows={s.cities} limit={5} empty="" />
            </>
          )}
        </section>
      </div>

      <section className="an-card" aria-labelledby="an-content">
        <h2 id="an-content">What people read</h2>
        <p className="an-card-sub">Read-through: visitors who scrolled to at least 90% of the page.</p>
        {s.pages.length === 0 ? (
          <p className="an-empty">No page views in this range yet.</p>
        ) : (
          <div className="visitor-table">
            <table className="an-pages">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Views</th>
                  <th>Visitors</th>
                  <th>Avg. reading time</th>
                  <th>Read-through</th>
                </tr>
              </thead>
              <tbody>
                {s.pages.slice(0, 12).map((p) => (
                  <tr key={p.path}>
                    <td>
                      <a href={p.path}>{p.title}</a>
                      <small>{p.path}</small>
                    </td>
                    <td>
                      <span className="an-cell-bar" style={{ "--w": `${(p.views / s.pages[0].views) * 100}%` } as React.CSSProperties} />
                      {p.views}
                    </td>
                    <td>{p.visitors}</td>
                    <td>{formatDuration(p.avgSec)}</td>
                    <td>{p.readThrough}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="an-grid">
        <section className="an-card" aria-labelledby="an-journeys">
          <h2 id="an-journeys">Common journeys</h2>
          <p className="an-card-sub">The order pages were read in during one visit.</p>
          {s.journeys.length === 0 ? (
            <p className="an-empty">No multi-page visits yet.</p>
          ) : (
            <ol className="an-journeys">
              {s.journeys.map((j) => (
                <li key={j.steps.join(">")}>
                  <span className="an-steps">
                    {j.steps.map((step, i) => (
                      <span key={i}>{step}</span>
                    ))}
                  </span>
                  <b>{j.count}×</b>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="an-card" aria-labelledby="an-search">
          <h2 id="an-search">What visitors searched for</h2>
          <p className="an-card-sub">Searches with no results point at content worth writing.</p>
          {s.searches.length === 0 ? (
            <p className="an-empty">No searches yet.</p>
          ) : (
            <ul className="an-searches">
              {s.searches.map((q) => (
                <li key={q.q}>
                  <code>{q.q}</code>
                  {q.noResults && (
                    <span className="an-flag">
                      <span aria-hidden="true">!</span> No results
                    </span>
                  )}
                  <b>{q.count}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="an-grid">
        <section className="an-card" aria-labelledby="an-people">
          <h2 id="an-people">People who reached out</h2>
          <p className="an-card-sub">Calls booked through the site: the name, company and topic they shared.</p>
          {s.bookings.length === 0 ? (
            <p className="an-empty">No calls booked in this range.</p>
          ) : (
            <ul className="an-people">
              {s.bookings.map((b) => (
                <li key={b.time}>
                  <span className="mark" aria-hidden="true">
                    {(b.name ?? "?").slice(0, 1).toUpperCase()}
                  </span>
                  <span>
                    <strong>
                      {b.name}
                      {b.company ? ` · ${b.company}` : ""}
                    </strong>
                    <small>
                      {b.topic} · {time(b.time)}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="an-card" aria-labelledby="an-devices">
          <h2 id="an-devices">Devices and browsers</h2>
          <BarList rows={s.devices} limit={3} empty="No visits yet." />
          {s.browsers.length > 0 && (
            <>
              <h3 className="an-h3">Browsers</h3>
              <BarList rows={s.browsers} limit={4} empty="" />
            </>
          )}
        </section>
      </div>

      <section className="an-card" aria-labelledby="an-feed">
        <h2 id="an-feed">Live activity</h2>
        <p className="an-card-sub">Latest page views. Visitor tags reset daily, so the same tag means the same visitor that day.</p>
        {s.feed.length === 0 ? (
          <p className="an-empty">No page views in this range yet.</p>
        ) : (
          <>
            <ol className="an-feed">{s.feed.slice(0, 10).map((f) => feedItem(f, now))}</ol>
            {s.feed.length > 10 && (
              <details className="an-more">
                <summary>Show {s.feed.length - 10} more</summary>
                <ol className="an-feed">{s.feed.slice(10).map((f) => feedItem(f, now))}</ol>
              </details>
            )}
          </>
        )}
      </section>

      <p className="an-privacy">
        No names (except those shared when booking), emails, IP addresses, cookies or persistent identifiers are stored.
        Author visits, known bots and browsers asking for Do Not Track or Global Privacy Control are excluded. Event
        details are kept for 30 days; daily totals are kept from launch.
      </p>
      <p>
        <a href="/blog/manage">Back to manage posts</a>
      </p>
    </main>
  );
}
