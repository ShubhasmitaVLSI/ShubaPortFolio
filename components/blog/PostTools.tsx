"use client";

import { useEffect, useState } from "react";
import { deletePostAction } from "@/app/blog/actions";
import type { Heading } from "@/lib/markdown";

/** Sticky "On this page" list that highlights the section being read. */
export function Toc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState(headings[0]?.id ?? "");

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
      <ol>
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "sub" : ""}>
            <a href={`#${h.id}`} aria-current={active === h.id ? "true" : undefined}>
              {h.text}
            </a>
          </li>
        ))}
      </ol>
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
