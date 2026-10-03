import ChipDie from "@/components/ChipDie";
import Kicker from "@/components/Kicker";
import { pills, profile } from "@/lib/data";

export default function About() {
  return (
    <section className="about" id="about" data-reveal>
      <ChipDie />
      <div className="about-copy">
        <Kicker id="about">Profile</Kicker>
        <h2>
          Rigorous, traceable, <em>silicon-ready</em>.
        </h2>
        <p>
          I&apos;m a Design Verification Engineer with {profile.years} years across IP- and SoC-level verification.
          My work spans IP verification, SoC verification, FIFO verification, timing-aware gate-level
          simulation, assertion-based checking, power-aware verification, coverage closure, regression
          infrastructure and debug across RTL and netlist environments.
        </p>
        <p>
          Next, I want to deepen verification architecture and system-level ownership, and build stronger formal,
          emulation, performance, hardware-security and Python-driven automation skills through deliberate
          practice and measurable feedback.
        </p>
        <div className="pills stagger">
          {pills.map((p) => (
            <span className="pill" key={p}>
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
