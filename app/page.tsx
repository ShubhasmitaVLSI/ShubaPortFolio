import Effects from "@/components/Effects";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import CircuitAtlas from "@/components/CircuitAtlas";
import Waveform from "@/components/Waveform";
import Metrics from "@/components/Metrics";
import ChipDie from "@/components/ChipDie";
import Work from "@/components/Work";
import Journey from "@/components/Journey";
import Footer from "@/components/Footer";
import Boot from "@/components/Boot";
import SkillTree from "@/components/SkillTree";
import ErDiagram from "@/components/ErDiagram";
import { ChatWidget } from "@/components/ChatWidget";
import Kicker from "@/components/Kicker";
import Hud from "@/components/Hud";
import Glossary from "@/components/Glossary";
import { uvmTerms } from "@/lib/dv";
import {
  aiUses,
  approach,
  certifications,
  cycle,
  growth,
  marquee,
  pills,
  profile,
  roadmap,
} from "@/lib/data";

const report = [
  ["UVM_INFO", "test plan", "feature-based, traceable"],
  ["UVM_INFO", "stimulus", "constrained-random + directed"],
  ["UVM_INFO", "checking", "SVA properties + scoreboards"],
  ["UVM_INFO", "gate level", "GLS · PG-GLS · GLS-SDF"],
  ["UVM_INFO", "power", "UPF-aware scenarios"],
  ["UVM_INFO", "scale", "emulation + automated regressions"],
];

