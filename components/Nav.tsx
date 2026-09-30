"use client";

import { useEffect, useRef, useState } from "react";

const links = [
  { href: "#atlas", label: "Atlas" },
  { href: "#work", label: "Work" },
  { href: "#schema", label: "Schema" },
  { href: "#experience", label: "Experience" },
  { href: "#stack", label: "Skills" },
  { href: "#roadmap", label: "Roadmap" },
];

// Each theme is named like a DV artefact and tagged with a playful PVT corner.
export const themes = [
  { id: "circuit", name: "Circuit Atlas", hint: "Copper · teal", corner: "tt 0.80V 25°C", tone: "dark" },
  { id: "nebula", name: "Nebula Netlist", hint: "Violet · mint · coral", corner: "tt 0.80V 25°C", tone: "dark" },
  { id: "orchid", name: "Orchid Assertion", hint: "Plum · orchid · peach", corner: "ss 0.72V 125°C", tone: "dark" },
  { id: "rose", name: "Rosé Gold Die", hint: "Rose gold · lavender", corner: "ff 0.88V -40°C", tone: "dark" },
  { id: "silicon", name: "Silicon Sign-off", hint: "Indigo · cyan", corner: "tt 0.75V 85°C", tone: "dark" },
  { id: "phosphor", name: "Phosphor Waveform", hint: "Verdi green", corner: "sf 0.80V 0°C", tone: "dark" },
  { id: "thermal", name: "Thermal Corner", hint: "Amber · magenta", corner: "ss 0.72V 150°C", tone: "dark" },
  { id: "blush", name: "Blush Wafer", hint: "Blush · berry · violet", corner: "ff 0.99V 0°C", tone: "light" },
  { id: "lilac", name: "Lilac Liberty", hint: "Lilac · rose · teal", corner: "tt 0.90V 25°C", tone: "light" },
  { id: "wafer", name: "Clean Room", hint: "Crisp light", corner: "tt 0.85V 25°C", tone: "light" },
] as const;

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<string>("circuit");
  const [active, setActive] = useState("");
  const paletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "circuit");
  }, []);

  // Highlight the section in view
  useEffect(() => {
    const ids = links.map((l) => l.href.slice(1)).concat("contact");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) setPaletteOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setOpen(false);
      }
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  // Theme swap: a circular reveal from the click point where View Transitions
  // are supported, otherwise a colour cross-fade.
  const pick = (id: string, x: number, y: number) => {
    const root = document.documentElement;
    const apply = () => {
      root.setAttribute("data-theme", id);
      setTheme(id);
    };
    try {
      localStorage.setItem("dv-theme", id);
    } catch {}
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    if (!doc.startViewTransition || reduce) {
      root.classList.add("theme-anim");
      apply();
      window.setTimeout(() => root.classList.remove("theme-anim"), 700);
      return;
    }
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    doc.startViewTransition(apply).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(.2,.8,.2,1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(() => apply());
  };

  return (
    <header className={`nav ${open ? "open" : ""}`}>
      <a className="brand" href="#top" onClick={() => setOpen(false)}>
        <span className="mark">SS</span>
        <span className="brand-name">Shubhasmita</span>
      </a>
      <nav className="nav-links" aria-label="Primary">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className={active === l.href.slice(1) ? "active" : ""}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </a>
        ))}
        <a className="nav-cta" href="#contact" onClick={() => setOpen(false)}>
          Let&apos;s talk
        </a>
      </nav>
      <div className="nav-tools">
        <div className="palette" ref={paletteRef}>
          <button
            className="palette-btn"
            aria-label="Change theme"
            aria-expanded={paletteOpen}
            onClick={() => setPaletteOpen((v) => !v)}
          >
            <span className="swatch-mini" />
          </button>
          {paletteOpen && (
            <div className="palette-menu" role="menu">
              <p className="palette-title">Theme · select corner</p>
              {(["dark", "light"] as const).map((tone) => (
                <div key={tone} className="palette-group">
                  <p className="palette-sub">{tone === "dark" ? "Dark corners" : "Light corners"}</p>
                  {themes
                    .filter((t) => t.tone === tone)
                    .map((t) => (
                      <button
                        key={t.id}
                        role="menuitemradio"
                        aria-checked={theme === t.id}
                        className={`palette-item ${theme === t.id ? "on" : ""}`}
                        onClick={(e) => {
                          pick(t.id, e.clientX, e.clientY);
                          setPaletteOpen(false);
                        }}
                      >
                        <span className={`swatch swatch-${t.id}`} />
                        <span className="palette-text">
                          <strong>{t.name}</strong>
                          <small>{t.hint}</small>
                        </span>
                        <code className="palette-corner">{t.corner}</code>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          className="menu-btn"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
        </button>
      </div>
    </header>
  );
}


