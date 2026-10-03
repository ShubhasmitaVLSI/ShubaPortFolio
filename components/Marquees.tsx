import { marquee } from "@/lib/data";
import { uvmTerms } from "@/lib/dv";

/** Two decorative scrolling bands. Each list is doubled so the loop has no gap. */
export default function Marquees() {
  return (
    <>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...marquee, ...marquee].map((m, i) => (
            <span key={i}>
              <b>✦</b> {m}
            </span>
          ))}
        </div>
      </div>

      <div className="marquee reverse" aria-hidden="true">
        <div className="marquee-track">
          {[...uvmTerms, ...uvmTerms].map((m, i) => (
            <span key={i}>
              <b>{"//"}</b> {m}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