export default function Home() {
  return (
    <>
      <Boot />
      <Effects />
      <Nav />
      <main>
        <Hero />
        <Waveform />

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

        <section id="atlas" data-reveal>
          <div className="section-head">
            <div><p className="kicker">01 / Capability map</p><h2>Explore the <em>verification skills map.</em></h2></div>
            <p>A map of core verification capabilities. Select one for a generalized summary; no project data is shown.</p>
          </div>
          <CircuitAtlas />
        </section>

        <section id="impact" data-reveal>
          <div className="section-head">
            <div>
              <Kicker id="impact">Verification summary</Kicker>
              <h2>
                Verification that <em>holds</em> on silicon.
              </h2>
            </div>
            <p>
              From RTL to back-annotated netlists, each layer closes a different class of risk before
              tape-out.
            </p>
          </div>
          <Metrics />
        </section>

        <section className="about" id="about" data-reveal>
          <ChipDie />
          <div className="about-copy">
            <Kicker id="about">Profile</Kicker>
            <h2>
              Rigorous, traceable, <em>silicon-ready</em>.
            </h2>
            <p>
              I&apos;m a Design Verification Engineer with {profile.years} years across IP- and SoC-level verification.
              My work spans IP verification, testchip verification, JTAG-based verification and debug, timing-aware gate-level
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

        <section id="work" data-reveal>
          <div className="section-head">
            <div>
              <Kicker id="work">Case files</Kicker>
              <h2>
                From <em>RTL</em> to netlist.
              </h2>
            </div>
            <div>
              <p>Representative work, generalized to protect confidential design, process and program details.</p>
              <p className="rail-hint">Scroll sideways · click a card for the flow</p>
            </div>
          </div>
          <Work />
          <div className="actions">
            <a className="btn ghost" href="/projects">
              Full project archive →
            </a>
          </div>
        </section>

        <section id="schema" data-reveal>
          <div className="section-head">
            <div>
              <Kicker id="schema">Career schema</Kicker>
              <h2>
                A career, <em>normalized</em>.
              </h2>
            </div>
            <p>
              The same story as an entity-relationship model: one engineer, the employer, projects, skills, verification
              flows, education, certifications and goals, joined by what connects them.
            </p>
          </div>
          <ErDiagram />
        </section>

        <section id="experience" data-reveal>
          <div className="section-head">
            <div>
              <Kicker id="experience">Timeline</Kicker>
              <h2>
                Built on <em>fundamentals</em>, sharpened on silicon.
              </h2>
            </div>
            <p>R&amp;D Senior Engineer at Synopsys since July 2023, after an M.Tech at KIIT and a B.Tech at NIT Rourkela.</p>
          </div>
          <Journey />
        </section>

        <section id="stack" data-reveal>
          <div className="section-head">
            <div>
              <Kicker id="stack">Skill hierarchy</Kicker>
              <h2>
                Instantiated like a <em>testbench</em>.
              </h2>
            </div>
            <p>Skills arranged as a UVM component tree. Click a branch to collapse it and hover a leaf to inspect it; signals trace the path from the top.</p>
          </div>
          <SkillTree />

          <div className="report" data-reveal>
            <div className="terminal-bar">
              <i className="dot r" />
              <i className="dot y" />
              <i className="dot g" />
              <span>uvm_report_summary — methodology</span>
            </div>
            <div className="report-body">
              {report.map(([sev, id, msg], i) => (
                <div className="report-row" key={id} style={{ animationDelay: `${i * 120}ms` }}>
                  <span className="sev">{sev}</span>
                  <span className="rid">[{id}]</span>
                  <span className="msg">{msg}</span>
                  <span className="bar">
                    <i style={{ animationDelay: `${300 + i * 140}ms` }} />
                  </span>
                </div>
              ))}
              <div className="report-foot">
                <span>
                  UVM_WARNING : <b>0</b>
                </span>
                <span>
                  UVM_ERROR : <b>0</b>
                </span>
                <span>
                  UVM_FATAL : <b>0</b>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="approach" data-reveal>
          <div className="section-head">
            <div>
              <Kicker id="approach">Engineering approach</Kicker>
              <h2>
                Every technique covers a <em>different</em> risk.
              </h2>
            </div>
            <p>Improvement runs as a recurring loop: after each project or complex debug, lessons become checklists, assertions, scripts or components.</p>
          </div>
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
            <div className="cycle" aria-label="Continuous improvement loop: Learn, Apply, Measure, Reflect, Standardize">
              <svg viewBox="0 0 300 300" className="cycle-ring" aria-hidden="true">
                <circle cx="150" cy="150" r="112" className="cycle-track" />
                <circle cx="150" cy="150" r="112" className="cycle-arc" />
              </svg>
              {cycle.map((c, i) => {
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
        </section>

        <section id="glossary" data-reveal>
          <div className="section-head">
            <div>
              <Kicker id="glossary">DV glossary</Kicker>
              <h2>
                Speak <em>verification</em>.
              </h2>
            </div>
            <p>The vocabulary behind the work, in plain language. Flip a card to see the definition and where it shows up in practice.</p>
          </div>
          <Glossary />
        </section>

        <section id="ai" data-reveal>
          <div className="section-head">
            <div>
              <Kicker id="ai">AI-assisted VLSI</Kicker>
              <h2>
                AI as a <em>layer</em>, judgment stays human.
              </h2>
            </div>
            <p>
              AI is there to speed up work and help find information. Architecture understanding, engineering
              judgment, confidentiality and final verification decisions stay with the engineer.
            </p>
          </div>
          <div className="ai-grid stagger">
            {aiUses.map((u, i) => (
              <article className="ai-card spot" key={u.title}>
                <span className="ai-idx">{String(i + 1).padStart(2, "0")}</span>
                <h3>{u.title}</h3>
                <p>{u.body}</p>
              </article>
            ))}
          </div>
          <p className="ai-learning">
            <span className="live" /> Learning now: Generative AI fundamentals · Python for AI · RAG · Agentic AI ·
            LangChain · practical LLM workflows
          </p>
        </section>

        <section id="roadmap" data-reveal>
          <div className="section-head">
            <div>
              <Kicker id="roadmap">Career roadmap</Kicker>
              <h2>
                Toward <em>Staff / Principal</em>-track DV.
              </h2>
            </div>
            <p>From strong hands-on IP and testchip verification to verification architecture, methodology ownership and cross-team technical leadership.</p>
          </div>
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
        </section>

        <section id="education" data-reveal>
          <div className="section-head">
            <div>
              <Kicker>Education &amp; development</Kicker>
              <h2>
                Learn → Apply → <em>Standardize</em>.
              </h2>
            </div>
            <p>Continuous improvement: deliberate learning, applied to real verification problems, with measurable feedback and reflection.</p>
          </div>
          <div className="edu stagger">
            <article className="edu-card spot">
              <time>2021 — 2023</time>
              <h3>M.Tech</h3>
              <p>Kalinga Institute of Industrial Technology (KIIT)</p>
            </article>
            <article className="edu-card spot">
              <time>2015 — 2019</time>
              <h3>Bachelor&apos;s degree</h3>
              <p>National Institute of Technology Rourkela</p>
            </article>
          </div>
          <ul className="certs stagger">
            {certifications.map((c) => (
              <li key={c.name} className="spot">
                <span className="cert-year">{c.year}</span>
                <span className="cert-name">{c.name}</span>
                <span className="cert-by">{c.by}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="contact" className="contact" data-reveal>
          <Kicker id="contact">Contact</Kicker>
          <h2 className="contact-title">
            Let&apos;s close <em>coverage</em> together.
          </h2>
          <p className="contact-lede">
            Open to conversations on IP, SoC and testchip verification, verification architecture and AI-assisted DV.
          </p>
          <div className="hero-actions center">
            <a className="btn primary magnetic" href={profile.linkedin} target="_blank" rel="noreferrer">
              Connect on LinkedIn <span aria-hidden="true">→</span>
            </a>
            <a className="btn ghost magnetic" href={profile.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <Hud />
      <ChatWidget />
    </>
  );
}
