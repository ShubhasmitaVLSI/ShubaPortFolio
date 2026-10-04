"use client";

import { useEffect, useState } from "react";
import { deletePostAction } from "@/app/blog/actions";
import type { Heading } from "@/lib/markdown";

/** Time left, from how far the reader is through the article. */
function useMinutesLeft(minutes: number) {
  const [left, setLeft] = useState(minutes);
  useEffect(() => {
    const article = document.querySelector<HTMLElement>(".post .prose");
    if (!article) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = article.getBoundingClientRect();
      const read = Math.min(1, Math.max(0, (window.innerHeight * 0.4 - r.top) / r.height));
      setLeft(Math.ceil(minutes * (1 - read)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [minutes]);
  return left;
}

/** Sticky "On this page" list that highlights the section being read. */
export function Toc({ headings, minutes }: { headings: Heading[]; minutes: number }) {
  const [active, setActive] = useState(headings[0]?.id ?? "");
  const left = useMinutesLeft(minutes);
  const at = Math.max(0, headings.findIndex((h) => h.id === active));

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => el !== null);
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [headings]);

  return (
    <nav className="toc" aria-label="On this page">
      <p className="toc-title">On this page</p>
      <ol style={{ "--toc-progress": `${((at + 1) / headings.length) * 100}%` } as React.CSSProperties}>
        {headings.map((h, i) => (
          <li key={h.id} className={`${h.level === 3 ? "sub" : ""} ${i < at ? "passed" : ""}`}>
            <a href={`#${h.id}`} aria-current={active === h.id ? "true" : undefined}>
              {h.text}
            </a>
          </li>
        ))}
      </ol>
      <p className="toc-left" aria-live="off">
        {left > 0 ? `${left} min left` : "Finished · see what's next ↓"}
      </p>
    </nav>
  );
}

export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setUrl(window.location.origin + window.location.pathname);
    setCanShare(typeof navigator.share === "function");
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  const enc = encodeURIComponent;

  return (
    <div className="share" aria-label="Share this post" role="group">
      <span className="share-label">Share</span>
      <button type="button" className="chip" onClick={copy}>
        {copied ? "✓ Link copied" : "Copy link"}
      </button>
      <a className="chip" href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener noreferrer">
        LinkedIn
      </a>
      <a className="chip" href={`https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer">
        X
      </a>
      {canShare && (
        <button type="button" className="chip" onClick={() => navigator.share({ title, url }).catch(() => {})}>
          More…
        </button>
      )}
    </div>
  );
}

/** Adds a copy button to each code block in the article. */
export function CodeCopy() {
  useEffect(() => {
    const buttons: HTMLButtonElement[] = [];
    document.querySelectorAll<HTMLPreElement>(".prose pre").forEach((pre) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy";
      btn.textContent = "Copy";
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pre.querySelector("code")?.textContent ?? "");
          btn.textContent = "Copied";
        } catch {
          btn.textContent = "Press ⌘C";
        }
        window.setTimeout(() => (btn.textContent = "Copy"), 1600);
      });
      pre.append(btn);
      buttons.push(btn);
    });
    return () => buttons.forEach((b) => b.remove());
  }, []);
  return null;
}

export function DeleteButton({ slug, title }: { slug: string; title: string }) {
  return (
    <form
      action={deletePostAction}
      onSubmit={(e) => {
        if (!window.confirm(`Delete “${title}”? This can't be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" className="btn ghost sm danger">
        Delete
      </button>
    </form>
  );
}
