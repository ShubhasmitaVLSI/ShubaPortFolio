import { logout } from "@/app/blog/actions";
import { currentAdmin } from "@/lib/auth";

export default async function BlogHeader() {
  const admin = await currentAdmin();
  return (
    <header className="nav">
      <a className="brand" href="/">
        <span className="mark">SS</span>
        <span className="brand-name">Shubhasmita</span>
      </a>
      <nav className="nav-links show blog-nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/blog">Blog</a>
        {admin ? (
          <>
            <form action={logout}>
              <button type="submit" className="blog-nav-btn">
                Sign out
              </button>
            </form>
            <a className="nav-cta" href="/blog/new">
              ✎ Write
            </a>
          </>
        ) : (
          <a className="nav-cta" href="/book">
            Let&apos;s talk
          </a>
        )}
      </nav>
    </header>
  );
}
