"use client";

import { useEffect, useRef, useState } from "react";
import { profile } from "@/lib/data";

// Portrait mounted as the "DUT" at the centre of a stylised die, with signal
// traces flowing into it. Falls back to a monogram if the photo is missing.

const pins = Array.from({ length: 9 }, (_, i) => 60 + i * 35);

const traces = [
  "M200,200 H120 V95 H60",
  "M200,200 H280 V130 H340",
  "M200,200 V300 H130 V340",
  "M200,200 V110 H245 V60",
  "M200,200 H300 V270 H340",
  "M200,200 H95 V270 H60",
  "M200,200 V330 H270 V340",
  "M200,200 V80 H165 V60",
];

const blocks = [
  { x: 66, y: 66, w: 56, h: 30, label: "IP" },
  { x: 280, y: 66, w: 56, h: 30, label: "JTAG" },
  { x: 66, y: 306, w: 56, h: 30, label: "PLL" },
  { x: 280, y: 306, w: 56, h: 30, label: "AXI" },
];

export default function ChipDie() {
  const [photo, setPhoto] = useState(Boolean(profile.image));
  const img = useRef<HTMLImageElement>(null);

  // onError can fire before hydration; catch an already-failed load too.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setPhoto(false);
  }, []);

  return (
    <figure className="chip">
      <div className="chip-stage">
        <svg viewBox="0 0 400 400" aria-hidden="true">
          <defs>
            <linearGradient id="dieGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity=".22" />
              <stop offset="1" stopColor="var(--accent-2)" stopOpacity=".08" />
            </linearGradient>
          </defs>

          {pins.map((p) => (
            <g key={p} className="pins">
              <rect x={p - 5} y={22} width={10} height={24} rx={2} />
              <rect x={p - 5} y={354} width={10} height={24} rx={2} />
              <rect x={22} y={p - 5} width={24} height={10} rx={2} />
              <rect x={354} y={p - 5} width={24} height={10} rx={2} />
            </g>
          ))}

          <rect x={48} y={48} width={304} height={304} rx={18} className="die" fill="url(#dieGrad)" />
          <rect x={60} y={60} width={280} height={280} rx={12} className="die-inner" />

          {traces.map((d, i) => (
            <g key={i}>
              <path d={d} className="trace-base" />
              <path d={d} className="trace-flow" style={{ animationDelay: `${i * 0.45}s` }} />
            </g>
          ))}

          {blocks.map((b) => (
            <g key={b.label} className="block">
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={6} />
              <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 4} textAnchor="middle">
                {b.label}
              </text>
            </g>
          ))}
        </svg>

        <div className="portrait">
          <div className="portrait-ring" aria-hidden="true" />
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img ref={img} src={profile.image || undefined} alt="Portrait of Shubhasmita Sahoo" onError={() => setPhoto(false)} />
          ) : (
            <span className="portrait-fallback" aria-label="Shubhasmita Sahoo">
              SS
            </span>
          )}
          <span className="portrait-scan" aria-hidden="true" />
        </div>

        <span className="dut-badge">
          <i /> DUT · verified ✓
        </span>
      </div>
      <figcaption>
        <strong>Shubhasmita Sahoo</strong>
        <span>shubhasmitavlsi</span>
      </figcaption>
    </figure>
  );
}
