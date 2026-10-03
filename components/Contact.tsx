import Kicker from "@/components/Kicker";
import { availabilityLabel } from "@/lib/booking";
import { profile } from "@/lib/data";

export default function Contact() {
  return (
    <section id="contact" className="contact" data-reveal>
      <Kicker id="contact">Contact</Kicker>
      <h2 className="contact-title">
        Let&apos;s close <em>coverage</em> together.
      </h2>
      <p className="contact-lede">
        Open to conversations on IP and SoC verification, verification architecture and AI-assisted DV.
      </p>
      <div className="hero-actions center">
        <a className="btn primary magnetic" href={profile.booking}>
          Book a 30-min call <span aria-hidden="true">→</span>
        </a>
        <a className="btn ghost magnetic" href={profile.linkedin} target="_blank" rel="noreferrer">
          Connect on LinkedIn
        </a>
      </div>
      <p className="contact-avail">
        <span className="live" aria-hidden="true" />
        {availabilityLabel}
      </p>
    </section>
  );
}
