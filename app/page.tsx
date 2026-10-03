import About from "@/components/About";
import AiUses from "@/components/AiUses";
import Approach from "@/components/Approach";
import Boot from "@/components/Boot";
import { ChatWidget } from "@/components/ChatWidget";
import CircuitAtlas from "@/components/CircuitAtlas";
import Contact from "@/components/Contact";
import Education from "@/components/Education";
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
          aside={<p>A map of core verification capabilities. Select one for a generalized summary; no project data is shown.</p>}
        >
          <CircuitAtlas />
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
              Skills arranged as a UVM component tree. Click a branch to collapse it and hover a leaf to inspect it;
              signals trace the path from the top.
            </p>
          }
        >
          <SkillTree />
          <MethodologyReport />
        </Section>

        <Section
          id="approach"
          kicker={<Kicker id="approach">Engineering approach</Kicker>}
          title={<>Every technique covers a <em>different</em> risk.</>}
          aside={
            <p>
              Improvement runs as a recurring loop: after each project or complex debug, lessons become checklists,
              assertions, scripts or components.
            </p>
          }
        >
          <Approach />
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
        </Section>

        <Section
          id="ai"
          kicker={<Kicker id="ai">AI-assisted VLSI</Kicker>}
          title={<>AI as a <em>layer</em>, judgment stays human.</>}
          aside={
            <p>
              AI is there to speed up work and help find information. Architecture understanding, engineering
              judgment, confidentiality and final verification decisions stay with the engineer.
            </p>
          }
        >
          <AiUses />
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

        <Section
          id="education"
          kicker={<Kicker>Education &amp; development</Kicker>}
          title={<>Learn → Apply → <em>Standardize</em>.</>}
          aside={
            <p>
              Continuous improvement: deliberate learning, applied to real verification problems, with measurable
              feedback and reflection.
            </p>
          }
        >
          <Education />
        </Section>

        <Contact />
      </main>
      <Footer />
      <Hud />
      <ChatWidget />
    </>
  );
}
