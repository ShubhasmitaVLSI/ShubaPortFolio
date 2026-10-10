// Everything the command palette can jump to. Home sections, Lexicon entries and
// glossary terms are static; blog posts come from /api/search at open time.

import { profile } from "@/lib/data";
import { glossary, phases } from "@/lib/dv";
import { LEXICON } from "@/lib/lexicon";

export type CommandGroup = "Sections" | "Pages" | "Lexicon" | "Blog" | "Glossary" | "Actions";

export type Command = {
  id: string;
  group: CommandGroup;
  title: string;
  hint?: string;
  href: string;
  external?: boolean;
  /** Extra words that should match, lower-case. */
  keywords?: string;
};

/** Home-page anchors work from any page: "/#work" elsewhere, "#work" on the home page. */
const sections: Command[] = phases
  .filter((p) => p.id !== "top")
  .map((p) => ({ id: `s-${p.id}`, group: "Sections", title: p.label, hint: `${p.phase}()`, href: `/#${p.id}`, keywords: p.id }));

const pages: Command[] = [
  { id: "p-home", group: "Pages", title: "Home", href: "/" },
  { id: "p-projects", group: "Pages", title: "Project archive", hint: "every case file", href: "/projects", keywords: "work case files" },
  { id: "p-blog", group: "Pages", title: "Blog", hint: "field notes", href: "/blog", keywords: "posts articles writing" },
  { id: "p-lexicon", group: "Pages", title: "DV Lexicon", hint: "in-depth term guides", href: "/lexicon", keywords: "dictionary terms" },
  { id: "p-book", group: "Pages", title: "Book a call", hint: "30-minute slots", href: profile.booking, keywords: "meeting schedule talk contact" },
];

const lexicon: Command[] = LEXICON.map((e) => ({
  id: `l-${e.slug}`,
  group: "Lexicon",
  title: `${e.term} — ${e.full}`,
  hint: `${e.level} · ${e.minutes} min`,
  href: `/lexicon/${e.slug}`,
  keywords: `${e.summary} ${e.related.map((r) => r.label).join(" ")}`.toLowerCase(),
}));

const terms: Command[] = glossary.map((g) => ({
  id: `g-${g.term}`,
  group: "Glossary",
  title: g.term,
  hint: g.full,
  href: "/#glossary",
  keywords: `${g.full} ${g.kind}`.toLowerCase(),
}));

const actions: Command[] = [
  { id: "a-linkedin", group: "Actions", title: "Connect on LinkedIn", href: profile.linkedin, external: true, keywords: "profile social" },
  { id: "a-rss", group: "Actions", title: "Subscribe via RSS", href: "/blog/rss.xml", keywords: "feed" },
];

export const STATIC_COMMANDS: Command[] = [...pages, ...sections, ...lexicon, ...terms, ...actions];

export type SearchPost = { slug: string; title: string; description: string; tags: string[] };

export const postCommands = (posts: SearchPost[]): Command[] =>
  posts.map((p) => ({
    id: `b-${p.slug}`,
    group: "Blog",
    title: p.title,
    hint: p.tags.slice(0, 3).map((t) => `#${t}`).join(" "),
    href: `/blog/${p.slug}`,
    keywords: `${p.description} ${p.tags.join(" ")}`.toLowerCase(),
  }));

/**
 * Score a command against a query: title prefix beats word prefix beats substring,
 * and every query word must match somewhere. Returns 0 for no match.
 */
export function score(c: Command, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  const title = c.title.toLowerCase();
  const hay = `${title} ${(c.hint ?? "").toLowerCase()} ${c.keywords ?? ""} ${c.group.toLowerCase()}`;
  let total = 0;
  for (const w of words) {
    if (title.startsWith(w)) total += 8;
    else if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(title)) total += 5;
    else if (title.includes(w)) total += 3;
    else if (hay.includes(w)) total += 1;
    else return 0;
  }
  return total;
}
