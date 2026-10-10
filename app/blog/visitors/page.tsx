import type { Metadata } from "next";
import { redirect } from "next/navigation";
import VisitorChart from "@/components/VisitorChart";
import { currentAdmin } from "@/lib/auth";
import { analyticsAvailable, istDay, listDailyTotals, listVisits, type DayCount, type Visit } from "@/lib/visits";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Visitor analytics", robots: { index: false, follow: false } };

function top(visits: Visit[], field: "path" | "referrer" | "device") {
  const counts = new Map<string, number>();
  for (const v of visits) {
    const key = v[field] || "Direct / unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8);
}

/** Every day from the first recorded day (launch) to today, with empty days as zero. */
function fillDays(totals: DayCount[]): DayCount[] {
  const today = istDay(Date.now());
  const counts = new Map(totals.map((d) => [d.date, d.count]));
  const start = totals[0]?.date ?? today;
  const days: DayCount[] = [];
  for (let d = new Date(start + "T00:00:00Z"); ; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = d.toISOString().slice(0, 10);
    days.push({ date, count: counts.get(date) ?? 0 });
    if (date >= today) break;
  }
  return days;
}

const format = (date: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(date));

export default async function Visitors() {
  if (!(await currentAdmin())) redirect("/blog/login?next=/blog/visitors");
  let visits: Visit[] = [];
  let totals: DayCount[] = [];
  let error = "";
  try {
    visits = await listVisits();
    totals = await listDailyTotals(visits);
  } catch {
    error = "Analytics storage is temporarily unavailable. Try refreshing later.";
  }
  const today = istDay(Date.now());
  const daily = fillDays(totals);
  const allTime = totals.reduce((n, d) => n + d.count, 0);

  return (
    <main className="blog manage">
      <section className="manage-head">
        <div>
          <p className="kicker">Author dashboard</p>
          <h1>Visitor analytics</h1>
        </div>
        <a className="btn ghost" href="/blog/visitors">
          Refresh
        </a>
      </section>
      <p>
        Anonymous page views. Daily totals are kept from the first recorded day; page, referrer and device details
        cover the last 30 days, up to the most recent 5,000 records. Repeat views count separately; these are not
        unique visitor counts.
      </p>
      <p>
        No names, email addresses, IP addresses or persistent visitor identifiers are stored. Author visits, known
        bots and browsers requesting Do Not Track or Global Privacy Control are excluded.
      </p>
      {!analyticsAvailable() && (
        <p role="status">
          Connect the existing Upstash Redis / Vercel KV storage to collect visits on Vercel. Local analytics work with a
          writable disk.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <div className="visitor-summary">
        <p>
          <strong>{allTime}</strong>
          <br />
          Page views since {totals[0]?.date ?? "launch"}
        </p>
        <p>
          <strong>{daily.find((d) => d.date === today)?.count ?? 0}</strong>
          <br />
          Today · IST
        </p>
        <p>
          <strong>{new Set(visits.map((v) => v.path)).size}</strong>
          <br />
          Pages viewed · 30 days
        </p>
      </div>
      <VisitorChart daily={daily} />
      <div className="visitor-breakdowns">
        {(["path", "referrer", "device"] as const).map((field) => (
          <section key={field}>
            <h2>{field === "path" ? "Top pages" : field === "referrer" ? "Referring domains" : "Device categories"}</h2>
            <ul>
              {top(visits, field).map(([label, count]) => (
                <li key={label}>
                  {label} · {count}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <h2>Recent page views</h2>
      {visits.length === 0 ? (
        <p>No page views recorded yet. Views begin after this feature is deployed; earlier visitors cannot be recovered.</p>
      ) : (
        <div className="visitor-table">
          <table>
            <thead>
              <tr>
                <th>Time · IST</th>
                <th>Page</th>
                <th>Referrer</th>
                <th>Browser</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {visits.slice(0, 100).map((v, i) => (
                <tr key={v.time + i}>
                  <td>{format(v.time)}</td>
                  <td>{v.path}</td>
                  <td>{v.referrer || "Direct / unknown"}</td>
                  <td>{v.browser}</td>
                  <td>{v.device}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p>
        <a href="/blog/manage">Back to manage posts</a>
      </p>
    </main>
  );
}
