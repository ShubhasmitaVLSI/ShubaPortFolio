import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PostEditor from "@/components/blog/PostEditor";
import { currentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New post", robots: { index: false } };

export default async function NewPost() {
  if (!(await currentAdmin())) redirect("/blog/login?next=/blog/new");
  return (
    <main className="blog-editor">
      <PostEditor />
    </main>
  );
}
