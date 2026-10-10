"use client";

import { useEffect, useRef, useState } from "react";
import { projects, type Project } from "@/lib/data";
import { focusOn, onFocus, skillForTag } from "@/lib/links";

function Modal({ p, onClose }: { p: Project; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Keep Tab cycling inside the dialog.
      if (e.key === "Tab" && dialogRef.current) {
        const items = [...dialogRef.current.querySelectorAll<HTMLElement>("button")];
        const i = items.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener("keydown", key);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = previousOverflow;
      // No scroll: a tag link may be taking the visitor somewhere else.
      prev?.focus({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} ref={closeRef} aria-label="Close">
          ×
        </button>
        <p className="kicker">
          {p.id} · {p.org} · {p.period}
        </p>
        <h3 id="modal-title">{p.title}</h3>
        <p className="modal-lede">{p.detail}</p>

        <div className="flow" aria-label="Verification layers">
          {p.layers.map((l, i) => (
            <div className="flow-step" key={l} style={{ animationDelay: `${i * 110}ms` }}>
              <span className="flow-idx">{String(i + 1).padStart(2, "0")}</span>
              <span>{l}</span>
            </div>
          ))}
        </div>

        <ul className="modal-list">
          {p.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <div className="tags">
          {p.tags.map((t) => {
            const skill = skillForTag(t);
            if (!skill) return <span className="tag" key={t}>{t}</span>;
            return (
              <button
                className="tag link"
                key={t}
                title="Show in the skill tree"
                onClick={() => {
                  onClose();
                  window.setTimeout(() => focusOn({ kind: "skill", name: skill.name }), 0);
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
        <p className="modal-note">Details generalized to protect confidential design, process and program information.</p>
      </div>
    </div>
  );
}

export default function Work() {
  const [open, setOpen] = useState<Project | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const on = () =>
      setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
    on();
    el.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      el.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  useEffect(
    () =>
      onFocus((t) => {
        const p = t.kind === "project" && projects.find((x) => x.id === t.id);
        if (p) setOpen(p);
      }),
    []
  );

  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".card");
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 360) + 20), behavior: "smooth" });
  };

  return (
    <>
      <div className="rail-wrap">
        <div className="rail" ref={rail} tabIndex={0} aria-label="Featured projects">
          {projects.map((p) => (
            <button className="card spot" key={p.id} onClick={() => setOpen(p)}>
              <div className="card-top">
                <span>{p.id}</span>
                <span>{p.period}</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.summary}</p>
              <div className="card-foot">
                <span>{p.org}</span>
                <span className="tags">
                  {p.tags.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </span>
              </div>
              <span className="card-open" aria-hidden="true">
                ↗
              </span>
            </button>
          ))}
        </div>
        <div className="rail-ctrl">
          <button className="round" onClick={() => nudge(-1)} disabled={edge.start} aria-label="Previous">
            ←
          </button>
          <button className="round" onClick={() => nudge(1)} disabled={edge.end} aria-label="Next">
            →
          </button>
        </div>
      </div>
      {open && <Modal p={open} onClose={() => setOpen(null)} />}
    </>
  );
}
