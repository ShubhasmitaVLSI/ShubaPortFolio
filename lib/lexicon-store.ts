// Lexicon entries from both sources: the structured entries in lib/lexicon.ts and
// Markdown entries in content/lexicon/*.md. Markdown entries are split into their
// numbered sections; interview Q&A pairs and the knowledge check are lifted out
// so the page can render them as accordions and an interactive quiz.

import { promises as fs } from "node:fs";
import path from "node:path";
import { slugify } from "@/lib/blog";
import { LEXICON, type LexiconEntry, type QuizQuestion } from "@/lib/lexicon";
import { renderMarkdown } from "@/lib/markdown";

export type LexiconSummary = {
  slug: string;
  term: string;
  /** Short mark for cards: the term itself, or the title's initials. */
  abbr: string;
  full: string;
  track: string;
  level: string;
  minutes: string;
  summary: string;
};

export type QA = { level?: string; q: string; a: string };
export type Block = { kind: "html"; html: string } | { kind: "qa"; items: QA[] } | { kind: "quiz"; questions: QuizQuestion[] };
export type MdSection = { id: string; num: number; title: string; label: string; blocks: Block[] };

export type MdEntry = {
  slug: string;
  title: string;
  tagline: string;
  definition: string;
  category: string;
  subcategory: string;
  difficulty: string;
  minutes: string;
  tags: string[];
  related: string[];
  updated?: string;
  sections: MdSection[];
};

export type Entry = { kind: "structured"; entry: LexiconEntry } | { kind: "markdown"; entry: MdEntry };

const dir = () => path.join(process.cwd(), "content", "lexicon");

function frontmatter(src: string) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const data: Record<string, string | string[]> = {};
  if (!m) return { data, body: src };
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const v = kv[2].trim();
    data[kv[1]] = /^\[.*\]$/.test(v)
      ? v.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean)
      : v.replace(/^["']|["']$/g, "");
  }
  return { data, body: src.slice(m[0].length) };
}

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : v ?? "");
const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
const initials = (s: string) => s.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 4);

/** A single paragraph of inline Markdown, without the wrapping <p>. */
const inline = (md: string) => renderMarkdown(md.trim()).html.replace(/^<p>|<\/p>$/g, "");

const QA_RE = /\*\*Interview question(?:\s*\*\(([^)]*)\)\*)?:\*\*\s*([\s\S]*?)\n\s*\n\*\*Answer:\*\*\s*([\s\S]*?)(?=\n\s*\n|\s*$)/g;

/** Splits section Markdown into rendered prose and runs of Q&A pairs, in order. */
function blocksOf(md: string): Block[] {
  const blocks: Block[] = [];
  const prose = (text: string) => {
    if (text.trim()) blocks.push({ kind: "html", html: renderMarkdown(text).html });
  };
  let last = 0;
  for (const m of md.matchAll(QA_RE)) {
    prose(md.slice(last, m.index));
    const item: QA = { level: m[1]?.trim() || undefined, q: inline(m[2]), a: renderMarkdown(m[3].trim()).html };
    const prev = blocks[blocks.length - 1];
    // Consecutive pairs (only blank lines between them) share one accordion.
    if (prev?.kind === "qa" && !md.slice(last, m.index).trim()) prev.items.push(item);
    else blocks.push({ kind: "qa", items: [item] });
    last = m.index + m[0].length;
  }
  prose(md.slice(last));
  return blocks;
}

/** Knowledge check: **Qn.** *(Level)* question, "- **A.** option" lines, then an answer key. */
function quizOf(md: string): Block[] | null {
  const keyAt = md.search(/^#{2,4}\s*Answer key\s*$/m);
  if (keyAt < 0) return null;
  const key = new Map<number, { letter: string; why: string }>();
  for (const m of md.slice(keyAt).matchAll(/^\s*(\d+)\.\s+\*\*([A-D])\*\*\s*[—–-]\s*(.+)$/gm)) key.set(Number(m[1]), { letter: m[2], why: m[3].trim() });

  const body = md.slice(0, keyAt);
  const questions: QuizQuestion[] = [];
  const firstQ = body.search(/^\*\*Q\d+\.\*\*/m);
  for (const m of body.matchAll(/^\*\*Q(\d+)\.\*\*\s*(?:\*\(([^)]*)\)\*\s*)?(.+)\n\s*\n((?:[-*]\s+\*\*[A-D]\.\*\*.*\n?)+)/gm)) {
    const opts = [...m[4].matchAll(/^[-*]\s+\*\*([A-D])\.\*\*\s*(.+)$/gm)];
    const k = key.get(Number(m[1]));
    if (!k || opts.length < 2) return null;
    questions.push({
      q: m[3].trim(),
      level: m[2]?.trim(),
      options: opts.map((o) => o[2].trim()),
      answer: opts.findIndex((o) => o[1] === k.letter),
      why: k.why,
    });
  }
  if (!questions.length || questions.some((q) => q.answer < 0)) return null;
  const intro = firstQ > 0 ? body.slice(0, firstQ) : "";
  return [...(intro.trim() ? [{ kind: "html" as const, html: renderMarkdown(intro).html }] : []), { kind: "quiz", questions }];
}

