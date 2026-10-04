"use client";

import { useEffect, useState } from "react";
import type { PathStep, ResolvedPath } from "@/lib/blog-paths";

// Read posts are remembered per browser; nothing depends on it beyond the ✓ marks.
const KEY = "blog-read";
const EVENT = "blog-read-change";

function readSlugs(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function markRead(slug: string) {
  const slugs = readSlugs();
  if (slugs.includes(slug)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...slugs, slug].slice(-200)));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/** Slugs this visitor has finished. Empty until mounted, so server and client renders match. */
export function useReadSlugs() {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setSlugs(readSlugs());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return slugs;
}

const Check = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="m3.5 8.5 3 3 6-7" />
  </svg>
);

/** Compact stepper under the post header: where this post sits in its path. */
export function PathStepper({ path, index }: { path: ResolvedPath; index: number }) {
  const read = useReadSlugs();
  const current = path.steps[index];
  return (
    <nav className="path-stepper reveal d3" aria-label={`Reading path: ${path.title}`}>
      <p className="path-label">
        <span>Reading path</span>
        <strong>{path.title}</strong>
        <span>
          Step {current.n} of {path.steps.length} · {current.stage}
        </span>
      </p>
      <ol style={{ "--steps": path.steps.length } as React.CSSProperties}>
        {path.steps.map((s, i) => {
          const done = read.includes(s.slug);
          const state = i === index ? "current" : done ? "done" : i < index ? "before" : "after";
          return (
            <li key={s.slug} className={state}>
              <a href={`/blog/${s.slug}`} aria-current={i === index ? "page" : undefined} title={s.title}>
                <span className="path-dot">{done && i !== index ? <Check /> : s.n}</span>
                <span className="path-stage">{s.stage}</span>
                <span className="sr-only">
                  : {s.title}
                  {done ? " (read)" : ""}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepCard({ step, dir, total }: { step: PathStep; dir: "prev" | "next"; total: number }) {
  return (
    <a className={`path-card spot ${dir}`} href={`/blog/${step.slug}`} rel={dir}>
      <span className="path-card-kicker">
        {dir === "next" ? "Up next" : "Previous"} · Step {step.n} of {total}
      </span>
      <strong>{step.title}</strong>
      {dir === "next" && <p>{step.why}</p>}
      <span className="path-card-foot">
        <span>
          {step.stage} · {step.minutes} min read
        </span>
        <span className="path-arrow" aria-hidden="true">
          {dir === "next" ? "→" : "←"}
        </span>
      </span>
    </a>
  );
}

/** End-of-post guidance: what to read next and why, or a wrap-up on the last step. */
export function PathNext({ path, index }: { path: ResolvedPath; index: number }) {
  const read = useReadSlugs();
  const prev = path.steps[index - 1];
  const next = path.steps[index + 1];
  const total = path.steps.length;
  // Count this post as read once the visitor gets here, so the tally doesn't lag by one.
  const done = path.steps.filter((s, i) => i === index || read.includes(s.slug)).length;

  return (
    <section className="path-next" aria-labelledby="path-next-title">
      <div className="path-next-head">
        <p className="kicker">Reading path</p>
        <h2 id="path-next-title">{next ? "Where to go from here" : "You've reached the end of the path"}</h2>
        <p className="path-progress">
          <span className="path-meter" aria-hidden="true">
            <i style={{ width: `${(done / total) * 100}%` }} />
          </span>
          <span>
            {done} of {total} read in <strong>{path.title}</strong>
          </span>
        </p>
      </div>
      <div className={`path-cards ${prev && next ? "two" : ""}`}>
        {prev && <StepCard step={prev} dir="prev" total={total} />}
        {next ? (
          <StepCard step={next} dir="next" total={total} />
        ) : (
          <a className="path-card spot next" href={`/blog/${path.steps[0].slug}`}>
            <span className="path-card-kicker">Path complete</span>
            <strong>{path.summary}</strong>
            <p>Revisit the start, or browse every post by topic.</p>
            <span className="path-card-foot">
              <span>Back to step 1</span>
              <span className="path-arrow" aria-hidden="true">
                ↺
              </span>
            </span>
          </a>
        )}
      </div>
    </section>
  );
}

/** "Start here" block on the blog index: every step, with progress and a resume link. */
export function PathOverview({ path }: { path: ResolvedPath }) {
  const read = useReadSlugs();
  const resume = path.steps.find((s) => !read.includes(s.slug));
  const started = path.steps.some((s) => read.includes(s.slug));
  const minutes = path.steps.reduce((m, s) => m + s.minutes, 0);

  return (
    <section className="path-overview spot reveal d3" aria-labelledby={`path-${path.id}`}>
      <div className="path-overview-head">
        <div>
          <p className="kicker">Start here · reading path</p>
          <h2 id={`path-${path.id}`}>{path.title}</h2>
          <p>{path.summary}</p>
        </div>
        <div className="path-overview-cta">
          <span>
            {path.steps.length} posts · {minutes} min
          </span>
          {resume ? (
            <a className="btn primary sm" href={`/blog/${resume.slug}`}>
              {started ? `Continue with step ${resume.n}` : "Start reading"} <span aria-hidden="true">→</span>
            </a>
          ) : (
            <span className="badge ok">✓ Path complete</span>
          )}
        </div>
      </div>
      <ol className="path-track">
        {path.steps.map((s) => {
          const done = read.includes(s.slug);
          return (
            <li key={s.slug} className={done ? "done" : s === resume ? "resume" : ""} style={{ "--i": s.n } as React.CSSProperties}>
              <a href={`/blog/${s.slug}`}>
                <span className="path-dot">{done ? <Check /> : s.n}</span>
                <span className="path-stage">{s.stage}</span>
                <strong>{s.title}</strong>
                <small>
                  {s.minutes} min{done ? " · read" : ""}
                </small>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
