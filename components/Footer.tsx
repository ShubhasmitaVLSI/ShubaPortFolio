import { profile } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="footer">
      <span>
        © {new Date().getFullYear()} {profile.name} · {profile.role} ·{" "}
        <span title="Anonymous page statistics: no cookies, no IP addresses stored; Do Not Track is respected.">
          Cookie-free analytics
        </span>
      </span>
      <span className="footer-links">
        <a href="/blog">Blog</a>
        <a href="/lexicon">Lexicon</a>
        <a href={profile.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <a href={profile.booking}>Book a call</a>
        <a href="#top">Back to top ↑</a>
      </span>
    </footer>
  );
}
