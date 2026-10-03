"use client";

import { useActionState, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { savePostAction, type SaveState } from "@/app/blog/actions";
import { LIMITS, isSafeImage, normalizeTags, readingMinutes, slugify, wordCount, type Post } from "@/lib/blog";
import { renderMarkdown } from "@/lib/markdown";

type Draft = {
  title: string;
  description: string;
  slug: string;
  tags: string[];
  cover: string;
  featured: boolean;
  content: string;
  publishAt: string; // ISO, "" = publish now
};
type View = "write" | "split" | "preview";

const STARTER = `Open with the problem or question this post answers.

## Context

What was being verified, and what made it interesting?

## Approach

- Step one
- Step two

\`\`\`systemverilog
// example
\`\`\`

> [!TIP]
> One lesson worth standardizing.

## Takeaways
`;

const fromPost = (p?: Post): Draft => ({
  title: p?.title ?? "",
  description: p?.description ?? "",
  slug: p?.slug ?? "",
  tags: p?.tags ?? [],
  cover: p?.cover ?? "",
  featured: p?.featured ?? false,
  content: p?.content ?? "",
  publishAt: p?.publishedAt ?? "",
});

// <input type="datetime-local"> works in the browser's local time.
const toLocalInput = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const MAX_EDGE = 1800;

/** Downscales large photos to WebP in the browser, then uploads. Returns the image URL. */
async function uploadImage(file: File): Promise<string> {
  let body: Blob = file;
  if (file.type !== "image/gif" && file.type !== "image/svg+xml") {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
      if (scale < 1 || file.size > 1_500_000) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const webp = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.86));
        if (webp && webp.size < file.size) body = webp;
      }
      bitmap.close();
    } catch {}
  }
  const form = new FormData();
  form.append("file", body, file.name);
  const res = await fetch("/api/blog/media", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
  return data.url;
}

const altFrom = (name: string) =>
  name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").replace(/[\[\]()]/g, "").trim().slice(0, 80) || "image";

const imagesIn = (list: FileList | null | undefined) => [...(list ?? [])].filter((f) => f.type.startsWith("image/"));

const same = (a: Draft, b: Draft) => JSON.stringify(a) === JSON.stringify(b);

const ago = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(t).toLocaleDateString();
};

// Markdown shortcuts: wrap the selection, or prefix each selected line.
type Tool = { label: string; title: string; key?: string; wrap?: [string, string, string]; line?: string; block?: string };
const TOOLS: Tool[] = [
  { label: "H2", title: "Heading", line: "## " },
  { label: "H3", title: "Subheading", line: "### " },
  { label: "B", title: "Bold (⌘B)", key: "b", wrap: ["**", "**", "bold text"] },
  { label: "I", title: "Italic (⌘I)", key: "i", wrap: ["*", "*", "italic text"] },
  { label: "</>", title: "Inline code", wrap: ["`", "`", "code"] },
  { label: "🔗", title: "Link (⌘K)", key: "k", wrap: ["[", "](https://)", "link text"] },
  { label: "•", title: "Bulleted list", line: "- " },
  { label: "1.", title: "Numbered list", line: "1. " },
  { label: "❝", title: "Quote", line: "> " },
  { label: "{ }", title: "Code block", wrap: ["\n```systemverilog\n", "\n```\n", "code"] },
  { label: "🖼", title: "Upload image (or paste / drop one)" },
  { label: "▦", title: "Table", block: "\n| Column | Column |\n| --- | --- |\n| Value | Value |\n" },
  { label: "💡", title: "Callout", block: "\n> [!NOTE]\n> Something worth remembering.\n" },
  { label: "∿", title: "Timing diagram", block: "\n```wave\n# Valid/ready handshake\nclk   : p.......\nvalid : 0.1...0.\nready : 0..1..0.\ndata  : x.=.=.x. | A5 3C\n```\n" },
];

