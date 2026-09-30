import { phaseOf } from "@/lib/dv";

/** Section label with its UVM phase tag, e.g. `start_of_simulation` · Case files. */
export default function Kicker({ id, children }: { id?: string; children: React.ReactNode }) {
  const phase = id ? phaseOf(id) : "";
  return (
    <p className="kicker">
      {phase && <span className="phase-tag">{phase}</span>}
      <span className="kicker-text">{children}</span>
    </p>
  );
}
