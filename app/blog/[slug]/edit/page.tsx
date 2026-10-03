import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PostEditor from "@/components/blog/PostEditor";
import { currentAdmin } from "@/lib/auth";
import { getPost } from "@/lib/blog-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit post", robots: { index: false } };

export default async function EditPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(await currentAdmin())) redirect(`/blog/login?next=/blog/${slug}/edit`);
  const post = await getPost(slug);
  if (!post) notFound();
  return (
    <main className="blog-editor">
      <PostEditor post={post} />
    </main>
  );
}
