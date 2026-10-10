import { NextResponse } from "next/server";
import { listPosts } from "@/lib/blog-store";
import type { SearchPost } from "@/lib/command-index";

export const dynamic = "force-dynamic";

/** Live blog posts for the command palette: titles and tags only, no content. */
export async function GET() {
  const posts: SearchPost[] = (await listPosts()).map((p) => ({ slug: p.slug, title: p.title, description: p.description, tags: p.tags }));
  return NextResponse.json({ posts }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
