"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { profile } from "@/lib/data";
import { guideActions, sectionContexts, suggestedQuestions, wantsBooking } from "@/lib/chat-knowledge";
import { availabilityLabel } from "@/lib/booking";
import BookingFlow from "@/components/BookingFlow";

const first = profile.first;
const STORE = "sh-chat-v1";
const TEASED = "sh-chat-teased";

function hello() {
  const h = new Date().getHours();
  const [word, icon] = h >= 5 && h < 12 ? ["morning", "☀️"] : h >= 12 && h < 17 ? ["afternoon", "🌤️"] : ["evening", "🌙"];
  return {
    title: `Good ${word}`,
    icon,
    message: `Good ${word} ${icon} I'm ${first}'s portfolio assistant. Ask me about verification work, SoC verification, GLS-SDF, the tech stack, or how to connect.`,
  };
}

function useCurrentSection() {
  const pathname = usePathname();
  const [section, setSection] = useState("top");
  useEffect(() => {
    if (pathname.startsWith("/projects")) return setSection("projects");
    const nodes = [...document.querySelectorAll<HTMLElement>("main section[id]")].filter((n) =>
      Object.hasOwn(sectionContexts, n.id)
    );
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setSection(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [pathname]);
  return section;
}

const textOf = (m: UIMessage) =>
  m.parts.map((p) => (p?.type === "text" && typeof p.text === "string" ? p.text : "")).join("");

function restore(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(STORE) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && Array.isArray(m.parts))
      .map((m, i) => ({
        id: typeof m.id === "string" ? m.id : `restored-${i}`,
        role: m.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: textOf(m) }],
      }))
      .filter((m) => m.parts[0].text.trim())
      .slice(-24);
  } catch {
    return [];
  }
}

