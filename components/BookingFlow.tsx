"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  BOOKING,
  LIMITS,
  TOPICS,
  dateIn,
  slotRangeIST,
  timeIn,
  type BookingField,
  type BookingResult,
  type Day,
  type SlotsResponse,
} from "@/lib/booking";
import { profile } from "@/lib/data";

type Step = "pick" | "details" | "done";
type Details = { name: string; email: string; company: string; topic: string; message: string };

const REMEMBER = "sh-booking-guest";
const empty: Details = { name: "", email: "", company: "", topic: "", message: "" };

const dayParts = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { ...o, timeZone: "UTC" }).format(d);
  return { weekday: f({ weekday: "short" }), day: f({ day: "numeric" }), month: f({ month: "short" }) };
};

const stamp = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function icsFile(r: BookingResult) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shubhasmita Portfolio//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${stamp(r.start)}-${r.email.replace(/[^a-z0-9]/gi, "")}@portfolio`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(r.start)}`,
    `DTEND:${stamp(r.end)}`,
    `SUMMARY:Call with ${profile.name}`,
    `DESCRIPTION:Google Meet: ${r.meetLink}`,
    `LOCATION:${r.meetLink}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
}

export default function BookingFlow({ compact = false }: { compact?: boolean }) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [step, setStep] = useState<Step>("pick");
  const [details, setDetails] = useState<Details>(empty);
  const [fields, setFields] = useState<Partial<Record<BookingField, string>>>({});
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [zone, setZone] = useState<string>(BOOKING.timeZone);
  const [ics, setIcs] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (keepSelection = false) => {
    setLoadError("");
    try {
      const res = await fetch("/api/booking", { cache: "no-store" });
      const data = (await res.json()) as SlotsResponse & { error?: string };
      if (!res.ok) throw new Error(data.error);
      setDays(data.days);
      setConfigured(data.configured);
      const firstOpen = data.days.find((d) => d.slots.some((s) => s.available));
      setDate((cur) => (keepSelection && data.days.some((d) => d.date === cur) ? cur : firstOpen?.date ?? ""));
    } catch (e) {
      setLoadError(e instanceof Error && e.message ? e.message : "Availability couldn't be loaded.");
    }
  }, []);

  useEffect(() => {
    load();
    setZone(Intl.DateTimeFormat().resolvedOptions().timeZone || BOOKING.timeZone);
    try {
      const saved = JSON.parse(localStorage.getItem(REMEMBER) ?? "null") as Partial<Details> | null;
      if (saved) setDetails((d) => ({ ...d, name: saved.name ?? "", email: saved.email ?? "", company: saved.company ?? "" }));
    } catch {}
  }, [load]);

  useEffect(() => () => void (ics && URL.revokeObjectURL(ics)), [ics]);

  // Move focus to the new step's heading so keyboard and screen-reader users follow along.
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    rootRef.current?.querySelector<HTMLElement>("[data-step-focus]")?.focus({ preventScroll: compact });
  }, [step, compact]);

  const localZone = zone !== BOOKING.timeZone;
  const day = useMemo(() => days?.find((d) => d.date === date), [days, date]);
  const set = (k: keyof Details, v: string) => {
    setDetails((d) => ({ ...d, [k]: v }));
    setFields((f) => ({ ...f, [k]: undefined }));
  };

  const scrollStrip = (dir: number) => stripRef.current?.scrollBy({ left: dir * stripRef.current.clientWidth * 0.8, behavior: "smooth" });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    setFields({});
    const form = new FormData(e.currentTarget as HTMLFormElement);
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, start: slot, timeZone: zone, website: form.get("website") ?? "" }),
      });
      const data = (await res.json().catch(() => ({}))) as BookingResult & {
        error?: string;
        code?: string;
        fields?: Partial<Record<BookingField, string>>;
      };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setFields(data.fields ?? {});
        if (data.code === "slot") {
          setSlot("");
          setStep("pick");
          load(true);
        }
        return;
      }
      try {
        localStorage.setItem(REMEMBER, JSON.stringify({ name: details.name, email: details.email, company: details.company }));
      } catch {}
      setResult(data);
      setIcs(icsFile(data));
      setStep("done");
    } catch {
      setError("You appear to be offline. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  const reset = () => {
    setResult(null);
    setSlot("");
    setError("");
    setDetails((d) => ({ ...d, topic: "", message: "" }));
    setStep("pick");
    load();
  };

  if (!configured)
    return (
      <div className={`booking ${compact ? "compact" : ""}`}>
        <div className="booking-off">
          <p className="booking-title">Online booking opens soon</p>
          <p>In the meantime, send {profile.first} a message on LinkedIn and she&apos;ll find a time with you.</p>
          <a className="btn primary" href={profile.linkedin} target="_blank" rel="noreferrer">
            Message on LinkedIn <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    );

  return (
    <div className={`booking ${compact ? "compact" : ""}`} ref={rootRef}>
      <ol className="booking-steps" aria-label="Booking progress">
        {(["pick", "details", "done"] as const).map((s, i) => {
          const at = ["pick", "details", "done"].indexOf(step);
          return (
            <li key={s} className={i < at ? "done" : i === at ? "now" : ""} aria-current={i === at ? "step" : undefined}>
              <span>{i < at ? "✓" : i + 1}</span>
              {s === "pick" ? "Time" : s === "details" ? "Details" : "Confirmed"}
            </li>
          );
        })}
      </ol>

      {error && (
        <p className="booking-error" role="alert">
          {error}
        </p>
      )}

      {step === "pick" && (
        <div className="booking-pane">
          <p className="booking-title" tabIndex={-1} data-step-focus>
            Pick a day and time
          </p>
          <p className="booking-sub">
            30-minute Google Meet · times in {BOOKING.zoneLabel}
            {localZone && <> · your time shown below each slot</>}
          </p>

          {loadError ? (
            <div className="booking-off">
              <p>{loadError}</p>
              <button type="button" className="btn ghost sm" onClick={() => load()}>
                Try again
              </button>
            </div>
          ) : !days ? (
            <div className="booking-skeleton" aria-label="Loading availability" role="status">
              {Array.from({ length: compact ? 4 : 7 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
          ) : days.length === 0 ? (
            <p className="booking-sub">No times are open right now. Please check back soon.</p>
          ) : (
            <>
              <div className="date-strip-wrap">
                <button type="button" className="strip-arrow" aria-label="Earlier dates" onClick={() => scrollStrip(-1)}>
                  ‹
                </button>
                <div className="date-strip" ref={stripRef} role="group" aria-label="Choose a date">
                  {days.map((d) => {
                    const open = d.slots.filter((s) => s.available).length;
                    const p = dayParts(d.date);
                    return (
                      <button
                        key={d.date}
                        type="button"
                        className="date-chip"
                        aria-pressed={date === d.date}
                        disabled={!open}
                        aria-label={`${dateIn(d.slots[0].start)}, ${open ? `${open} open` : "fully booked"}`}
                        onClick={() => {
                          setDate(d.date);
                          setSlot("");
                        }}
                      >
                        <small>{p.weekday}</small>
                        <strong>{p.day}</strong>
                        <small>{p.month}</small>
                        <em>{open ? `${open} open` : "Full"}</em>
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="strip-arrow" aria-label="Later dates" onClick={() => scrollStrip(1)}>
                  ›
                </button>
              </div>

              {day && (
                <div className="slot-grid" role="group" aria-label={`Times on ${dateIn(day.slots[0].start)}`}>
                  {day.slots.map((s) => (
                    <button
                      key={s.start}
                      type="button"
                      className="slot"
                      aria-pressed={slot === s.start}
                      disabled={!s.available}
                      onClick={() => setSlot(s.start)}
                    >
                      <strong>{timeIn(s.start)}</strong>
                      {!s.available ? <small>Booked</small> : localZone && <small>{timeIn(s.start, zone)} yours</small>}
                    </button>
                  ))}
                </div>
              )}

              <div className="booking-foot">
                <span>{slot ? `${dateIn(slot)} · ${slotRangeIST(slot)}` : "Select a time to continue"}</span>
                <button type="button" className="btn primary" disabled={!slot} onClick={() => setStep("details")}>
                  Continue <span aria-hidden="true">→</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === "details" && (
        <form className="booking-pane booking-form" onSubmit={submit} noValidate>
          <div className="booking-picked">
            <span className="booking-picked-icon" aria-hidden="true">
              📅
            </span>
            <span>
              <strong tabIndex={-1} data-step-focus>
                {dateIn(slot)}
              </strong>
              <small>
                {slotRangeIST(slot)}
                {localZone && ` · ${timeIn(slot, zone)} your time`} · Google Meet
              </small>
            </span>
            <button type="button" className="link-btn" onClick={() => setStep("pick")}>
              Change
            </button>
          </div>

          <div className="booking-row">
            <label>
              <span>Your name</span>
              <input
                value={details.name}
                onChange={(e) => set("name", e.target.value)}
                autoComplete="name"
                maxLength={LIMITS.name}
                required
                aria-invalid={Boolean(fields.name)}
              />
              {fields.name && <em className="field-error">{fields.name}</em>}
            </label>
            <label>
              <span>Email for the invitation</span>
              <input
                type="email"
                value={details.email}
                onChange={(e) => set("email", e.target.value)}
                autoComplete="email"
                inputMode="email"
                required
                aria-invalid={Boolean(fields.email)}
              />
              {fields.email && <em className="field-error">{fields.email}</em>}
            </label>
          </div>
          <label>
            <span>
              Company or team <small>optional</small>
            </span>
            <input
              value={details.company}
              onChange={(e) => set("company", e.target.value)}
              autoComplete="organization"
              maxLength={LIMITS.company}
            />
          </label>
          <fieldset>
            <legend>What would you like to talk about?</legend>
            <div className="topic-chips">
              {TOPICS.map((t) => (
                <button key={t} type="button" className="chip" aria-pressed={details.topic === t} onClick={() => set("topic", t)}>
                  {t}
                </button>
              ))}
            </div>
            {fields.topic && <em className="field-error">{fields.topic}</em>}
          </fieldset>
          <label>
            <span>
              Anything to prepare? <small>optional</small>
            </span>
            <textarea
              rows={compact ? 2 : 3}
              value={details.message}
              onChange={(e) => set("message", e.target.value)}
              maxLength={LIMITS.message}
              placeholder="A role, a project, or questions you'd like to cover."
            />
          </label>
          {/* Hidden from people; bots that fill it are rejected. */}
          <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          <div className="booking-foot">
            <button type="button" className="btn ghost" onClick={() => setStep("pick")}>
              ← Back
            </button>
            <button type="submit" className="btn primary" disabled={sending}>
              {sending ? "Booking…" : "Confirm booking"}
            </button>
          </div>
          <p className="booking-note">You&apos;ll get a Google Calendar invitation with the Meet link at this email.</p>
        </form>
      )}

      {step === "done" && result && (
        <div className="booking-pane booking-done" role="status">
          <span className="booking-check" aria-hidden="true">
            <svg viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="24" />
              <path d="M15 27l7 7 15-16" />
            </svg>
          </span>
          <p className="booking-title" tabIndex={-1} data-step-focus>
            You&apos;re booked, {details.name.split(" ")[0]}!
          </p>
          <p className="booking-sub">
            {dateIn(result.start)}
            <br />
            {slotRangeIST(result.start)}
            {localZone && ` · ${timeIn(result.start, zone)} your time`}
          </p>
          <p className="booking-note">
            A calendar invitation with the Google Meet link is on its way to <strong>{result.email}</strong>.
          </p>
          <div className="booking-done-actions">
            <a className="btn primary" href={result.meetLink} target="_blank" rel="noreferrer">
              Google Meet link <span aria-hidden="true">↗</span>
            </a>
            <a className="btn ghost" href={ics} download="call-with-shubhasmita.ics">
              Add to calendar (.ics)
            </a>
          </div>
          <button type="button" className="link-btn" onClick={reset}>
            Book another time
          </button>
        </div>
      )}
    </div>
  );
}
