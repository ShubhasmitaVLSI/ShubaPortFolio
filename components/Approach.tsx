import { approach, cycle } from "@/lib/data";

/** Approach cards beside the continuous-improvement loop. */
export default function Approach() {
  return (
    <div className="approach">
      <div className="approach-grid stagger">
        {approach.map((a, i) => (
          <article className="approach-card spot" key={a.title}>
            <span className="approach-idx">0{i + 1}</span>
            <h3>{a.title}</h3>
            <p>{a.body}</p>
          </article>
        ))}
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
