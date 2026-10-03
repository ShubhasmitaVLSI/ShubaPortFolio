// Blog types and helpers shared by the server and the editor (no Node APIs here).

export type PostStatus = "draft" | "published";

export type Post = {
  slug: string;
  title: string;
  description: string;
  content: string; // Markdown
  tags: string[];
  cover: string; // optional image URL, "" when unset
  status: PostStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

export type PostInput = Pick<Post, "slug" | "title" | "description" | "content" | "tags" | "cover" | "status" | "featured"> & {
  /** Explicit publish date (ISO); a future date schedules the post. Empty means "now". */
  publishAt?: string;
};
export type PostField = keyof PostInput;

export const LIMITS = { title: 140, description: 300, content: 100_000, tags: 8, tag: 32, slug: 80 };

// Static routes under /blog that a post slug must not shadow.
export const RESERVED_SLUGS = new Set(["new", "login", "rss", "edit", "media"]);

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, LIMITS.slug)
    .replace(/-+$/, "");
}

export const isSlug = (s: string) => s.length <= LIMITS.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);

export function normalizeTags(raw: string | string[]) {
  const list = Array.isArray(raw) ? raw : raw.split(",");
  const tags = list.map((t) => slugify(t).slice(0, LIMITS.tag)).filter(Boolean);
  return [...new Set(tags)].slice(0, LIMITS.tags);
}

/** Cover images may be absolute https URLs or site-relative paths. */
export const isSafeImage = (url: string) => /^https:\/\/[^\s"'<>]+$/i.test(url) || /^\/(?!\/)[^\s"'<>]*$/.test(url);

const plain = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ");

export const plainText = (md: string) => plain(md).replace(/\s+/g, " ").trim();
export const wordCount = (md: string) => (plainText(md).match(/\S+/g) ?? []).length;
export const readingMinutes = (md: string) => Math.max(1, Math.round(wordCount(md) / 220));

export const postDate = (p: Pick<Post, "publishedAt" | "createdAt">) => p.publishedAt ?? p.createdAt;

/** Published and not scheduled for later: what visitors may see. */
export const isLive = (p: Pick<Post, "status" | "publishedAt" | "createdAt">, now = Date.now()) =>
  p.status === "published" && Date.parse(postDate(p)) <= now;

export const isScheduled = (p: Pick<Post, "status" | "publishedAt">, now = Date.now()) =>
  p.status === "published" && Boolean(p.publishedAt) && Date.parse(p.publishedAt!) > now;

// A fixed time zone keeps server and browser renders identical.
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));

export function validatePost(input: PostInput) {
  const errors: Partial<Record<PostField, string>> = {};
  if (!input.title.trim()) errors.title = "Give the post a title.";
  else if (input.title.length > LIMITS.title) errors.title = `Keep the title under ${LIMITS.title} characters.`;
  if (!input.description.trim()) errors.description = "Add a short description; it shows on cards and in search results.";
  else if (input.description.length > LIMITS.description)
    errors.description = `Keep the description under ${LIMITS.description} characters.`;
  if (!input.content.trim()) errors.content = "The post is empty.";
  else if (input.content.length > LIMITS.content) errors.content = "The post is too long.";
  if (input.slug && (!isSlug(input.slug) || RESERVED_SLUGS.has(input.slug)))
    errors.slug = "Use lowercase letters, numbers and single hyphens.";
  if (input.cover && !isSafeImage(input.cover)) errors.cover = "Use an https:// image URL or a /path on this site.";
  if (input.publishAt && Number.isNaN(Date.parse(input.publishAt))) errors.publishAt = "Pick a valid date and time.";
  return errors;
}
