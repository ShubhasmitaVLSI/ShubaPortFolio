import { CodeCopy } from "@/components/blog/PostTools";
import { DutBoundary } from "@/components/lexicon/DutBoundary";
import { Head } from "@/components/lexicon/Head";
import { Quiz } from "@/components/lexicon/Quiz";
import { SectionRail } from "@/components/lexicon/SectionRail";
import { highlight } from "@/lib/highlight";
import { SECTIONS, type LexiconEntry } from "@/lib/lexicon";
import { renderWave } from "@/lib/wave";

/** The eight-part structured template (lib/lexicon.ts), used by the DUT guide. */
export function StructuredEntry({ e, more }: { e: LexiconEntry; more: React.ReactNode }) {
  const wave = renderWave(e.scenario.wave);
  const [definition, architecture, comparison, scenario, code, interview, check, takeaways] = SECTIONS;

  return (
    <main className="lex" id="top">
      <header className="lex-hero">
        <nav className="lex-crumbs reveal" aria-label="Breadcrumb">
          <a href="/lexicon">DV Lexicon</a>
          <span aria-hidden="true">/</span>
          <span>{e.track}</span>
          <span aria-hidden="true">/</span>
          <span>{e.level}</span>
          <span aria-hidden="true">/</span>
          <span>{e.minutes} min read</span>
        </nav>
        <h1 className="lex-term reveal d1">
          <span className="lex-term-abbr">{e.term}</span>
          <span className="lex-term-full">{e.full}</span>
        </h1>
        <p className="lede reveal d2">{e.summary}</p>
        <div className="lex-hero-actions reveal d3">
          <a className="btn primary" href={`#${definition.id}`}>
            Start reading <span aria-hidden="true">↓</span>
          </a>
          <a className="btn ghost" href={`#${check.id}`}>
            Test yourself first
          </a>
        </div>
      </header>

      <div className="lex-layout">
        <SectionRail items={SECTIONS} />

        <div className="lex-body">
          <section id={definition.id} className="lex-sec" data-reveal>
            <Head n={1} title={definition.label} />
            <p className="lex-lead">{e.definition.text}</p>
            <div className="lex-versus stagger">
              <div className="lex-card dut">
                <span className="lex-card-tag">What you verify</span>
                <strong>The DUT</strong>
                <p>The implementation: RTL, a synthesized netlist, or another simulation model.</p>
              </div>
              <span className="lex-versus-sign" aria-hidden="true">
                ≠
              </span>
              <div className="lex-card tb">
                <span className="lex-card-tag">How you verify it</span>
                <strong>The testbench</strong>
                <p>Stimulus, monitors, reference model and checkers around the DUT&apos;s interfaces.</p>
              </div>
            </div>
            <aside className="lex-note key">
              <strong>Key distinction</strong> {e.definition.distinction}
            </aside>
          </section>

          <section id={architecture.id} className="lex-sec" data-reveal>
            <Head n={2} title={`${architecture.label}: FIFO example`} />
            <p>{e.architecture.intro}</p>
            <DutBoundary d={e.architecture.diagram} />
            <div className="lex-table split">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Inside DUT</th>
                    <th scope="col">Outside DUT (verification environment)</th>
                  </tr>
                </thead>
                <tbody className="stagger">
                  {e.architecture.rows.map(([inside, outside]) => (
                    <tr key={inside}>
                      <td data-label="Inside DUT">{inside}</td>
                      <td data-label="Outside DUT">{outside}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id={comparison.id} className="lex-sec" data-reveal>
            <Head n={3} title="RTL DUT vs GLS DUT" />
            <div className="lex-table compare">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Aspect</th>
                    <th scope="col">
                      <span className="lex-chip rtl">RTL</span> RTL simulation
                    </th>
                    <th scope="col">
                      <span className="lex-chip gls">GLS</span> Gate-level simulation
                    </th>
                  </tr>
                </thead>
                <tbody className="stagger">
                  {e.comparison.rows.map(([aspect, rtl, gls]) => (
                    <tr key={aspect}>
                      <th scope="row">{aspect}</th>
                      <td data-label="RTL">{rtl}</td>
                      <td data-label="GLS">{gls}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <aside className="lex-note important">
              <strong>Important</strong> {e.comparison.important}
            </aside>
          </section>

          <section id={scenario.id} className="lex-sec" data-reveal>
            <Head n={4} title="Real-world verification scenario" />
            <div className="lex-symptom stagger">
              <div className="lex-run pass">
                <span className="lex-run-tag">RTL · reset test</span>
                <strong>PASS</strong>
                <code>empty = 1 · full = 0</code>
              </div>
              <div className="lex-run fail">
                <span className="lex-run-tag">GLS · same test</span>
                <strong>X on empty</strong>
                <code>empty = X for several cycles</code>
              </div>
            </div>
            <p>
              <strong>Requirement:</strong> {e.scenario.requirement} {e.scenario.symptom}
            </p>
            {wave && <div className="prose lex-wave" dangerouslySetInnerHTML={{ __html: wave }} />}
            <p className="lex-sub">The engineer first checks:</p>
            <ul className="lex-checks stagger">
              {e.scenario.checks.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="lex-sub">Debug workflow</p>
            <ol className="lex-flow stagger">
              {e.scenario.workflow.map((s, i) => (
                <li key={s}>
                  <span className="lex-flow-n">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </section>

          <section id={code.id} className="lex-sec" data-reveal>
            <Head n={5} title={`${code.label}: DUT hookup and reset check`} />
            <div className="prose lex-code">
              <pre data-lang={e.code.lang}>
                <code className={`language-${e.code.lang}`} dangerouslySetInnerHTML={{ __html: highlight(e.code.source, e.code.lang) }} />
              </pre>
            </div>
            <aside className="lex-note">
              <strong>Assumptions</strong> {e.code.assumptions}
            </aside>
          </section>

          <section id={interview.id} className="lex-sec" data-reveal>
            <Head n={6} title={interview.label} />
            <div className="lex-qa stagger">
              {e.interview.map((q, i) => (
                <details key={q.q} open={i === 0}>
                  <summary>
                    <span className="lex-qa-n">Q{i + 1}</span>
                    {q.q}
                  </summary>
                  <p>{q.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section id={check.id} className="lex-sec" data-reveal>
            <Head n={7} title={`${check.label}: test your understanding`} />
            <Quiz questions={e.quiz} />
          </section>

          <section id={takeaways.id} className="lex-sec" data-reveal>
            <Head n={8} title={takeaways.label} />
            <ul className="lex-mistakes stagger">
              {e.mistakes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <aside className="lex-remember">
              <strong>Remember</strong>
              <p>{e.remember}</p>
            </aside>
            <p className="lex-sub">Related lexicon</p>
            <ul className="lex-related">
              {e.related.map((r) => (
                <li key={r.label}>{r.href ? <a href={r.href}>{r.label}</a> : <span>{r.label}</span>}</li>
              ))}
            </ul>
            <p className="lex-sub">Go deeper on the blog</p>
            <div className="lex-further">
              {e.further.map((f) => (
                <a className="path-card spot" href={f.href} key={f.href}>
                  <span className="path-card-kicker">Blog</span>
                  <strong>{f.label}</strong>
                  <p>{f.note}</p>
                  <span className="path-card-foot">
                    <span>Read the post</span>
                    <span className="path-arrow" aria-hidden="true">
                      →
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </div>
      {more}
      <CodeCopy />
    </main>
  );
}
