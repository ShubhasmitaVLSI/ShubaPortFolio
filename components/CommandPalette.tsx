"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackSearch } from "@/lib/track";
import { STATIC_COMMANDS, postCommands, score, termCommands, type Command, type CommandGroup, type SearchPost, type SearchTerm } from "@/lib/command-index";

const OPEN_EVENT = "dv:palette";
const GROUP_ORDER: CommandGroup[] = ["Pages", "Sections", "Lexicon", "Blog", "Glossary", "Actions"];
const SUGGESTED = ["l-dut", "p-blog", "s-work", "s-schema", "s-approach", "p-book"];

/** Open the palette from anywhere (header buttons dispatch this). */
export const openPalette = () => window.dispatchEvent(new Event(OPEN_EVENT));

export function PaletteButton({ className = "" }: { className?: string }) {
  // Show the shortcut for this platform; set after mount so server and client markup match.
  const [mod, setMod] = useState("⌘");
  useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setMod("Ctrl ");
  }, []);
  return (
    <button type="button" className={`cmdk-btn ${className}`} onClick={openPalette} aria-label="Search the site" aria-keyshortcuts="Control+K Meta+K">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
      <kbd aria-hidden="true">{mod}K</kbd>
    </button>
  );
}

/** Site-wide jump-to console: ⌘K / Ctrl+K, or any PaletteButton. */
export function CommandPalette() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  // Lexicon entries and blog posts, fetched on first open.
  const [remote, setRemote] = useState<Command[] | null>(null);

  useEffect(() => {
    const show = () => setOpen(true);
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener(OPEN_EVENT, show);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      window.removeEventListener("keydown", key);
    };
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setQuery("");
      setActive(0);
      input.current?.focus();
      // Fetched once, on first open; the palette still works if this fails.
      if (!remote)
        fetch("/api/search")
          .then((r) => (r.ok ? r.json() : { posts: [], terms: [] }))
          .then((j: { posts: SearchPost[]; terms?: SearchTerm[] }) => setRemote([...termCommands(j.terms ?? []), ...postCommands(j.posts)]))
          .catch(() => setRemote([]));
    }
    if (!open && d.open) d.close();
  }, [open, remote]);

  // Empty query: a short suggested list plus the latest posts. Otherwise ranked
  // matches, grouped in a fixed order. `flat` is the keyboard order.
  const groups = useMemo(() => {
    const all = [...STATIC_COMMANDS, ...(remote ?? [])];
    if (!query.trim()) {
      const picks = SUGGESTED.map((id) => all.find((c) => c.id === id)).filter((c): c is Command => Boolean(c));
      return [
        { label: "Suggested", items: picks },
        { label: "Latest posts", items: (remote ?? []).filter((c) => c.group === "Blog").slice(0, 3) },
      ].filter((x) => x.items.length);
    }
    const ranked = all
      .map((c) => ({ c, s: score(c, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((r) => r.c);
    return GROUP_ORDER.map((g) => ({ label: g as string, items: ranked.filter((c) => c.group === g) })).filter((x) => x.items.length);
  }, [query, remote]);
  const flat = groups.flatMap((x) => x.items);

  // What visitors look for (and find nothing for) shows up on the author dashboard.
  useEffect(() => {
    if (open && remote && query.trim()) trackSearch(query, flat.length);
  }, [open, remote, query, flat.length]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (c: Command | undefined) => {
    if (!c) return;
    setOpen(false);
    if (c.external) {
      window.open(c.href, "_blank", "noopener,noreferrer");
      return;
    }
    // Same-page anchors scroll without a reload.
    const url = new URL(c.href, window.location.href);
    if (url.pathname === window.location.pathname && url.hash) {
      document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", url.hash);
    } else window.location.assign(c.href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const d = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (flat.length ? (a + d + flat.length) % flat.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(flat[active]);
    }
  };

  let i = -1;
  return (
    <dialog
      ref={dialog}
      className="cmdk"
      aria-label="Search the site"
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="cmdk-panel">
        <div className="cmdk-input">
          <span className="cmdk-prompt" aria-hidden="true">
            sim&gt;
          </span>
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Jump to a section, post or term…"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-activedescendant={flat[active] ? `cmdk-${flat[active].id}` : undefined}
            aria-autocomplete="list"
            spellCheck={false}
          />
          <kbd className="cmdk-esc">esc</kbd>
        </div>

        <ul className="cmdk-list" id="cmdk-list" role="listbox" ref={list} key={query.trim() ? "q" : "suggested"}>
          {groups.map(({ label, items }) => (
            <li key={label} role="presentation">
              <p className="cmdk-group" aria-hidden="true">
                {label}
              </p>
              <ul role="presentation">
                {items.map((c) => {
                  i++;
                  const idx = i;
                  return (
                    <li
                      key={c.id}
                      id={`cmdk-${c.id}`}
                      role="option"
                      aria-selected={idx === active}
                      data-i={idx}
                      className={`cmdk-item ${idx === active ? "on" : ""}`}
                      style={{ "--i": Math.min(idx, 10) } as React.CSSProperties}
                      onMouseMove={() => idx !== active && setActive(idx)}
                      onClick={() => go(c)}
                    >
                      <span className={`cmdk-icon g-${c.group.toLowerCase()}`} aria-hidden="true" />
                      <span className="cmdk-title">{c.title}</span>
                      {c.hint && <span className="cmdk-hint">{c.hint}</span>}
                      <span className="cmdk-go" aria-hidden="true">
                        {c.external ? "↗" : "↵"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
        {!flat.length && (
          <p className="cmdk-empty" role="status">
            No match for “{query}”. Try <button onClick={() => setQuery("gls")}>gls</button>,{" "}
            <button onClick={() => setQuery("dut")}>dut</button> or <button onClick={() => setQuery("fifo")}>fifo</button>.
          </p>
        )}
        <p className="cmdk-foot" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> open
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </p>
      </div>
    </dialog>
  );
}
