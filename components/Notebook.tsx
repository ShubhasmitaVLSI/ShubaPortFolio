"use client";

import { useState } from "react";
import { aiUses, approach, certifications, cycle, education } from "@/lib/data";
import Collapse from "./Collapse";

type Row = { title: string; meta?: string; body: React.ReactNode };
type Chapter = { id: string; tag: string; label: string; rows: Row[]; foot?: React.ReactNode };

const chapters: Chapter[] = [
  {
    id: "approach",
    tag: "approach.sv",
    label: "Engineering approach",
    rows: approach.map((a) => ({ title: a.title, body: <p>{a.body}</p> })),
  },
  {
    id: "ai",
    tag: "ai_layer.py",
    label: "AI-assisted VLSI",
    rows: aiUses.map((u) => ({ title: u.title, body: <p>{u.body}</p> })),
    foot: (
      <p className="nb-foot">
        <span className="live" /> AI speeds up the work; architecture understanding, confidentiality and sign-off stay
        with the engineer. Learning now: GenAI fundamentals · Python for AI · RAG · agentic AI · LangChain.
      </p>
    ),
  },
  {
    id: "learning",
    tag: "learning.log",
    label: "Education & development",
    rows: [
      ...education.map((e) => ({ title: e.degree, meta: e.years, body: <p>{e.school}</p> })),
      {
        title: "Certifications",
        meta: `${certifications.length} entries`,
        body: (
          <ul className="nb-certs">
            {certifications.map((c) => (
              <li key={c.name}>
                <span className="cert-year">{c.year}</span>
                <span>
                  {c.name} <small>· {c.by}</small>
                </span>
              </li>
            ))}
          </ul>
        ),
      },
    ],
  },
];

/** Approach, AI usage and education as switchable chapters of expandable rows, beside the improvement loop. */
export default function Notebook() {
  const [chapter, setChapter] = useState(0);
  const [open, setOpen] = useState(0);
  const ch = chapters[chapter];

  const pickChapter = (i: number) => {
    setChapter(i);
    setOpen(0);
  };

  return (
    <div className="notebook">
      <div className="nb-main">
        <div
          className="nb-tabs"
          role="radiogroup"
          aria-label="Notebook chapter"
          onKeyDown={(e) => {
            const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
            if (!d) return;
            e.preventDefault();
            const next = (chapter + d + chapters.length) % chapters.length;
            pickChapter(next);
            e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")[next]?.focus();
          }}
        >
          {chapters.map((c, i) => (
            <button
              key={c.id}
              role="radio"
              aria-checked={chapter === i}
              tabIndex={chapter === i ? 0 : -1}
              className={chapter === i ? "on" : ""}
              onClick={() => pickChapter(i)}
            >
              <span className="nb-radio" aria-hidden="true" />
              <span className="nb-tab-text">
                <code>{c.tag}</code>
                {c.label}
              </span>
            </button>
          ))}
          <span
            className="nb-tabs-ink"
            aria-hidden="true"
            style={{ "--i": chapter, "--n": chapters.length } as React.CSSProperties}
          />
        </div>

        <div className="nb-rows" key={ch.id}>
          {ch.rows.map((r, i) => {
            const on = open === i;
            const id = `nb-${ch.id}-${i}`;
            return (
              <div className={`nb-row ${on ? "open" : ""}`} key={r.title} style={{ animationDelay: `${i * 60}ms` }}>
                <h3>
                  <button id={`${id}-h`} aria-expanded={on} aria-controls={id} onClick={() => setOpen(on ? -1 : i)}>
                    <span className="nb-idx">{String(i + 1).padStart(2, "0")}</span>
                    <span className="nb-title">{r.title}</span>
                    {r.meta && <span className="nb-meta">{r.meta}</span>}
                    <span className="nb-caret" aria-hidden="true" />
                  </button>
                </h3>
                <Collapse open={on} id={id} labelledBy={`${id}-h`}>
                  <div className="nb-body">{r.body}</div>
                </Collapse>
              </div>
            );
          })}
          {ch.foot}
        </div>
      </div>

      <div className="cycle" aria-label={`Continuous improvement loop: ${cycle.join(", ")}`}>
        <svg viewBox="0 0 300 300" className="cycle-ring" aria-hidden="true">
          <circle cx="150" cy="150" r="112" className="cycle-track" />
          <circle cx="150" cy="150" r="112" className="cycle-arc" />
        </svg>
        {cycle.map((c, i) => {
          // Spread the nodes evenly around the ring, starting at 12 o'clock.
          const a = (i / cycle.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <span
              className="cycle-node"
              key={c}
              style={{
                left: `${50 + Math.cos(a) * 37.3}%`,
                top: `${50 + Math.sin(a) * 37.3}%`,
                animationDelay: `${i * 1.2}s`,
              }}
            >
              {c}
            </span>
          );
        })}
        <div className="cycle-core">
          <strong>Continuous</strong>
          <span>improvement</span>
        </div>
      </div>
    </div>
  );
}
