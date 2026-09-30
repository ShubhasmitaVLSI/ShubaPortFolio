import { profile } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="footer">
      <span>
        © {new Date().getFullYear()} {profile.name} · {profile.role}
      </span>
      <span className="footer-links">
        <a href={profile.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <a href={profile.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="#top">Back to top ↑</a>
      </span>
    </footer>
  );
}