function linkify(text: string) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(/https?:\/\/[^\s)]+/g)) {
    const raw = m[0].replace(/[.,]$/, "");
    const at = m.index ?? 0;
    out.push(text.slice(last, at));
    out.push(
      <a key={at} href={raw} target="_blank" rel="noreferrer">
        {raw}
      </a>
    );
    last = at + raw.length;
  }
  out.push(text.slice(last));
  return out;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"guide" | "chat" | "book">("guide");
  const [teaser, setTeaser] = useState(false);
  const [input, setInput] = useState("");
  const [greet, setGreet] = useState(hello);
  const [initial] = useState(restore);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launchRef = useRef<HTMLButtonElement>(null);
  const section = useCurrentSection();
  const sectionRef = useRef(section);
  useEffect(() => {
    sectionRef.current = section;
  }, [section]);
  const [transport] = useState(
    () => new DefaultChatTransport({ api: "/api/chat", body: () => ({ section: sectionRef.current }) })
  );
  const context = sectionContexts[section] ?? sectionContexts.top;
  const chips = [...new Set([...context.questions, ...suggestedQuestions])].slice(0, 4);
  const { messages, sendMessage, status, error, clearError, setMessages } = useChat({ messages: initial, transport });
  const busy = status === "submitted" || status === "streaming";
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const offerBooking = Boolean(lastUser && wantsBooking(textOf(lastUser)));

  const shown = messages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: textOf(m) }));
  if (status === "submitted" || (busy && shown.at(-1)?.role === "user")) shown.push({ role: "assistant", content: "" });
  if (error && !busy)
    shown.push({ role: "assistant", content: `I'm having trouble connecting. You can reach ${first} on LinkedIn: ${profile.linkedin}` });

  // Tease once per session: open on wide screens, a small bubble on phones.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(TEASED)) return;
    } catch {}
    const t = window.setTimeout(() => {
      setTeaser(true);
      try {
        sessionStorage.setItem(TEASED, "1");
      } catch {}
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  // The teaser steps aside on its own so it never parks over content.
  useEffect(() => {
    if (!teaser) return;
    const t = window.setTimeout(() => setTeaser(false), 12000);
    return () => clearTimeout(t);
  }, [teaser]);

  useEffect(() => {
    if (status === "ready") {
      try {
        sessionStorage.setItem(STORE, JSON.stringify(messages));
      } catch {}
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, status, view, open]);

  useEffect(() => {
    if (!open) return;
    setGreet(hello());
    setTeaser(false);
    if (view === "chat") inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        launchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, view]);

  function ask(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    setView("chat");
    setInput("");
    clearError();
    sendMessage({ text });
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <div className="chat">
      {open && (
        <section className="chat-panel" role="dialog" aria-label={`Chat with ${first}'s assistant`}>
          <header className="chat-head">
            <span className="chat-avatar" aria-hidden="true">
              SS
            </span>
            <div>
              <strong>
                {greet.title} <span aria-hidden="true">{greet.icon}</span>
              </strong>
              <small>
                <i /> Portfolio assistant
              </small>
            </div>
            <button
              className="chat-reset"
              disabled={busy || messages.length === 0}
              onClick={() => {
                setMessages([]);
                clearError();
                setInput("");
              }}
              aria-label="Start a new conversation"
              title="Start a new conversation"
            >
              ↺
            </button>
            <button className="chat-x" aria-label="Close chat" onClick={() => setOpen(false)}>
              ×
            </button>
          </header>
          <nav className="chat-tabs" aria-label="Assistant views">
            <button aria-pressed={view === "guide"} onClick={() => setView("guide")}>
              ◇ Guide
            </button>
            <button aria-pressed={view === "chat"} aria-label={`Ask about ${first}`} onClick={() => setView("chat")}>
              ◌ Ask
            </button>
            <button aria-pressed={view === "book"} onClick={() => setView("book")}>
              📅 Book
            </button>
          </nav>
          {view === "guide" ? (
            <div className="chat-guide">
              <p className="chat-msg assistant">{greet.message}</p>
              <div className="chat-context">
                <span>
                  📍 You&apos;re viewing <b>{context.label}</b>
                </span>
                {context.questions.map((q) => (
                  <button key={q} disabled={busy} onClick={() => ask(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <button className="chat-action featured" onClick={() => setView("book")}>
                <span>
                  <strong>📅 Book a 30-min call</strong>
                  <small>{availabilityLabel}</small>
                </span>
                <span aria-hidden="true">→</span>
              </button>
              <p className="chat-sub">Or choose a starting point</p>
              {guideActions.map((a) => (
                <button key={a.label} className="chat-action" disabled={busy} onClick={() => ask(a.question)}>
                  <span>
                    <strong>{a.label}</strong>
                    <small>{a.detail}</small>
                  </span>
                  <span aria-hidden="true">↗</span>
                </button>
              ))}
              <a className="chat-action" href={profile.linkedin} target="_blank" rel="noreferrer">
                <span>
                  <strong>Connect on LinkedIn</strong>
                  <small>{profile.linkedin.replace("https://www.", "")}</small>
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          ) : view === "book" ? (
            <div className="chat-book">
              <BookingFlow compact />
            </div>
          ) : (
            <>
              <div className="chat-log" ref={listRef} aria-live="polite">
                <p className="chat-msg assistant">{greet.message}</p>
                {shown.map((m, i) => (
                  <p key={i} className={`chat-msg ${m.role}`}>
                    {m.content ? (
                      linkify(m.content)
                    ) : (
                      <span className="chat-typing" aria-label="Typing">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                  </p>
                ))}
              </div>
              {offerBooking && !busy && (
                <button className="chat-book-cta" onClick={() => setView("book")}>
                  <span aria-hidden="true">📅</span>
                  <span>
                    <strong>Pick a time with {first}</strong>
                    {availabilityLabel}
                  </span>
                  <span aria-hidden="true">→</span>
                </button>
              )}
              <div className="chat-chips">
                {chips.map((q) => (
                  <button key={q} disabled={busy} onClick={() => ask(q)}>
                    {q}
                  </button>
                ))}
              </div>
              <form className="chat-form" onSubmit={submit}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about verification work, skills…"
                  maxLength={600}
                  aria-label="Your question"
                />
                <button type="submit" disabled={busy || !input.trim()} aria-label="Send">
                  ↑
                </button>
              </form>
            </>
          )}
        </section>
      )}
      {teaser && !open && (
        <div className="chat-teaser">
          <button className="chat-teaser-x" aria-label="Dismiss" onClick={() => setTeaser(false)}>
            ×
          </button>
          <button className="chat-teaser-body" onClick={() => setOpen(true)}>
            {greet.icon} {greet.title}! Want a quick tour of {first}&apos;s verification work?
          </button>
        </div>
      )}
      <button
        ref={launchRef}
        className={`chat-launch${open ? " on" : ""}`}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          "×"
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm4 7a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 8 11Zm4 0a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 12 11Zm4 0a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 16 11Z"
            />
          </svg>
        )}
        {!open && <span className="chat-ping" aria-hidden="true" />}
      </button>
    </div>
  );
}
