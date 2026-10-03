import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/blog/LoginForm";
import { authProblems, currentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Author sign in", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await currentAdmin()) redirect("/blog");
  const { next } = await searchParams;
  const problems = authProblems();
  // Visitors never see setup details; the cause goes to the server log (Vercel → Logs).
  if (problems.length) console.warn(`Blog sign-in disabled: ${problems.join("; ")}`);
  const local = process.env.NODE_ENV !== "production";
  return (
    <main className="auth">
      <div className="auth-card spot reveal">
        <span className="mark" aria-hidden="true">
          SS
        </span>
        <h1>Author sign in</h1>
        <p className="auth-sub">Sign in to write, edit and publish posts.</p>
        {!problems.length ? (
          <LoginForm next={next ?? "/blog"} />
        ) : local ? (
          <div className="auth-setup">
            <p>Sign-in isn&apos;t configured on this machine: {problems.join("; ")}.</p>
            <p>
              Add them to <code>.env.local</code> and restart the dev server.
            </p>
          </div>
        ) : (
          <p className="auth-setup">Author sign-in is unavailable right now.</p>
        )}
        <a className="back-link" href="/blog">
          ← Back to the blog
        </a>
      </div>
    </main>
  );
}
