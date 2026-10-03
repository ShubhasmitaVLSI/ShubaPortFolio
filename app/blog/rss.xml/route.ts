import { postDate } from "@/lib/blog";
import { listPosts } from "@/lib/blog-store";
import { profile } from "@/lib/data";

export const dynamic = "force-dynamic";

const xml = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const posts = (await listPosts()).slice(0, 50);
  const items = posts
    .map((p) => {
      const url = `${origin}/blog/${p.slug}`;
      return `<item><title>${xml(p.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${new Date(postDate(p)).toUTCString()}</pubDate><description>${xml(p.description)}</description>${p.tags.map((t) => `<category>${xml(t)}</category>`).join("")}</item>`;
    })
    .join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(`${profile.name} — Blog`)}</title><link>${origin}/blog</link><description>Notes on design verification.</description>${items}</channel></rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" } });
}
