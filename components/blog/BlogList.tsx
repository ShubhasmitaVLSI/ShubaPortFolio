"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PostStatus } from "@/lib/blog";

export type ListItem = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  cover: string;
  status: PostStatus;
  featured: boolean;
  scheduled: boolean;
  date: string;
  minutes: number;
  search: string;
};

type Props = { posts: ListItem[]; admin: boolean; initialQuery: string; initialTag: string };

// A stable hue per post gives cover-less cards their own generated artwork.
const hue = (slug: string) => [...slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

function Cover({ post, large }: { post: ListItem; large?: boolean }) {
  if (post.cover)
    return (
      <div className="post-cover">
        <img src={post.cover} alt="" loading={large ? "eager" : "lazy"} />
      </div>
    );
  return (
    <div className="post-cover generated" style={{ "--h": hue(post.slug) } as React.CSSProperties} aria-hidden="true">
      <span>{post.tags[0] ?? "notes"}</span>
    </div>
  );
}

function Meta({ post }: { post: ListItem }) {
  return (
    <p className="post-meta">
      {post.status === "draft" && <span className="badge draft">Draft</span>}
      {post.scheduled && <span className="badge draft">Scheduled</span>}
      {post.featured && post.status === "published" && !post.scheduled && <span className="badge">Featured</span>}
      <span>{post.date}</span>
      <span>{post.minutes} min read</span>
    </p>
  );
}

export default function BlogList({ posts, admin, initialQuery, initialTag }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [tag, setTag] = useState(initialTag);
  const [status, setStatus] = useState<"all" | PostStatus>("all");
  const search = useRef<HTMLInputElement>(null);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [posts]);

  const filtered = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return posts.filter(
      (p) =>
        (status === "all" || p.status === status) &&
        (!tag || p.tags.includes(tag)) &&
        words.every((w) => p.search.includes(w))
    );
  }, [posts, query, tag, status]);

  // Keep the URL shareable: /blog?tag=uvm&q=coverage
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [query, tag]);

  // "/" jumps to search, like most docs sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !el.isContentEditable) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtering = Boolean(query.trim() || tag || status !== "all");
  const lead = filtering ? undefined : filtered.find((p) => p.featured && p.status === "published" && !p.scheduled) ?? filtered[0];
  const rest = filtered.filter((p) => p !== lead);
  const reset = () => {
    setQuery("");
    setTag("");
    setStatus("all");
  };

  if (!posts.length)
    return (
      <div className="blog-empty spot">
        <span className="blog-empty-icon" aria-hidden="true">
          ✎
        </span>
        <h2>The first post is on its way.</h2>
        <p>
          {admin
            ? "Nothing here yet. Write the first post; save it as a draft until it's ready."
            : "Notes on verification are being written. Check back soon, or connect on LinkedIn in the meantime."}
        </p>
        {admin && (
          <a className="btn primary" href="/blog/new">
            Write the first post <span aria-hidden="true">→</span>
          </a>
        )}
      </div>
    );

  return (
    <>
      <div className="blog-tools">
        <label className="blog-search">
          <span className="sr-only">Search posts</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={search}
            type="search"
            placeholder="Search posts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          />
          <kbd aria-hidden="true">/</kbd>
        </label>
        {admin && (
          <div className="segmented" role="group" aria-label="Filter by status">
            {(["all", "published", "draft"] as const).map((s) => (
              <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)}>
                {s === "all" ? "All" : s === "published" ? "Published" : "Drafts"}
              </button>
            ))}
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div className="tag-filter" role="group" aria-label="Filter by topic">
          <button type="button" className="chip" aria-pressed={!tag} onClick={() => setTag("")}>
            All topics
          </button>
          {tags.map(([t, n]) => (
            <button key={t} type="button" className="chip" aria-pressed={tag === t} onClick={() => setTag(tag === t ? "" : t)}>
              #{t} <small>{n}</small>
            </button>
          ))}
        </div>
      )}

      <p className="blog-count" aria-live="polite">
        {filtering
          ? `${filtered.length} ${filtered.length === 1 ? "post" : "posts"} found`
          : `${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
        {filtering && (
          <button type="button" className="link-btn" onClick={reset}>
            Clear filters
          </button>
        )}
      </p>

      {lead && (
        <a className="post-lead spot" href={`/blog/${lead.slug}`}>
          <Cover post={lead} large />
          <div className="post-lead-body">
            <Meta post={lead} />
            <h2>{lead.title}</h2>
            <p>{lead.description}</p>
            <span className="read-more">
              Read post <span aria-hidden="true">→</span>
            </span>
          </div>
        </a>
      )}

      {filtered.length === 0 ? (
        <div className="blog-empty spot">
          <h2>No posts match.</h2>
          <p>Try a different word or topic.</p>
          <button type="button" className="btn ghost" onClick={reset}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="post-grid">
          {rest.map((p) => (
            <a className="post-card spot" href={`/blog/${p.slug}`} key={p.slug}>
              <Cover post={p} />
              <div className="post-card-body">
                <Meta post={p} />
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                {p.tags.length > 0 && (
                  <div className="tags">
                    {p.tags.slice(0, 3).map((t) => (
                      <span className="tag" key={t}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
