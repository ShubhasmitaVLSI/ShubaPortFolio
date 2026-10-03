import type { Metadata } from "next";
import { ChatWidget } from "@/components/ChatWidget";
import BlogList, { type ListItem } from "@/components/blog/BlogList";
import { currentAdmin } from "@/lib/auth";
import { formatDate, isLive, isScheduled, plainText, postDate, readingMinutes } from "@/lib/blog";
import { listPosts } from "@/lib/blog-store";
import { profile } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Blog — ${profile.name}`,
  description: "Notes on design verification: UVM, SVA, gate-level simulation, coverage closure, debug and AI-assisted DV.",
  alternates: { types: { "application/rss+xml": "/blog/rss.xml" } },
};

type Search = Promise<{ q?: string; tag?: string; deleted?: string }>;

export default async function BlogIndex({ searchParams }: { searchParams: Search }) {
  const [admin, params] = await Promise.all([currentAdmin(), searchParams]);
  const posts = await listPosts({ drafts: Boolean(admin) });
  const items: ListItem[] = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    tags: p.tags,
    cover: p.cover,
    status: p.status,
    featured: p.featured,
    scheduled: isScheduled(p),
    date: formatDate(postDate(p)),
    minutes: readingMinutes(p.content),
    search: `${p.title} ${p.description} ${p.tags.join(" ")} ${plainText(p.content).slice(0, 4000)}`.toLowerCase(),
  }));
  const published = posts.filter((p) => isLive(p)).length;

  return (
    <>
      <main className="blog" id="top">
        <section className="blog-head">
          <p className="kicker reveal">Field notes</p>
          <h1 className="reveal d1">
            Writing on <em>verification</em>.
          </h1>
          <p className="lede reveal d2">
            Notes from IP and SoC verification: testbench architecture, assertions, gate-level debug, coverage
            closure and lessons worth standardizing.
          </p>
          <div className="blog-head-meta reveal d3">
            <span>
              {published} {published === 1 ? "post" : "posts"}
            </span>
            <a href="/blog/rss.xml">RSS feed</a>
            {admin && (
              <>
                <a className="btn primary" href="/blog/new">
                  Write a post <span aria-hidden="true">→</span>
                </a>
                <a className="btn ghost" href="/blog/manage">
                  Manage posts
                </a>
              </>
            )}
          </div>
        </section>
        {params.deleted && (
          <p className="blog-flash" role="status">
            Post deleted.
          </p>
        )}
        <BlogList posts={items} admin={Boolean(admin)} initialQuery={params.q ?? ""} initialTag={params.tag ?? ""} />
        {!admin && (
          <p className="blog-signin">
            <a href="/blog/login">Author sign in</a>
          </p>
        )}
      </main>
      <ChatWidget />
    </>
  );
}
