import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ManageList, { type ManageItem } from "@/components/blog/ManageList";
import { currentAdmin } from "@/lib/auth";
import { formatDate, isScheduled, postDate, readingMinutes } from "@/lib/blog";
import { listPosts } from "@/lib/blog-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Manage posts", robots: { index: false } };

const ERRORS: Record<string, string> = {
  readonly: "This site can't save changes yet: connect Upstash Redis in Vercel → Storage, then redeploy.",
  missing: "That post no longer exists. It may have been deleted in another tab.",
  failed: "That change couldn't be saved. Please try again.",
};

type Search = Promise<{ deleted?: string; done?: string; post?: string; error?: string }>;

export default async function Manage({ searchParams }: { searchParams: Search }) {
  if (!(await currentAdmin())) redirect("/blog/login?next=/blog/manage");
  const [posts, params] = await Promise.all([listPosts({ drafts: true }), searchParams]);
  const items: ManageItem[] = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    tags: p.tags,
    status: isScheduled(p) ? "scheduled" : p.status,
    featured: p.featured,
    date: formatDate(postDate(p)),
    updated: formatDate(p.updatedAt),
    updatedAt: p.updatedAt,
    minutes: readingMinutes(p.content),
  }));
  const flash = params.error
    ? { kind: "error", text: ERRORS[params.error] ?? ERRORS.failed }
    : params.deleted
      ? { kind: "ok", text: "Post deleted." }
      : params.done === "published"
        ? { kind: "ok", text: "Post published." }
        : params.done === "draft"
          ? { kind: "ok", text: "Post moved to drafts." }
          : null;

  return (
    <main className="blog manage">
      <section className="manage-head">
        <div>
          <p className="kicker">Author dashboard</p>
          <h1>Manage posts</h1>
        </div>
        <a className="btn primary" href="/blog/new">
          + New post
        </a>
      </section>
      {flash && (
        <p className={`blog-flash ${flash.kind === "error" ? "error" : ""}`} role={flash.kind === "error" ? "alert" : "status"}>
          {flash.text}
        </p>
      )}
      <ManageList posts={items} highlight={params.post ?? ""} />
    </main>
  );
}
