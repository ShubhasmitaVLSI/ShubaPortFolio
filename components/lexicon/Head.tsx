import type { LexiconSummary } from "@/lib/lexicon-store";

/** Numbered section heading shared by both entry layouts. */
export function Head({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="lex-h">
      <span className="lex-h-num">{String(n).padStart(2, "0")}</span>
      {title}
    </h2>
  );
}

/** Links to the other Lexicon entries, at the end of each entry. */
export function MoreTerms({ entries }: { entries: LexiconSummary[] }) {
  if (!entries.length) return null;
  return (
    <section className="lex-more" data-reveal aria-labelledby="lex-more-title">
      <h2 id="lex-more-title">More in the DV Lexicon</h2>
      <div className="lex-more-grid stagger">
        {entries.map((e) => (
          <a className="lex-more-card spot" href={`/lexicon/${e.slug}`} key={e.slug}>
            <span className="lex-more-abbr" aria-hidden="true">
              {e.abbr}
            </span>
            <span>
              <strong>{e.term}</strong>
              <small>
                {e.level} · {e.minutes} min
              </small>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
