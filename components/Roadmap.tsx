import { growth, roadmap } from "@/lib/data";

/** Career phases, then the primary and adjacent growth tracks. */
export default function Roadmap() {
  return (
    <>
      <div className="roadmap stagger">
        {roadmap.map((r, i) => (
          <article className="road spot" key={r.phase} style={{ transitionDelay: `${i * 120}ms` }}>
            <div className="road-head">
              <span className="road-step">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <time>{r.phase}</time>
                <h3>{r.label}</h3>
              </div>
            </div>
            <ul>
              {r.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="growth">
        <div>
          <h4>Primary track</h4>
          <ul>
            {growth.primary.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Adjacent &amp; future-facing</h4>
          <ul>
            {growth.adjacent.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
