"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  authConfigured,
  checkCredentials,
  clearFailures,
  currentAdmin,
  endSession,
  loginBlocked,
  recordFailure,
  startSession,
} from "@/lib/auth";
import { normalizeTags, validatePost, type PostField, type PostInput } from "@/lib/blog";
import { BlogError, deletePost, getPost, savePost } from "@/lib/blog-store";

export type LoginState = { error?: string };
export type SaveState = { error?: string; fields?: Partial<Record<PostField, string>> };

// Only same-site blog paths are allowed as post-login destinations.
const safeNext = (v: FormDataEntryValue | null) =>
  typeof v === "string" && /^\/blog(\/[\w-]*)*\/?$/.test(v) ? v : "/blog";

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  if (!authConfigured()) return { error: "Author sign-in is unavailable right now." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (loginBlocked(ip)) return { error: "Too many attempts. Wait 15 minutes and try again." };
  if (!checkCredentials(String(form.get("email") ?? ""), String(form.get("password") ?? ""))) {
    recordFailure(ip);
    return { error: "That email and password don't match." };
  }
  clearFailures(ip);
  await startSession();
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await endSession();
  redirect("/blog");
}

export async function savePostAction(_: SaveState, form: FormData): Promise<SaveState> {
  if (!(await currentAdmin()))
    return { error: "Your session expired. Your draft is kept in this browser. Sign in again in another tab, then save." };

  const text = (key: string) => String(form.get(key) ?? "").trim();
  const input: PostInput = {
    title: text("title"),
    description: text("description"),
    slug: text("slug").toLowerCase(),
    content: String(form.get("content") ?? "").replace(/\r\n?/g, "\n"),
    tags: normalizeTags(text("tags")),
    cover: text("cover"),
    featured: form.get("featured") === "on",
    status: form.get("intent") === "publish" ? "published" : "draft",
    publishAt: text("publishAt"),
  };
  const fields = validatePost(input);
  if (Object.keys(fields).length) return { error: "Some fields need attention.", fields };

  let slug: string;
  try {
    slug = (await savePost(input, text("original") || undefined)).slug;
  } catch (e) {
    if (e instanceof BlogError) return { error: e.message };
    console.error("blog save failed", e instanceof Error ? e.message : e);
    return { error: "The post couldn't be saved. Try again." };
  }
  revalidatePath("/blog", "layout");
  redirect(`/blog/${slug}?saved=${input.status}`);
}

// Where list actions return to: the dashboard or the blog index, nothing else.
const backTo = (form: FormData) => (form.get("next") === "/blog/manage" ? "/blog/manage" : "/blog");

/** Runs a storage write; storage problems come back as a short code for the page to explain. */
async function attempt(op: () => Promise<unknown>) {
  try {
    await op();
    return "";
  } catch (e) {
    console.error("blog update failed", e instanceof Error ? e.message : e);
    return e instanceof BlogError && /read-only/.test(e.message) ? "readonly" : "failed";
  }
}

export async function deletePostAction(form: FormData) {
  if (!(await currentAdmin())) redirect("/blog/login");
  const next = backTo(form);
  const error = await attempt(() => deletePost(String(form.get("slug") ?? "")));
  revalidatePath("/blog", "layout");
  redirect(error ? `${next}?error=${error}` : `${next}?deleted=1`);
}

/** Publish or unpublish straight from the post list, keeping everything else. */
export async function setStatusAction(form: FormData) {
  if (!(await currentAdmin())) redirect("/blog/login");
  const post = await getPost(String(form.get("slug") ?? ""));
  if (!post) redirect("/blog/manage?error=missing");
  const status = form.get("status") === "published" ? "published" : "draft";
  // Publishing keeps a future schedule; otherwise the date is stamped (or kept) by savePost.
  const future = post.publishedAt && Date.parse(post.publishedAt) > Date.now() ? post.publishedAt : "";
  const error = await attempt(() =>
    savePost(
      {
        slug: post.slug,
        title: post.title,
        description: post.description,
        content: post.content,
        tags: post.tags,
        cover: post.cover,
        featured: post.featured,
        status,
        publishAt: status === "published" ? future : "",
      },
      post.slug
    )
  );
  revalidatePath("/blog", "layout");
  redirect(error ? `/blog/manage?error=${error}` : `/blog/manage?done=${status}&post=${post.slug}`);
}
