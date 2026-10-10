import { NextResponse } from "next/server";
import { listPosts } from "@/lib/blog-store";
import type { SearchPost, SearchTerm } from "@/lib/command-index";
import { listLexicon } from "@/lib/lexicon-store";

export const dynamic = "force-dynamic";

/** Live blog posts and Lexicon entries for the command palette: titles and summaries only. */
export async function GET() {
  const [all, lexicon] = await Promise.all([listPosts(), listLexicon()]);
  const posts: SearchPost[] = all.map((p) => ({ slug: p.slug, title: p.title, description: p.description, tags: p.tags }));
  const terms: SearchTerm[] = lexicon.map(({ slug, term, full, level, minutes, summary }) => ({ slug, term, full, level, minutes, summary }));
  return NextResponse.json({ posts, terms }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
