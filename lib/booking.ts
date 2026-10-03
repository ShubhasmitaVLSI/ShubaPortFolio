// Call booking rules shared by the booking UI and /api/booking (no Node APIs here).

export const BOOKING = {
  timeZone: "Asia/Kolkata",
  zoneLabel: "IST",
  offsetMinutes: 330, // IST is UTC+5:30 all year (no daylight saving)
  dayStart: 18 * 60 + 30, // 6:30 PM
  dayEnd: 22 * 60, // 10:00 PM
  slotMinutes: 30,
  daysAhead: 14,
  noticeMinutes: 120, // earliest bookable slot is two hours out
};

export const TOPICS = ["Career opportunity", "DV collaboration", "Mentorship / guidance", "Something else"] as const;
export type Topic = (typeof TOPICS)[number];

export type Slot = { start: string; available: boolean };
export type Day = { date: string; slots: Slot[] };
export type SlotsResponse = { configured: boolean; days: Day[] };

export type BookingInput = { start: string; name: string; email: string; company: string; topic: string; message: string };
export type BookingField = keyof BookingInput;
export type BookingResult = { start: string; end: string; meetLink: string; email: string };

export const LIMITS = { name: 80, company: 100, message: 1000 };

const MINUTE = 60_000;
const pad = (n: number) => String(n).padStart(2, "0");

/** Every bookable slot start (UTC ms) from `now` through the booking window, grouped by IST date. */
export function slotStarts(now = Date.now()): { date: string; starts: number[] }[] {
  const ist = new Date(now + BOOKING.offsetMinutes * MINUTE);
  const earliest = now + BOOKING.noticeMinutes * MINUTE;
  const days: { date: string; starts: number[] }[] = [];
  for (let i = 0; i < BOOKING.daysAhead; i++) {
    const midnight = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + i);
    const d = new Date(midnight);
    const starts: number[] = [];
    for (let m = BOOKING.dayStart; m + BOOKING.slotMinutes <= BOOKING.dayEnd; m += BOOKING.slotMinutes) {
      const t = midnight + (m - BOOKING.offsetMinutes) * MINUTE;
      if (t >= earliest) starts.push(t);
    }
    if (starts.length) days.push({ date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, starts });
  }
  return days;
}

export const isBookableStart = (iso: string, now = Date.now()) => {
  const t = Date.parse(iso);
  return slotStarts(now).some((d) => d.starts.includes(t));
};

export const slotEnd = (iso: string) => new Date(Date.parse(iso) + BOOKING.slotMinutes * MINUTE).toISOString();

const EMAIL = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i;

export function validateBooking(input: BookingInput) {
  const errors: Partial<Record<BookingField, string>> = {};
  if (input.name.trim().length < 2) errors.name = "Please enter your name.";
  else if (input.name.length > LIMITS.name) errors.name = "That name is too long.";
  if (!EMAIL.test(input.email.trim()) || input.email.length > 254) errors.email = "Enter a valid email so the invitation reaches you.";
  if (input.company.length > LIMITS.company) errors.company = "Keep this under 100 characters.";
  if (!(TOPICS as readonly string[]).includes(input.topic)) errors.topic = "Choose what you'd like to talk about.";
  if (input.message.length > LIMITS.message) errors.message = `Keep the note under ${LIMITS.message} characters.`;
  return errors;
}

const fmt = (opts: Intl.DateTimeFormatOptions, timeZone: string) => new Intl.DateTimeFormat("en-IN", { ...opts, timeZone });

export const timeIn = (iso: string, timeZone: string = BOOKING.timeZone) =>
  fmt({ hour: "numeric", minute: "2-digit", hour12: true }, timeZone).format(new Date(iso)).replace(/\s+/g, " ").toUpperCase();

export const dateIn = (iso: string, timeZone: string = BOOKING.timeZone) =>
  fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }, timeZone).format(new Date(iso));

/** "7:00 – 7:30 PM IST" */
export const slotRangeIST = (iso: string) => {
  const [a, b] = [timeIn(iso), timeIn(slotEnd(iso))];
  return `${a.replace(/ (AM|PM)$/, (m) => (b.endsWith(m.trim()) ? "" : m))} – ${b} ${BOOKING.zoneLabel}`;
};

export const availabilityLabel = "Daily · 6:30 – 10:00 PM IST · 30-min Google Meet";
