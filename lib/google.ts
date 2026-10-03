// Google Calendar + Gmail via REST, authorized as the portfolio owner with an
// OAuth refresh token (see scripts/google-auth.mjs). Server-only.

import { randomUUID } from "node:crypto";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events.owned",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/gmail.send",
];

const env = () => ({
  clientId: process.env.GOOGLE_CLIENT_ID ?? "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  refreshToken: process.env.GOOGLE_REFRESH_TOKEN ?? "",
  owner: process.env.BOOKING_OWNER_EMAIL?.trim() ?? "",
  calendarId: process.env.BOOKING_CALENDAR_ID?.trim() || "primary",
});

export const googleConfigured = () => {
  const e = env();
  return Boolean(e.clientId && e.clientSecret && e.refreshToken && e.owner);
};

export class GoogleError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

let cached: { token: string; expires: number } | null = null;

async function accessToken() {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;
  const e = env();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: e.clientId,
      client_secret: e.clientSecret,
      refresh_token: e.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !data.access_token) throw new GoogleError(`Google token refresh failed: ${data.error ?? res.status}`, res.status);
  cached = { token: data.access_token, expires: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cached.token;
}

async function call<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new GoogleError(`Google API ${new URL(url).pathname} failed: ${data.error?.message ?? res.status}`, res.status);
  return data;
}

const calendarUrl = (path: string) => `https://www.googleapis.com/calendar/v3/${path}`;

/** Busy intervals (UTC ms) on the owner's calendar between two instants. */
export async function busyIntervals(from: number, to: number) {
  const id = env().calendarId;
  const data = await call<{ calendars?: Record<string, { busy?: { start: string; end: string }[] }> }>(calendarUrl("freeBusy"), {
    timeMin: new Date(from).toISOString(),
    timeMax: new Date(to).toISOString(),
    items: [{ id }],
  });
  const busy = data.calendars?.[id]?.busy ?? Object.values(data.calendars ?? {})[0]?.busy ?? [];
  return busy.map((b) => ({ start: Date.parse(b.start), end: Date.parse(b.end) }));
}

export const overlaps = (start: number, end: number, busy: { start: number; end: number }[]) =>
  busy.some((b) => b.start < end && b.end > start);

type Meeting = { start: string; end: string; summary: string; description: string; guest: { email: string; name: string } };

/** Creates the event with a Google Meet link; Google emails the invitation to the guest. */
export async function createMeeting(m: Meeting) {
  const event = await call<{ id: string; htmlLink?: string; hangoutLink?: string; conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] } }>(
    calendarUrl(`calendars/${encodeURIComponent(env().calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`),
    {
      summary: m.summary,
      description: m.description,
      start: { dateTime: m.start, timeZone: "Asia/Kolkata" },
      end: { dateTime: m.end, timeZone: "Asia/Kolkata" },
      attendees: [{ email: m.guest.email, displayName: m.guest.name }],
      conferenceData: { createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } } },
      reminders: { useDefault: false, overrides: [{ method: "email", minutes: 60 }, { method: "popup", minutes: 10 }] },
      guestsCanInviteOthers: false,
    }
  );
  const meetLink = event.hangoutLink ?? event.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")?.uri ?? "";
  return { id: event.id, meetLink, htmlLink: event.htmlLink ?? "" };
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

/** Emails the owner (from and to their own Gmail). Reply goes straight to the guest. */
export async function emailOwner({ subject, html, replyTo }: { subject: string; html: string; replyTo: { email: string; name: string } }) {
  const owner = env().owner;
  const raw = [
    `From: Portfolio bookings <${owner}>`,
    `To: ${owner}`,
    `Reply-To: =?UTF-8?B?${b64(oneLine(replyTo.name))}?= <${oneLine(replyTo.email)}>`,
    `Subject: =?UTF-8?B?${b64(oneLine(subject))}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(html).replace(/.{76}/g, "$&\r\n"),
  ].join("\r\n");
  await call("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", { raw: Buffer.from(raw).toString("base64url") });
}
