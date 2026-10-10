import type { Metadata } from "next";
import { ChatWidget } from "@/components/ChatWidget";
import { profile } from "@/lib/data";
import { SECTIONS } from "@/lib/lexicon";
import { listLexicon } from "@/lib/lexicon-store";

export const metadata: Metadata = {
  title: `DV Lexicon — ${profile.name}`,
  description:
    "In-depth guides to design verification terms: definition, architecture, RTL vs gate-level behavior, a real debug scenario, code, interview questions and a knowledge check.",
  alternates: { canonical: "/lexicon" },
};

export default async function LexiconIndex() {
  const entries = await listLexicon();
  return (
    <>
      <main className="lex lex-index" id="top">
        <header className="lex-hero">
          <p className="kicker reveal">DV Lexicon</p>
          <h1 className="reveal d1">
            Terms, <em>verified</em>.
          </h1>
          <p className="lede reveal d2">
            In-depth guides to the vocabulary of design verification. Each one goes past the definition: where the
            term sits in a testbench, how it changes from RTL to gate level, how it shows up in a real debug, and
            a knowledge check to test yourself.
          </p>
        </header>

        <section className="lex-entries" aria-label="Entries">
          {entries.map((e) => (
            <a className="lex-entry spot reveal d3" href={`/lexicon/${e.slug}`} key={e.slug}>
              <span className="lex-entry-term" aria-hidden="true">
                {e.abbr}
              </span>
              <span className="lex-entry-body">
                <span className="lex-entry-meta">
                  {e.track} · {e.level} · {e.minutes} min read
                </span>
                <strong>{e.term === e.abbr ? `${e.term} — ${e.full}` : e.term}</strong>
                <span className="lex-entry-summary">{e.summary}</span>
                <span className="read-more">
                  Read the guide <span aria-hidden="true">→</span>
                </span>
              </span>
            </a>
          ))}
        </section>

        <section className="lex-template" data-reveal aria-labelledby="lex-template-title">
          <h2 id="lex-template-title">Every guide, the same eight checks</h2>
          <p>The format follows a verification flow: define the boundary, place it in an architecture, then stress it.</p>
          <ol className="stagger">
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {s.label}
              </li>
            ))}
          </ol>
          <p className="lex-template-foot">
            Want the short version? Flip through the <a href="/#glossary">DV glossary</a> on the home page, or follow
            the <a href="/blog">blog&apos;s reading path</a> from RTL to silicon.
          </p>
        </section>
      </main>
      <ChatWidget />
    </>
  );
}