export default function PostEditor({ post }: { post?: Post }) {
  const initial = useMemo(() => fromPost(post), [post]);
  const storageKey = `blog-draft:${post?.slug ?? "new"}`;
  const [d, setD] = useState<Draft>(initial);
  const [slugEdited, setSlugEdited] = useState(Boolean(post));
  const [tagInput, setTagInput] = useState("");
  const [view, setView] = useState<View>("write");
  const [backup, setBackup] = useState<{ draft: Draft; at: number } | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [state, action, pending] = useActionState<SaveState, FormData>(savePostAction, {});
  const form = useRef<HTMLFormElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const secondary = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);

  const dirty = !same(d, initial);
  const content = useDeferredValue(d.content);
  const preview = useMemo(() => renderMarkdown(content).html, [content]);
  const words = wordCount(d.content);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((prev) => ({ ...prev, [key]: value }));

  // Offer to restore an unsaved local copy from an earlier visit.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null") as { draft: Draft; at: number } | null;
      if (saved?.draft && !same(saved.draft, initial)) setBackup(saved);
    } catch {}
  }, [storageKey, initial]);

  // Autosave to this browser while typing, so nothing is lost to a closed tab or expired session.
  useEffect(() => {
    if (!dirty || backup) return;
    const t = window.setTimeout(() => {
      try {
        const at = Date.now();
        localStorage.setItem(storageKey, JSON.stringify({ draft: d, at }));
        setSavedAt(at);
      } catch {}
    }, 700);
    return () => window.clearTimeout(t);
  }, [d, dirty, backup, storageKey]);

  // Submitting clears the local copy; a failed save puts it back.
  useEffect(() => {
    if (!state.error) return;
    submitting.current = false;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ draft: d, at: Date.now() }));
    } catch {}
  }, [state]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty && !submitting.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // ⌘/Ctrl+S saves with the main button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!pending) form.current?.requestSubmit(post?.status === "published" ? primary.current : secondary.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, post?.status]);

  // Inserts a placeholder at the cursor right away, then swaps in the uploaded image.
  const insertImages = async (files: File[]) => {
    if (!files.length) return;
    setUploadError("");
    const el = area.current;
    const at = el ? el.selectionEnd : d.content.length;
    const marks = files.map((f, i) => `![Uploading ${altFrom(f.name)}… ${Date.now()}-${i}]()`);
    setD((prev) => ({ ...prev, content: prev.content.slice(0, at) + `\n${marks.join("\n\n")}\n` + prev.content.slice(at) }));
    setUploading((n) => n + files.length);
    await Promise.all(
      files.map(async (f, i) => {
        try {
          const url = await uploadImage(f);
          setD((prev) => ({ ...prev, content: prev.content.replace(marks[i], `![${altFrom(f.name)}](${url})`) }));
        } catch (e) {
          setD((prev) => ({ ...prev, content: prev.content.replace(`${marks[i]}\n`, "").replace(marks[i], "") }));
          setUploadError(e instanceof Error ? e.message : "Upload failed.");
        } finally {
          setUploading((n) => n - 1);
        }
      })
    );
  };

  const uploadCover = async (file?: File) => {
    if (!file) return;
    setUploadError("");
    setUploading((n) => n + 1);
    try {
      set("cover", await uploadImage(file));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading((n) => n - 1);
    }
  };

  const apply = (tool: Tool) => {
    const el = area.current;
    if (!el) return;
    if (!tool.wrap && !tool.line && !tool.block) return fileInput.current?.click();
    const { selectionStart: s, selectionEnd: e, value } = el;
    let text: string;
    let selStart: number;
    let selEnd: number;
    if (tool.wrap) {
      const [before, after, placeholder] = tool.wrap;
      const inner = value.slice(s, e) || placeholder;
      text = value.slice(0, s) + before + inner + after + value.slice(e);
      selStart = s + before.length;
      selEnd = selStart + inner.length;
    } else if (tool.line) {
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      const block = value.slice(lineStart, e);
      const prefixed = block
        .split("\n")
        .map((l, i) => (tool.line === "1. " ? `${i + 1}. ` : tool.line) + l.replace(/^(#{1,4} |> |- |\d+\. )/, ""))
        .join("\n");
      text = value.slice(0, lineStart) + prefixed + value.slice(e);
      selStart = lineStart + prefixed.length;
      selEnd = selStart;
    } else {
      text = value.slice(0, e) + tool.block + value.slice(e);
      selStart = selEnd = e + tool.block!.length;
    }
    set("content", text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    });
  };

  const onEditorKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const tool = TOOLS.find((t) => t.key === e.key.toLowerCase());
    if (tool) {
      e.preventDefault();
      apply(tool);
    }
  };

  const addTags = (raw: string) => {
    const next = normalizeTags([...d.tags, ...raw.split(",")]);
    set("tags", next);
    setTagInput("");
  };

  const errors = state.fields ?? {};
  const slug = d.slug || slugify(d.title);
  const live = post?.status === "published";
  const scheduledFor = d.publishAt && Date.parse(d.publishAt) > Date.now() ? d.publishAt : "";

  return (
    <form
      ref={form}
      action={action}
      className="editor"
      onSubmit={() => {
        submitting.current = true;
        try {
          localStorage.removeItem(storageKey);
        } catch {}
      }}
    >
      <input type="hidden" name="original" value={post?.slug ?? ""} />
      <input type="hidden" name="tags" value={d.tags.join(",")} />
      <input type="hidden" name="publishAt" value={d.publishAt} />
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => {
          insertImages(imagesIn(e.target.files));
          e.target.value = "";
        }}
      />

      {backup && (
        <div className="editor-banner" role="status">
          <span>You have unsaved changes from {ago(backup.at)}.</span>
          <button
            type="button"
            className="btn primary sm"
            onClick={() => {
              setD(backup.draft);
              setSlugEdited(Boolean(backup.draft.slug));
              setBackup(null);
            }}
          >
            Restore
          </button>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => {
              try {
                localStorage.removeItem(storageKey);
              } catch {}
              setBackup(null);
            }}
          >
            Discard
          </button>
        </div>
      )}

      {state.error && (
        <div className="editor-error" role="alert">
          {state.error}
        </div>
      )}

      <div className="editor-grid">
        <div className="editor-main">
          <label className="sr-only" htmlFor="title">
            Title
          </label>
          <textarea
            id="title"
            name="title"
            className="title-input"
            placeholder="Post title"
            rows={1}
            maxLength={LIMITS.title}
            value={d.title}
            required
            autoFocus={!post}
            aria-invalid={Boolean(errors.title)}
            onChange={(e) => {
              const title = e.target.value.replace(/\n/g, " ");
              setD((prev) => ({ ...prev, title, slug: slugEdited ? prev.slug : slugify(title) }));
            }}
          />
          {errors.title && <p className="field-error">{errors.title}</p>}

          <div className="field">
            <label htmlFor="description">
              Description <small>Shown on cards, in search results and link previews.</small>
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              maxLength={LIMITS.description}
              placeholder="One or two sentences on what readers will learn."
              value={d.description}
              required
              aria-invalid={Boolean(errors.description)}
              onChange={(e) => set("description", e.target.value)}
            />
            <span className={`counter ${d.description.length > LIMITS.description - 40 ? "warn" : ""}`}>
              {d.description.length}/{LIMITS.description}
            </span>
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>

          <div className="md-editor">
            <div className="md-bar">
              <div className="md-tools" role="toolbar" aria-label="Formatting">
                {TOOLS.map((t) => (
                  <button
                    key={t.title}
                    type="button"
                    title={t.title}
                    aria-label={t.title}
                    disabled={view === "preview"}
                    onClick={() => apply(t)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="segmented" role="group" aria-label="Editor view">
                {(["write", "split", "preview"] as const).map((v) => (
                  <button key={v} type="button" aria-pressed={view === v} className={v === "split" ? "wide-only" : ""} onClick={() => setView(v)}>
                    {v[0].toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className={`md-panes view-${view}`}>
              <textarea
                ref={area}
                name="content"
                aria-label="Post content (Markdown)"
                className="md-input"
                placeholder="Start writing… Markdown works: ## headings, **bold**, lists, ```code```, > quotes."
                value={d.content}
                aria-invalid={Boolean(errors.content)}
                onChange={(e) => set("content", e.target.value)}
                onKeyDown={onEditorKey}
                onPaste={(e) => {
                  const files = imagesIn(e.clipboardData.files);
                  if (files.length) {
                    e.preventDefault();
                    insertImages(files);
                  }
                }}
                onDragOver={(e) => {
                  if ([...e.dataTransfer.types].includes("Files")) {
                    e.preventDefault();
                    setDragging(true);
                  }
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  setDragging(false);
                  const files = imagesIn(e.dataTransfer.files);
                  if (files.length) {
                    e.preventDefault();
                    const el = area.current;
                    const pos = el && document.caretPositionFromPoint?.(e.clientX, e.clientY);
                    if (el && pos && pos.offsetNode === el) el.setSelectionRange(pos.offset, pos.offset);
                    insertImages(files);
                  }
                }}
                data-dragging={dragging || undefined}
                spellCheck
              />
              <div className="md-preview">
                {d.content.trim() ? (
                  <div className="prose" dangerouslySetInnerHTML={{ __html: preview }} />
                ) : (
                  <p className="md-empty">The preview appears here as you type.</p>
                )}
              </div>
            </div>
            <div className="md-status">
              <span>
                {words} {words === 1 ? "word" : "words"} · {readingMinutes(d.content)} min read
              </span>
              {!d.content && (
                <button type="button" className="link-btn" onClick={() => set("content", STARTER)}>
                  Use a starter outline
                </button>
              )}
              {uploading > 0 && <span className="uploading">Uploading {uploading === 1 ? "image" : `${uploading} images`}…</span>}
              <span className="autosave">{savedAt ? `Saved in this browser ${ago(savedAt)}` : dirty ? "Unsaved changes" : ""}</span>
            </div>
            {errors.content && <p className="field-error">{errors.content}</p>}
            {uploadError && (
              <p className="field-error" role="alert">
                {uploadError}
              </p>
            )}
          </div>
        </div>

        <aside className="editor-side">
          <div className="side-card spot">
            <h2>{post ? (live ? (post.publishedAt && Date.parse(post.publishedAt) > Date.now() ? "Scheduled" : "Published") : "Draft") : "New post"}</h2>
            <p className="side-hint">
              {scheduledFor
                ? "It stays hidden until the publish date, then goes live on its own."
                : live
                  ? "Changes go live when you update."
                  : "Drafts are visible only to you."}{" "}
              Press ⌘S / Ctrl+S to save.
            </p>
            <div className="side-actions">
              <button ref={primary} type="submit" name="intent" value="publish" className="btn primary" disabled={pending}>
                {pending ? "Saving…" : scheduledFor ? (live ? "Update schedule" : "Schedule") : live ? "Update post" : "Publish"}
              </button>
              <button ref={secondary} type="submit" name="intent" value="draft" className="btn ghost" disabled={pending}>
                {live ? "Unpublish to draft" : "Save draft"}
              </button>
            </div>
            <label className="publish-at">
              <span>
                Publish date <small>your time · leave empty for now</small>
              </span>
              <input
                type="datetime-local"
                value={toLocalInput(d.publishAt)}
                aria-invalid={Boolean(errors.publishAt)}
                onChange={(e) => set("publishAt", e.target.value ? new Date(e.target.value).toISOString() : "")}
              />
            </label>
            {errors.publishAt && <p className="field-error">{errors.publishAt}</p>}
            {post && (
              <a className="side-link" href={`/blog/${post.slug}`}>
                View post →
              </a>
            )}
          </div>

          <div className="side-card spot">
            <label htmlFor="slug">URL</label>
            <div className="slug-field">
              <span>/blog/</span>
              <input
                id="slug"
                name="slug"
                value={d.slug}
                placeholder={slug || "post-url"}
                maxLength={LIMITS.slug}
                aria-invalid={Boolean(errors.slug)}
                onChange={(e) => {
                  setSlugEdited(true);
                  set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                }}
                onBlur={() => set("slug", slugify(d.slug))}
              />
            </div>
            {errors.slug ? (
              <p className="field-error">{errors.slug}</p>
            ) : (
              live && post && d.slug !== post.slug && <p className="field-note">Changing the URL breaks links already shared.</p>
            )}
          </div>

          <div className="side-card spot">
            <label htmlFor="tag-input">Topics</label>
            <div className="tag-input">
              {d.tags.map((t) => (
                <span className="tag" key={t}>
                  #{t}
                  <button type="button" aria-label={`Remove ${t}`} onClick={() => set("tags", d.tags.filter((x) => x !== t))}>
                    ×
                  </button>
                </span>
              ))}
              {d.tags.length < LIMITS.tags && (
                <input
                  id="tag-input"
                  value={tagInput}
                  placeholder={d.tags.length ? "Add…" : "uvm, sva, debug"}
                  onChange={(e) => (e.target.value.includes(",") ? addTags(e.target.value) : setTagInput(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (tagInput.trim()) addTags(tagInput);
                    } else if (e.key === "Backspace" && !tagInput && d.tags.length) set("tags", d.tags.slice(0, -1));
                  }}
                  onBlur={() => tagInput.trim() && addTags(tagInput)}
                />
              )}
            </div>
            <p className="field-note">Press Enter or comma to add. Up to {LIMITS.tags}.</p>
          </div>

          <div className="side-card spot">
            <label htmlFor="cover">Cover image</label>
            <div className="cover-field">
              <input
                id="cover"
                name="cover"
                type="text"
                inputMode="url"
                placeholder="Paste a link or upload"
                value={d.cover}
                aria-invalid={Boolean(errors.cover)}
                onChange={(e) => set("cover", e.target.value.trim())}
              />
              <button type="button" className="btn ghost sm" onClick={() => coverInput.current?.click()}>
                Upload
              </button>
              <input
                ref={coverInput}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={(e) => {
                  uploadCover(imagesIn(e.target.files)[0]);
                  e.target.value = "";
                }}
              />
            </div>
            {errors.cover && <p className="field-error">{errors.cover}</p>}
            {d.cover && isSafeImage(d.cover) && (
              <div className="cover-preview-wrap">
                <img className="cover-preview" src={d.cover} alt="Cover preview" />
                <button type="button" className="cover-remove" aria-label="Remove cover" onClick={() => set("cover", "")}>
                  ×
                </button>
              </div>
            )}
            <p className="field-note">Without a cover, the post gets generated artwork.</p>
          </div>

          <div className="side-card spot">
            <label className="toggle">
              <input type="checkbox" name="featured" checked={d.featured} onChange={(e) => set("featured", e.target.checked)} />
              <span>
                <strong>Feature this post</strong>
                <small>Pins it to the top of the blog.</small>
              </span>
            </label>
          </div>

          <details className="side-card spot md-help">
            <summary>Markdown cheatsheet</summary>
            <dl>
              <dt>## Heading</dt>
              <dd>Section (appears in the table of contents)</dd>
              <dt>**bold** *italic*</dt>
              <dd>Emphasis</dd>
              <dt>[text](https://…)</dt>
              <dd>Link</dd>
              <dt>![alt](https://…)</dt>
              <dd>Image with caption</dd>
              <dt>```sv … ```</dt>
              <dd>Code block with copy button</dd>
              <dt>```wave</dt>
              <dd>Timing diagram: clk : p.... / data : x=.=x | A B</dd>
              <dt>```sv</dt>
              <dd>Highlighting: sv, py, tcl, sh</dd>
              <dt>&gt; [!TIP]</dt>
              <dd>Callout: NOTE, TIP, WARNING</dd>
              <dt>- [ ] task</dt>
              <dd>Checklist</dd>
            </dl>
          </details>
        </aside>
      </div>
    </form>
  );
}
