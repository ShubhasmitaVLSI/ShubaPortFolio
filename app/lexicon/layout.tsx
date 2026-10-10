import Effects from "@/components/Effects";
import Footer from "@/components/Footer";
import { PaletteButton } from "@/components/CommandPalette";
import { profile } from "@/lib/data";
// Shares the blog's code, waveform, callout and header styles.
import "../blog/blog.css";
import "./lexicon.css";

export default function LexiconLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Effects />
      <header className="nav">
        <a className="brand" href="/">
          <span className="mark">SS</span>
          <span className="brand-name">Shubhasmita</span>
        </a>
        <nav className="nav-links show blog-nav" aria-label="Primary">
          <a className="nav-home" href="/">
            Home
          </a>
          <a href="/blog">Blog</a>
          <a href="/lexicon">Lexicon</a>
          <PaletteButton />
          <a className="nav-cta" href={profile.booking}>
            Let&apos;s talk
          </a>
        </nav>
      </header>
      {children}
      <Footer />
    </>
  );
}