async function readMarkdown(slug: string, known: Set<string>): Promise<MdEntry | null> {
  let src: string;
  try {
    src = await fs.readFile(path.join(dir(), `${slug}.md`), "utf8");
  } catch {
    return null;
  }
  src = src.replace(/\r\n?/g, "\n");
  const { data, body } = frontmatter(src);

  // Short rail labels from the document's own "On this page" list, when present.
  const toc = body.match(/^##\s+On this page\s*\n([\s\S]*?)(?=\n---|\n## )/m)?.[1] ?? "";
  const tocLabels = [...toc.matchAll(/^\s*\d+\.\s+(.+)$/gm)].map((m) => m[1].trim());

  // Links to Lexicon entries that don't exist yet become plain text, never 404s.
  const linked = body.replace(/\[([^\]]+)\]\(\/lexicon\/([a-z0-9-]+)\)/g, (m, text: string, s: string) => (known.has(s) ? m : text));

  const sections: MdSection[] = [];
  const parts = linked.split(/^##\s+(\d+)\s*[—–-]\s*(.+)$/m);
  for (let i = 1; i < parts.length; i += 3) {
    const num = Number(parts[i]);
    const title = parts[i + 1].trim();
    // Drop the horizontal rules that only separate sections in the source.
    const md = parts[i + 2].replace(/\n-{3,}\s*$/, "").trim();
    sections.push({
      id: slugify(title.replace(/[:"“”].*$/, "")) || `section-${num}`,
      num,
      title,
      label: tocLabels[num - 1] ?? title,
      blocks: /knowledge check/i.test(title) ? quizOf(md) ?? blocksOf(md) : blocksOf(md),
    });
  }

  const title = str(data.title) || slug;
  return {
    slug,
    title,
    tagline: str(data.tagline),
    definition: str(data.definition),
    category: str(data.category),
    subcategory: str(data.subcategory),
    difficulty: str(data.difficulty),
    minutes: str(data.readingTime).replace(/\s*min.*$/i, ""),
    tags: list(data.tags),
    related: list(data.related),
    updated: str(data.updated) || undefined,
    sections,
  };
}

async function markdownSlugs() {
  try {
    return (await fs.readdir(dir())).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)).sort();
  } catch {
    return [];
  }
}

export async function allSlugs() {
  return [...new Set([...LEXICON.map((e) => e.slug), ...(await markdownSlugs())])];
}

export async function getEntry(slug: string): Promise<Entry | null> {
  const structured = LEXICON.find((e) => e.slug === slug);
  if (structured) return { kind: "structured", entry: structured };
  const known = new Set(await allSlugs());
  if (!known.has(slug)) return null;
  const md = await readMarkdown(slug, known);
  return md && { kind: "markdown", entry: md };
}

export async function listLexicon(): Promise<LexiconSummary[]> {
  const known = new Set(await allSlugs());
  const md = (await Promise.all((await markdownSlugs()).map((s) => readMarkdown(s, known)))).filter((e): e is MdEntry => e !== null);
  return [
    ...LEXICON.map((e) => ({ slug: e.slug, term: e.term, abbr: e.term, full: e.full, track: e.track, level: e.level, minutes: e.minutes, summary: e.summary })),
    ...md.map((e) => ({
      slug: e.slug,
      term: e.title,
      abbr: initials(e.title),
      full: e.tagline,
      track: e.category,
      level: e.difficulty,
      minutes: e.minutes,
      summary: e.definition,
    })),
  ];
}
