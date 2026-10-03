// Blog persistence. Posts are JSON files in content/blog (or BLOG_DIR) by default,
// which suits local writing and any Node host with a writable disk. When Upstash
// Redis / Vercel KV REST credentials are set, posts live in one Redis hash instead,
// so the author can publish from a serverless deployment.

import { promises as fs } from "node:fs";
import path from "node:path";
import { RESERVED_SLUGS, isLive, isSlug, normalizeTags, postDate, slugify, type Post, type PostInput } from "@/lib/blog";

/** An error whose message is safe to show the author. */
export class BlogError extends Error {}

type Store = {
  all(): Promise<Post[]>;
  get(slug: string): Promise<Post | null>;
  put(post: Post): Promise<void>;
  remove(slug: string): Promise<void>;
};

function toPost(raw: unknown): Post | null {
  const p = raw as Partial<Post> | null;
  if (!p || typeof p.slug !== "string" || !isSlug(p.slug) || typeof p.title !== "string") return null;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    slug: p.slug,
    title: p.title,
    description: str(p.description),
    content: str(p.content),
    tags: Array.isArray(p.tags) ? normalizeTags(p.tags.map(String)) : [],
    cover: str(p.cover),
    status: p.status === "published" ? "published" : "draft",
    featured: p.featured === true,
    createdAt: str(p.createdAt) || new Date(0).toISOString(),
    updatedAt: str(p.updatedAt) || str(p.createdAt) || new Date(0).toISOString(),
    ...(typeof p.publishedAt === "string" ? { publishedAt: p.publishedAt } : {}),
  };
}

const parse = (json: string | null) => {
  if (!json) return null;
  try {
    return toPost(JSON.parse(json));
  } catch {
    return null;
  }
};

const errCode = (e: unknown) => (e as NodeJS.ErrnoException)?.code;

const blogDir = () => (process.env.BLOG_DIR ? path.resolve(process.env.BLOG_DIR) : path.join(process.cwd(), "content", "blog"));

