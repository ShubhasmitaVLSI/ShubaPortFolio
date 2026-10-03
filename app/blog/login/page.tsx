import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/blog/LoginForm";
import { authConfigured, currentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Author sign in", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await currentAdmin()) redirect("/blog");
  const { next } = await searchParams;
  return (
    <main className="auth">
      <div className="auth-card spot reveal">
        <span className="mark" aria-hidden="true">
          SS
        </span>
        <h1>Author sign in</h1>
        <p className="auth-sub">Sign in to write, edit and publish posts.</p>
        {authConfigured() ? (
          <LoginForm next={next ?? "/blog"} />
        ) : (
          <div className="auth-setup">
            <p>Sign-in isn&apos;t configured yet. Add these to <code>.env.local</code> (or the hosting environment) and restart:</p>
            <pre>{`BLOG_ADMIN_EMAIL=you@example.com
BLOG_ADMIN_PASSWORD=a-long-passphrase
BLOG_AUTH_SECRET=<32+ random characters>`}</pre>
          </div>
        )}
        <a className="back-link" href="/blog">
          ← Back to the blog
        </a>
      </div>
    </main>
  );
}
