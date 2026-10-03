"use client";

import { useMemo, useState } from "react";
import { deletePostAction, setStatusAction } from "@/app/blog/actions";

export type ManageItem = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  status: "published" | "draft" | "scheduled";
  featured: boolean;
  date: string;
  updated: string;
  updatedAt: string;
  minutes: number;
};

type Tab = "all" | "published" | "draft" | "scheduled";
type Sort = "updated" | "date" | "title";

const LABEL: Record<ManageItem["status"], string> = { published: "Published", draft: "Draft", scheduled: "Scheduled" };

export default function ManageList({ posts, highlight }: { posts: ManageItem[]; highlight: string }) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("updated");

  const counts = useMemo(
    () => ({
      all: posts.length,
      published: posts.filter((p) => p.status === "published").length,
      draft: posts.filter((p) => p.status === "draft").length,
      scheduled: posts.filter((p) => p.status === "scheduled").length,
    }),
    [posts]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = posts.filter(
      (p) =>
        (tab === "all" || p.status === tab) &&
        (!q || `${p.title} ${p.description} ${p.tags.join(" ")}`.toLowerCase().includes(q))
    );
    // Listing order arrives newest-published first; other sorts are applied here.
    if (sort === "updated") return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (sort === "title") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [posts, tab, query, sort]);

  const tabs: [Tab, string][] = [
    ["all", "All"],
    ["published", "Published"],
    ["draft", "Drafts"],
    ...(counts.scheduled ? ([["scheduled", "Scheduled"]] as [Tab, string][]) : []),
  ];

  return (
    <>
      <div className="manage-tools">
        <div className="manage-tabs" role="tablist" aria-label="Filter posts by status">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
              {label} <span>{counts[id]}</span>
            </button>
          ))}
        </div>
        <div className="manage-filters">
          <input
            type="search"
            placeholder="Search title or topic"
            aria-label="Search posts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select aria-label="Sort posts" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="updated">Recently edited</option>
            <option value="date">Publish date</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="blog-empty spot">
          <h2>{posts.length ? "No posts here." : "No posts yet."}</h2>
          <p>
            {posts.length
              ? tab === "draft"
                ? "You have no drafts. Everything is published."
                : "Try another tab or search."
              : "Write your first post; save it as a draft until it's ready."}
          </p>
          <a className="btn primary" href="/blog/new">
            + New post
          </a>
        </div>
      ) : (
        <ul className="manage-list" role="list">
          {shown.map((p) => (
            <li key={p.slug} className={`manage-row spot ${p.slug === highlight ? "flash" : ""}`}>
              <div className="manage-main">
                <p className="manage-meta">
                  <span className={`badge ${p.status === "published" ? "ok" : "draft"}`}>{LABEL[p.status]}</span>
                  {p.featured && <span className="badge">Featured</span>}
                  <span>{p.status === "scheduled" ? `Goes live ${p.date}` : p.status === "draft" ? `Created ${p.date}` : p.date}</span>
                  <span>Edited {p.updated}</span>
                  <span>{p.minutes} min read</span>
                </p>
                <a className="manage-title" href={`/blog/${p.slug}/edit`}>
                  {p.title}
                </a>
                <p className="manage-desc">{p.description}</p>
                {p.tags.length > 0 && (
                  <p className="manage-tags">
                    {p.tags.map((t) => (
                      <span className="tag" key={t}>
                        #{t}
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <div className="manage-actions">
                <a className="btn ghost sm" href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" aria-label={`View ${p.title}`}>
                  View
                </a>
                <a className="btn primary sm" href={`/blog/${p.slug}/edit`} aria-label={`Edit ${p.title}`}>
                  Edit
                </a>
                <form action={setStatusAction}>
                  <input type="hidden" name="slug" value={p.slug} />
                  <input type="hidden" name="status" value={p.status === "draft" ? "published" : "draft"} />
                  <button type="submit" className="btn ghost sm" aria-label={`${p.status === "draft" ? "Publish" : "Unpublish"} ${p.title}`}>
                    {p.status === "draft" ? "Publish" : "Unpublish"}
                  </button>
                </form>
                <form
                  action={deletePostAction}
                  onSubmit={(e) => {
                    if (!window.confirm(`Delete “${p.title}”? This can't be undone.`)) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="slug" value={p.slug} />
                  <input type="hidden" name="next" value="/blog/manage" />
                  <button type="submit" className="btn ghost sm danger" aria-label={`Delete ${p.title}`}>
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