const fileStore: Store = {
  async all() {
    let names: string[];
    try {
      names = await fs.readdir(blogDir());
    } catch (e) {
      if (errCode(e) === "ENOENT") return [];
      throw e;
    }
    const posts = await Promise.all(names.filter((n) => n.endsWith(".json")).map((n) => fileStore.get(n.slice(0, -5))));
    return posts.filter((p): p is Post => p !== null);
  },
  async get(slug) {
    if (!isSlug(slug)) return null;
    try {
      return parse(await fs.readFile(path.join(blogDir(), `${slug}.json`), "utf8"));
    } catch (e) {
      if (errCode(e) === "ENOENT") return null;
      throw e;
    }
  },
  async put(post) {
    const dir = blogDir();
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${post.slug}.json`);
    // Write then rename so a crash never leaves a half-written post.
    await fs.writeFile(`${file}.tmp`, `${JSON.stringify(post, null, 2)}\n`, "utf8");
    await fs.rename(`${file}.tmp`, file);
  },
  async remove(slug) {
    if (isSlug(slug)) await fs.rm(path.join(blogDir(), `${slug}.json`), { force: true });
  },
};

const REDIS_KEY = "blog:posts";
// Slugs of committed (file) posts deleted from a serverless site, where the file itself can't be removed.
const DELETED_KEY = "blog:deleted";
const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis<T>(command: string[]): Promise<T> {
  const res = await fetch(redisUrl()!, {
    method: "POST",
    headers: { Authorization: `Bearer ${redisToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { result?: T; error?: string };
  if (!res.ok || data.error) throw new Error(`Blog storage request failed (${res.status})`);
  return data.result as T;
}

// Redis holds posts written on the live site; posts committed to content/blog still
// show through (read-only) unless Redis has a newer copy or marks them deleted.
const redisStore: Store = {
  async all() {
    const [flat, deleted, files] = await Promise.all([
      redis<string[] | null>(["HGETALL", REDIS_KEY]),
      redis<string[] | null>(["SMEMBERS", DELETED_KEY]),
      fileStore.all(),
    ]);
    const posts = new Map<string, Post>();
    for (const p of files) if (!deleted?.includes(p.slug)) posts.set(p.slug, p);
    for (let i = 1; i < (flat?.length ?? 0); i += 2) {
      const p = parse(flat![i]);
      if (p) posts.set(p.slug, p);
    }
    return [...posts.values()];
  },
  async get(slug) {
    if (!isSlug(slug)) return null;
    const [stored, deleted] = await Promise.all([
      redis<string | null>(["HGET", REDIS_KEY, slug]),
      redis<number>(["SISMEMBER", DELETED_KEY, slug]),
    ]);
    return parse(stored) ?? (deleted ? null : await fileStore.get(slug));
  },
  async put(post) {
    await redis(["HSET", REDIS_KEY, post.slug, JSON.stringify(post)]);
    await redis(["SREM", DELETED_KEY, post.slug]);
  },
  async remove(slug) {
    await redis(["HDEL", REDIS_KEY, slug]);
    if (await fileStore.get(slug)) await redis(["SADD", DELETED_KEY, slug]);
  },
};

const store = () => (redisUrl() && redisToken() ? redisStore : fileStore);

const byDate = (a: Post, b: Post) => postDate(b).localeCompare(postDate(a));

export async function listPosts({ drafts = false } = {}) {
  const posts = await store().all();
  const now = Date.now();
  return posts.filter((p) => drafts || isLive(p, now)).sort(byDate);
}

export async function getPost(slug: string) {
  return store().get(slug);
}

async function write(op: () => Promise<void>) {
  try {
    await op();
  } catch (e) {
    if (["EROFS", "EACCES", "EPERM"].includes(errCode(e) ?? ""))
      throw new BlogError(
        "This server's disk is read-only. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to publish from the live site."
      );
    throw e;
  }
}

/** Creates a post, or updates the one at `original`. Returns the stored post. */
export async function savePost(input: PostInput, original?: string): Promise<Post> {
  const s = store();
  const existing = original ? await s.get(original) : null;
  if (original && !existing) throw new BlogError("This post no longer exists. It may have been deleted in another tab.");

  const taken = async (slug: string) => RESERVED_SLUGS.has(slug) || (slug !== original && (await s.get(slug)) !== null);
  let slug = input.slug || slugify(input.title) || "post";
  if (input.slug && slug !== original && (await taken(slug))) throw new BlogError(`Another post already uses /blog/${slug}.`);
  if (!input.slug) {
    const base = slug;
    for (let n = 2; await taken(slug); n++) slug = `${base}-${n}`;
  }

  const now = new Date().toISOString();
  // An explicit date wins (future = scheduled). Otherwise keep a past publish date, or stamp "now" on publish.
  const kept = existing?.publishedAt && existing.publishedAt <= now ? existing.publishedAt : undefined;
  const publishedAt = input.publishAt
    ? new Date(input.publishAt).toISOString()
    : kept ?? (input.status === "published" ? now : undefined);
  const { publishAt: _, ...fields } = input;
  const post: Post = {
    ...fields,
    slug,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...(publishedAt ? { publishedAt } : {}),
  };
  await write(() => s.put(post));
  if (existing && original !== slug) await write(() => s.remove(original!));
  return post;
}

export async function deletePost(slug: string) {
  await write(() => store().remove(slug));
}

// ---- Images uploaded from the editor ----

export const MEDIA_TYPES = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", gif: "image/gif" } as const;
export type MediaExt = keyof typeof MEDIA_TYPES;
export const isMediaName = (name: string) => /^[a-f0-9]{20}\.(webp|png|jpg|gif)$/.test(name);

const mediaFile = (name: string) => path.join(blogDir(), "media", name);

export async function saveMedia(name: string, data: Buffer) {
  if (!isMediaName(name)) throw new BlogError("Invalid image name.");
  if (store() === redisStore) return void (await redis(["SET", `blog:media:${name}`, data.toString("base64")]));
  await write(async () => {
    await fs.mkdir(path.dirname(mediaFile(name)), { recursive: true });
    await fs.writeFile(mediaFile(name), data);
  });
}

export async function getMedia(name: string): Promise<Buffer | null> {
  if (!isMediaName(name)) return null;
  if (store() === redisStore) {
    const b64 = await redis<string | null>(["GET", `blog:media:${name}`]);
    if (b64) return Buffer.from(b64, "base64");
  }
  try {
    return await fs.readFile(mediaFile(name));
  } catch (e) {
    if (errCode(e) === "ENOENT") return null;
    throw e;
  }
}
