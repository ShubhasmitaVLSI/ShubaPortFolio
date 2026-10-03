import {
  BOOKING,
  isBookableStart,
  slotEnd,
  slotRangeIST,
  slotStarts,
  dateIn,
  validateBooking,
  type BookingInput,
  type BookingResult,
  type SlotsResponse,
} from "@/lib/booking";
import { profile } from "@/lib/data";
import { busyIntervals, createMeeting, emailOwner, googleConfigured, overlaps } from "@/lib/google";

export const dynamic = "force-dynamic";

// BOOKING_DRY_RUN=1 previews the whole flow without Google credentials (nothing is scheduled).
const dryRun = () => process.env.BOOKING_DRY_RUN === "1";
const ready = () => googleConfigured() || dryRun();

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  const days = slotStarts();
  let busy: { start: number; end: number }[] = [];
  if (googleConfigured() && days.length) {
    const last = days.at(-1)!.starts.at(-1)!;
    try {
      busy = await busyIntervals(days[0].starts[0], last + BOOKING.slotMinutes * 60_000);
    } catch (e) {
      console.error("booking freebusy failed", e instanceof Error ? e.message : e);
      return json({ error: "Availability couldn't be loaded. Please try again shortly." }, 502);
    }
  }
  const body: SlotsResponse = {
    configured: ready(),
    days: days.map((d) => ({
      date: d.date,
      slots: d.starts.map((t) => ({
        start: new Date(t).toISOString(),
        available: !overlaps(t, t + BOOKING.slotMinutes * 60_000, busy),
      })),
    })),
  };
  return json(body);
}

// Best-effort, per-instance limit: 4 bookings per IP per hour.
const WINDOW_MS = 60 * 60_000;
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.size > 5000) hits.clear();
  hits.set(ip, recent);
  return recent.length >= 4;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(request: Request) {
  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") return json({ error: "Bad request" }, 400);
  const str = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string) : "");

  // Only bots fill the hidden "website" field.
  if (str("website")) return json({ error: "Bad request" }, 400);

  const input: BookingInput = {
    start: str("start"),
    name: str("name").replace(/[\r\n]+/g, " ").trim(),
    email: str("email").trim().toLowerCase(),
    company: str("company").replace(/[\r\n]+/g, " ").trim(),
    topic: str("topic"),
    message: str("message").trim(),
  };
  const fields = validateBooking(input);
  if (Object.keys(fields).length) return json({ error: "Please check the highlighted fields.", fields }, 400);
  if (!isBookableStart(input.start))
    return json({ error: "That time is no longer available. Please pick another slot.", code: "slot" }, 409);
  if (!ready()) return json({ error: "Online booking isn't set up yet. Please connect on LinkedIn instead." }, 503);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return json({ error: "Too many bookings from this network. Please try again later." }, 429);

  const start = Date.parse(input.start);
  const end = slotEnd(input.start);
  const when = `${dateIn(input.start)}, ${slotRangeIST(input.start)}`;
  const tz = str("timeZone").slice(0, 64);

  if (dryRun() && !googleConfigured()) {
    hits.get(ip)!.push(Date.now());
    const result: BookingResult = { start: input.start, end, meetLink: "https://meet.google.com/dry-run-preview", email: input.email };
    return json({ ...result, dryRun: true });
  }

  try {
    if (overlaps(start, Date.parse(end), await busyIntervals(start, Date.parse(end))))
      return json({ error: "Someone just booked that time. Please pick another slot.", code: "slot" }, 409);

    const details = [
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      input.company && `Company: ${input.company}`,
      `Topic: ${input.topic}`,
      tz && `Guest's time zone: ${tz}`,
      input.message && `\nNote from ${input.name}:\n${input.message}`,
      `\nBooked via ${profile.first}'s portfolio.`,
    ]
      .filter(Boolean)
      .join("\n");

    const meeting = await createMeeting({
      start: input.start,
      end,
      summary: `${input.topic}: ${input.name} × ${profile.first}`,
      description: details,
      guest: { email: input.email, name: input.name },
    });
    hits.get(ip)!.push(Date.now());

    // The calendar event is the booking; the email is a courtesy heads-up, so a failure here is not fatal.
    const row = (k: string, v: string) =>
      v ? `<tr><td style="padding:6px 14px 6px 0;color:#667;vertical-align:top">${k}</td><td style="padding:6px 0">${esc(v)}</td></tr>` : "";
    await emailOwner({
      subject: `New call booked: ${input.name} · ${when}`,
      replyTo: { email: input.email, name: input.name },
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#112">
<h2 style="margin:0 0 12px">New call booked from your portfolio</h2>
<p style="margin:0 0 16px"><strong>${esc(when)}</strong> · 30 minutes · Google Meet</p>
<table style="border-collapse:collapse">${row("Name", input.name)}${row("Email", input.email)}${row("Company", input.company)}${row("Topic", input.topic)}${row("Time zone", tz)}${row("Note", input.message)}</table>
<p style="margin:20px 0"><a href="${esc(meeting.meetLink)}" style="background:#1a73e8;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Join Google Meet</a>
&nbsp; <a href="${esc(meeting.htmlLink)}">Open in Calendar</a></p>
<p style="color:#667;font-size:13px">Reply to this email to write to ${esc(input.name)} directly.</p></div>`,
    }).catch((e) => console.error("booking email failed", e instanceof Error ? e.message : e));

    const result: BookingResult = { start: input.start, end, meetLink: meeting.meetLink, email: input.email };
    return json(result);
  } catch (e) {
    console.error("booking failed", e instanceof Error ? e.message : e);
    return json({ error: "The booking couldn't be completed. Please try again, or connect on LinkedIn." }, 502);
  }
}
