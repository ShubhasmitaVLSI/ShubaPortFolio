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
import { BlogError, deletePost, savePost } from "@/lib/blog-store";

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

export async function deletePostAction(form: FormData) {
  if (!(await currentAdmin())) redirect("/blog/login");
  const slug = String(form.get("slug") ?? "");
  await deletePost(slug);
  revalidatePath("/blog", "layout");
  redirect("/blog?deleted=1");
}
