"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/data";
import CircuitAtlas from "@/components/CircuitAtlas";
import Netlist from "./Netlist";

const roles = [
  "Design Verification Engineer",
  "GLS-SDF & timing-aware debug",
  "SVA & coverage closure",
  "JTAG-based bring-up",
  "IP & testchip verification",
  "X-prop & setup/hold triage",
  "UVM · SVA · functional coverage",
  "ZeBu emulation support",
];

function useRotatingType(words: string[]) {
  const [text, setText] = useState("");
  const [i, setI] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(words[0]);
      return;
    }
    const word = words[i % words.length];
    let t: number;
    if (!del && text === word) t = window.setTimeout(() => setDel(true), 1800);
    else if (del && text === "") {
      setDel(false);
      setI((v) => v + 1);
      return;
    } else {
      t = window.setTimeout(
        () => setText(del ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1)),
        del ? 28 : 55
      );
    }
    return () => clearTimeout(t);
  }, [text, del, i, words]);

  return text;
}

export default function Hero() {
  const role = useRotatingType(roles);
  let delay = 0;

  return (
    <section className="hero" id="top">
      <Netlist />
      <div className="hero-copy">
        <div className="eyebrow reveal">
          <span className="live" />
          {profile.company} · {profile.location}
        </div>
        <h1 className="reveal d1">
          <span className="sr-only">{profile.name}</span>
          <span aria-hidden="true" className="name">
            {[profile.first, profile.last].map((word, w) => (
              <span className={`word ${w === 1 ? "grad" : ""}`} key={word}>
                {word.split("").map((ch, i) => {
                  delay += 0.04;
                  return (
                    <span
                      className="letter"
                      style={{ animationDelay: `calc(var(--boot, 0s) + ${delay}s)`, "--i": i, "--n": word.length } as React.CSSProperties}
                      key={i}
                    >
                      {ch}
                    </span>
                  );
                })}
              </span>
            ))}
          </span>
        </h1>
        <p className="role reveal d2">
          <span className="role-prefix">&gt;</span> {role}
          <i className="caret thin" />
        </p>
        <p className="lede reveal d2">{profile.tagline}</p>
        <div className="hero-actions reveal d3">
          <a className="btn primary magnetic" href="#work">
            View work <span aria-hidden="true">→</span>
          </a>
          <a className="btn ghost magnetic" href={profile.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a className="btn ghost magnetic" href={profile.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
        <div className="meta-row reveal d3">
          <span>
            <strong>{profile.years} yrs</strong> · Design Verification
          </span>
          <span>IP · SoC · Testchip</span>
          <span>Growing toward Staff / Principal-track DV</span>
        </div>
      </div>
      <CircuitAtlas compact />
    </section>
  );
}

