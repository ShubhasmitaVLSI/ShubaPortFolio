import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatWidget } from "@/components/ChatWidget";
import { CodeCopy, DeleteButton, ShareBar, Toc } from "@/components/blog/PostTools";
import { currentAdmin } from "@/lib/auth";
import { formatDate, isLive, isScheduled, postDate, readingMinutes, type Post } from "@/lib/blog";
import { getPost, listPosts } from "@/lib/blog-store";
import { profile } from "@/lib/data";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(iso)) + " IST";

async function visiblePost(slug: string) {
  const [post, admin] = await Promise.all([getPost(slug), currentAdmin()]);
  return post && (isLive(post) || admin) ? { post, admin } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const found = await visiblePost((await params).slug);
  if (!found) return { title: "Post not found" };
  const { post } = found;
  return {
    title: `${post.title} — ${profile.name}`,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}` },
    robots: isLive(post) ? undefined : { index: false, follow: false },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: postDate(post),
      modifiedTime: post.updatedAt,
      authors: [profile.name],
      tags: post.tags,
      ...(post.cover ? { images: [post.cover] } : {}),
    },
    twitter: { card: post.cover ? "summary_large_image" : "summary", title: post.title, description: post.description },
  };
}

// Posts sharing the most tags first, then the most recent.
function related(post: Post, all: Post[]) {
  return all
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, shared: p.tags.filter((t) => post.tags.includes(t)).length }))
    .sort((a, b) => b.shared - a.shared || postDate(b.p).localeCompare(postDate(a.p)))
    .slice(0, 3)
    .map(({ p }) => p);
}

export default async function PostPage({ params, searchParams }: { params: Params; searchParams: Promise<{ saved?: string }> }) {
  const found = await visiblePost((await params).slug);
  if (!found) notFound();
  const { post, admin } = found;
  const { saved } = await searchParams;
  const { html, headings } = renderMarkdown(post.content);
  const more = related(post, await listPosts());
  const published = postDate(post);
  const edited = new Date(post.updatedAt).getTime() - new Date(published).getTime() > 86_400_000;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: published,
    dateModified: post.updatedAt,
    keywords: post.tags.join(", "),
    author: { "@type": "Person", name: profile.name, url: profile.linkedin },
    ...(post.cover ? { image: post.cover } : {}),
  };

  return (
    <>
      <main className="post" id="top">
        {admin && (
          <div className="admin-bar" role="region" aria-label="Author tools">
            <span className={`badge ${isLive(post) ? "ok" : "draft"}`}>
              {post.status === "draft"
                ? "Draft · only you can see this"
                : isScheduled(post)
                  ? `Scheduled · goes live ${formatDateTime(post.publishedAt!)}`
                  : "Published"}
            </span>
            {saved && (
              <span className="admin-saved" role="status">
                ✓ {saved === "published" ? (isScheduled(post) ? "Scheduled" : "Published") : "Draft saved"}
              </span>
            )}
            <span className="admin-actions">
              <a className="btn ghost sm" href="/blog/manage">
                All posts
              </a>
              <a className="btn ghost sm" href={`/blog/${post.slug}/edit`}>
                Edit
              </a>
              <DeleteButton slug={post.slug} title={post.title} />
            </span>
          </div>
        )}

        <header className="post-head">
          <a className="back-link reveal" href="/blog">
            ← All posts
          </a>
          {post.tags.length > 0 && (
            <div className="tags reveal">
              {post.tags.map((t) => (
                <a className="tag" key={t} href={`/blog?tag=${t}`}>
                  #{t}
                </a>
              ))}
            </div>
          )}
          <h1 className="reveal d1">{post.title}</h1>
          <p className="lede reveal d2">{post.description}</p>
          <div className="byline reveal d3">
            <span className="mark" aria-hidden="true">
              SS
            </span>
            <span>
              <strong>{profile.name}</strong>
              <small>
                <time dateTime={published}>{formatDate(published)}</time> · {readingMinutes(post.content)} min read
                {edited && (
                  <>
                    {" "}
                    · Updated <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                  </>
                )}
              </small>
            </span>
          </div>
        </header>

        {post.cover && (
          <figure className="post-hero reveal d3">
            <img src={post.cover} alt="" />
          </figure>
        )}

        <div className={`post-layout ${headings.length > 1 ? "has-toc" : ""}`}>
          <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
          {headings.length > 1 && <Toc headings={headings} />}
        </div>
        <CodeCopy />

        <footer className="post-foot">
          <ShareBar title={post.title} />
          <div className="author-card spot">
            <span className="mark" aria-hidden="true">
              SS
            </span>
            <div>
              <strong>{profile.name}</strong>
              <p>
                {profile.role} at {profile.company}. Writes about IP and SoC verification, assertions, gate-level
                simulation and AI-assisted DV.
              </p>
              <a href={profile.linkedin} target="_blank" rel="noreferrer">
                Connect on LinkedIn →
              </a>
            </div>
          </div>
        </footer>

        {more.length > 0 && (
          <section className="more-posts">
            <h2>Keep reading</h2>
            <div className="post-grid">
              {more.map((p) => (
                <a className="post-card spot" href={`/blog/${p.slug}`} key={p.slug}>
                  <div className="post-card-body">
                    <p className="post-meta">
                      <span>{formatDate(postDate(p))}</span>
                      <span>{readingMinutes(p.content)} min read</span>
                    </p>
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
      {isLive(post) && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd).replace(/</g, "\\u003c") }} />
      )}
      <ChatWidget />
    </>
  );
}
