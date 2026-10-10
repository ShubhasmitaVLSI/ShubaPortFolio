import About from "@/components/About";
import Boot from "@/components/Boot";
import CapabilityWheel from "@/components/CapabilityWheel";
import { ChatWidget } from "@/components/ChatWidget";
import Contact from "@/components/Contact";
import Effects from "@/components/Effects";
import ErDiagram from "@/components/ErDiagram";
import Footer from "@/components/Footer";
import Glossary from "@/components/Glossary";
import Hero from "@/components/Hero";
import Hud from "@/components/Hud";
import Journey from "@/components/Journey";
import Kicker from "@/components/Kicker";
import Marquees from "@/components/Marquees";
import MethodologyReport from "@/components/MethodologyReport";
import Metrics from "@/components/Metrics";
import Nav from "@/components/Nav";
import Notebook from "@/components/Notebook";
import Roadmap from "@/components/Roadmap";
import Section from "@/components/Section";
import SkillTree from "@/components/SkillTree";
import Waveform from "@/components/Waveform";
import Work from "@/components/Work";

export default function Home() {
  return (
    <>
      <Boot />
      <Effects />
      <Nav />
      <main>
        <Hero />
        <Waveform />
        <Marquees />

        <Section
          id="atlas"
          kicker={<p className="kicker">01 / Capability map</p>}
          title={<>Explore the <em>verification skills map.</em></>}
          aside={
            <p>
              Five core capabilities orbit one engineer. Pick one, or use the arrow keys, to turn it to the top of the
              dial and open its flow, skills and case file.
            </p>
          }
        >
          <CapabilityWheel />
        </Section>

        <Section
          id="impact"
          kicker={<Kicker id="impact">Verification summary</Kicker>}
          title={<>Verification that <em>holds</em> on silicon.</>}
          aside={<p>From RTL to back-annotated netlists, each layer closes a different class of risk before tape-out.</p>}
        >
          <Metrics />
        </Section>

        <About />

        <Section
          id="work"
          kicker={<Kicker id="work">Case files</Kicker>}
          title={<>From <em>RTL</em> to netlist.</>}
          aside={
            <div>
              <p>Representative work, generalized to protect confidential design, process and program details.</p>
              <p className="rail-hint">Scroll sideways · click a card for the flow</p>
            </div>
          }
        >
          <Work />
          <div className="actions">
            <a className="btn ghost" href="/projects">
              Full project archive →
            </a>
          </div>
        </Section>

        <Section
          id="schema"
          kicker={<Kicker id="schema">Career schema</Kicker>}
          title={<>A career, <em>normalized</em>.</>}
          aside={
            <p>
              The same story as an entity-relationship model: one engineer, the employer, projects, skills, verification
              flows, education, certifications and goals, joined by what connects them.
            </p>
          }
        >
          <ErDiagram />
        </Section>

        <Section
          id="experience"
          kicker={<Kicker id="experience">Timeline</Kicker>}
          title={<>Built on <em>fundamentals</em>, sharpened on silicon.</>}
          aside={<p>R&amp;D Senior Engineer at Synopsys since July 2023, after an M.Tech at KIIT and a B.Tech at NIT Rourkela.</p>}
        >
          <Journey />
        </Section>

        <Section
          id="stack"
          kicker={<Kicker id="stack">Skill hierarchy</Kicker>}
          title={<>Instantiated like a <em>testbench</em>.</>}
          aside={
            <p>
              Skills arranged as a UVM component tree. Click a branch to collapse it, hover a leaf to preview it and click to pin it;
              signals trace the path from the top.
            </p>
          }
        >
          <SkillTree />
          <MethodologyReport />
        </Section>

        <Section
          id="approach"
          kicker={<Kicker id="approach">Engineering notebook</Kicker>}
          title={<>Every technique covers a <em>different</em> risk.</>}
          aside={
            <p>
              How the work gets done, where AI fits in, and how the learning keeps going. Switch chapters and open a row;
              lessons from each project feed back into the loop.
            </p>
          }
        >
          <Notebook />
        </Section>

        <Section
          id="glossary"
          kicker={<Kicker id="glossary">DV glossary</Kicker>}
          title={<>Speak <em>verification</em>.</>}
          aside={
            <p>
              The vocabulary behind the work, in plain language. Flip a card to see the definition and where it shows up
              in practice.
            </p>
          }
        >
          <Glossary />
          <div className="actions">
            <a className="btn ghost" href="/lexicon">
              Go deeper in the DV Lexicon →
            </a>
          </div>
        </Section>

        <Section
          id="roadmap"
          kicker={<Kicker id="roadmap">Career roadmap</Kicker>}
          title={<>Toward <em>Staff / Principal</em>-track DV.</>}
          aside={
            <p>
              From strong hands-on IP and SoC verification to verification architecture, methodology ownership and
              cross-team technical leadership.
            </p>
          }
        >
          <Roadmap />
        </Section>

        <Contact />
      </main>
      <Footer />
      <Hud />
      <ChatWidget />
    </>
  );
}
