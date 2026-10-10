import { CodeCopy } from "@/components/blog/PostTools";
import { Head } from "@/components/lexicon/Head";
import { Quiz } from "@/components/lexicon/Quiz";
import { SectionRail } from "@/components/lexicon/SectionRail";
import type { Block, MdEntry } from "@/lib/lexicon-store";

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === "html") return <div className="prose lex-prose" key={i} dangerouslySetInnerHTML={{ __html: b.html }} />;
        if (b.kind === "quiz") return <Quiz key={i} questions={b.questions} />;
        return (
          <div className="lex-qa stagger" key={i}>
            {b.items.map((qa) => (
              <details key={qa.q}>
                <summary>
                  <span className="lex-qa-n">{qa.level ?? "Q"}</span>
                  <span dangerouslySetInnerHTML={{ __html: qa.q }} />
                </summary>
                <div className="lex-qa-a" dangerouslySetInnerHTML={{ __html: qa.a }} />
              </details>
            ))}
          </div>
        );
      })}
    </>
  );
}

/** A Markdown entry from content/lexicon, split into its numbered sections. */
export function MarkdownEntry({ e, more }: { e: MdEntry; more: React.ReactNode }) {
  const check = e.sections.find((s) => s.blocks.some((b) => b.kind === "quiz"));
  const first = e.sections[0];

  return (
    <main className="lex" id="top">
      <header className="lex-hero">
        <nav className="lex-crumbs reveal" aria-label="Breadcrumb">
          <a href="/lexicon">DV Lexicon</a>
          <span aria-hidden="true">/</span>
          <span>{e.category}</span>
          <span aria-hidden="true">/</span>
          <span>{e.difficulty}</span>
          <span aria-hidden="true">/</span>
          <span>{e.minutes} min read</span>
        </nav>
        <h1 className="lex-title reveal d1">{e.title}</h1>
        <p className="lede reveal d2">{e.tagline}</p>
        <aside className="lex-definition reveal d2">
          <span>Definition</span>
          <p>{e.definition}</p>
        </aside>
        <div className="lex-hero-actions reveal d3">
          {first && (
            <a className="btn primary" href={`#${first.id}`}>
              Start reading <span aria-hidden="true">↓</span>
            </a>
          )}
          {check && (
            <a className="btn ghost" href={`#${check.id}`}>
              Test yourself first
            </a>
          )}
        </div>
        {e.tags.length > 0 && (
          <ul className="lex-tags reveal d3" aria-label="Tags">
            {e.tags.map((t) => (
              <li key={t}>#{t}</li>
            ))}
          </ul>
        )}
      </header>

      <div className="lex-layout">
        <SectionRail items={e.sections.map((s) => ({ id: s.id, label: s.label }))} />
        <div className="lex-body">
          {e.sections.map((s) => (
            <section id={s.id} className="lex-sec" data-reveal key={s.id}>
              <Head n={s.num} title={s.title} />
              <Blocks blocks={s.blocks} />
            </section>
          ))}
        </div>
      </div>
      {more}
      <CodeCopy />
    </main>
  );
}
