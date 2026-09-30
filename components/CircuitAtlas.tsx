"use client";

import { useState } from "react";
import { profile, projects } from "@/lib/data";

const nodes = [
  { label: "IP VERIFICATION", relation: "verifies", x: 0, y: 0 },
  { label: "TESTCHIP", relation: "integrates", x: 2, y: 0 },
  { label: "TIMING & GLS", relation: "validates", x: 0, y: 2 },
  { label: "EMULATION", relation: "scales", x: 2, y: 2 },
  { label: "AUTOMATION", relation: "accelerates", x: 1, y: 3 },
];

export default function CircuitAtlas({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState(0);
  const project = projects[selected];

  return (
    <div className={`atlas ${compact ? "atlas-compact" : ""}`}>
      <div className="atlas-toolbar"><span><i className="live" /> {compact ? "ENGINEERING DNA" : "PORTFOLIO / RELATIONSHIP MAP"}</span><span>REV. 01</span></div>
      <div className="atlas-board" aria-label="Explore verification expertise">
        <svg className="atlas-wires" viewBox="0 0 600 480" preserveAspectRatio="none" aria-hidden="true">
          {[
            "M300 210H100V60", "M300 210H500V60", "M300 210H100V330", "M300 210H500V330", "M300 210V430",
          ].map((d, i) => <g key={d} className={selected === i ? "wire-selected" : ""}><path d={d} /><path className="wire-signal" d={d} style={{ animationDelay: `${i * -.8}s` }} /></g>)}
        </svg>
        <div className="atlas-core"><span className="core-orbit" /><span className="atlas-key">PRIMARY ENTITY</span><strong>SS<span> / DV</span></strong><small>{profile.first} {profile.last}</small><span className="core-caption">Design Verification Engineer</span></div>
        {nodes.map((node, i) => (
          <button key={node.label} className={`atlas-node ${selected === i ? "selected" : ""}`} style={{ gridColumn: node.x + 1, gridRow: node.y + 1 }} aria-pressed={selected === i} aria-controls={compact ? "hero-atlas-detail" : "atlas-detail"} onClick={() => setSelected(i)}>
            <span className="node-relation">{node.relation} <span>1 : N</span></span>
            <strong><span className="node-port" />{node.label}</strong>
            <small>{projects[i].tags.slice(0, 2).join(" · ")}</small>
          </button>
        ))}
      </div>
      <div className="atlas-detail" id={compact ? "hero-atlas-detail" : "atlas-detail"} aria-live="polite" aria-atomic="true">
        <span className="atlas-detail-index">{project.id}</span>
        <div key={project.id} className="atlas-detail-copy"><h3>{project.title}</h3><p>{compact ? project.summary : project.detail}</p>
          {!compact && <div className="atlas-layers">{project.layers.map((layer, i) => <span key={layer}><b>{String(i + 1).padStart(2, "0")}</b>{layer}</span>)}</div>}
          <a href={`/projects#project-${project.id}`}>Explore case file <span aria-hidden="true">↗</span></a>
        </div>
      </div>
      <div className="atlas-footer"><span><i /> SELECT A NODE TO TRACE THE WORK</span><span>05 CONNECTED ENTITIES</span></div>
    </div>
  );
}
