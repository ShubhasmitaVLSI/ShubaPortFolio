"use client";

import { useState } from "react";
import { glossary } from "@/lib/dv";

/** Flip cards: the term on the front, a plain-language definition on the back. */
export default function Glossary() {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setFlipped((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div className="gloss stagger">
      {glossary.map((g, i) => (
        <button
          key={g.term}
          className={`flip ${flipped.has(i) ? "flipped" : ""}`}
          onClick={() => toggle(i)}
          aria-pressed={flipped.has(i)}
          aria-label={`${g.term}: ${g.full}. ${flipped.has(i) ? g.def : "Show definition"}`}
        >
          <span className="flip-inner">
            <span className="flip-face front">
              <span className="flip-kind">{g.kind}</span>
              <strong>{g.term}</strong>
              <small>{g.full}</small>
              <span className="flip-hint" aria-hidden="true">
                flip ↻
              </span>
            </span>
            <span className="flip-face back">
              <span className="flip-kind">{g.term}</span>
              <span className="flip-def">{g.def}</span>
              <span className="flip-use">
                <b>In practice:</b> {g.use}
              </span>
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
