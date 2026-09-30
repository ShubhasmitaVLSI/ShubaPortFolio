import type { Metadata } from "next";
import Effects from "@/components/Effects";
import Footer from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";
import { profile, projects } from "@/lib/data";

export const metadata: Metadata = {
  title: `Project archive — ${profile.name}`,
  description: "Design verification case files: IP verification, testchips, GLS-SDF, emulation, SVA and automation.",
};

export default function Projects() {
  return (
    <>
      <Effects />
      <header className="nav">
        <a className="brand" href="/">
          <span className="mark">SS</span>
          <span className="brand-name">Shubhasmita</span>
        </a>
        <nav className="nav-links show" aria-label="Primary">
          <a href="/">← Home</a>
          <a className="nav-cta" href="/#contact">
            Let&apos;s talk
          </a>
        </nav>
      </header>
      <main className="archive" id="top">
        <section className="archive-head">
          <p className="kicker reveal">Project archive</p>
          <h1 className="reveal d1">
            Every <em>case file</em>, end to end.
          </h1>
          <p className="lede reveal d2">
            Verification work across IP, testchip and gate-level work. Implementation, program and process details
            are intentionally generalized.
          </p>
        </section>
        {projects.map((p) => (
          <article id={`project-${p.id}`} className="archive-item spot" key={p.id} data-reveal>
            <div className="archive-meta">
              <span className="archive-id">{p.id}</span>
              <span>{p.period}</span>
              <span>{p.org}</span>
            </div>
            <div className="archive-body">
              <h2>{p.title}</h2>
              <p>{p.detail}</p>
              <div className="flow">
                {p.layers.map((l, i) => (
                  <div className="flow-step" key={l}>
                    <span className="flow-idx">{String(i + 1).padStart(2, "0")}</span>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
              <ul className="modal-list">
                {p.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <div className="tags">
                {p.tags.map((t) => (
                  <span className="tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}

