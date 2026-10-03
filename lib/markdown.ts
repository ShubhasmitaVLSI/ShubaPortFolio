// A small Markdown renderer for blog posts. Every piece of source text is
// HTML-escaped and only http(s), mailto, site-relative and #anchor URLs are
// linked, so the output is safe to inject without a sanitizer.

import { isSafeImage, slugify } from "@/lib/blog";
import { highlight } from "@/lib/highlight";
import { renderWave } from "@/lib/wave";

export type Heading = { id: string; text: string; level: 2 | 3 };

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

const safeHref = (url: string) => /^(https?:\/\/|mailto:|\/(?!\/)|#)[^\s"'<>]*$/i.test(url);

const FENCE = /^\s*(`{3,}|~{3,})\s*([\w+#.-]*)\s*$/;
const HEADING = /^(#{1,4})\s+(.+?)\s*#*\s*$/;
const HR = /^\s*([-*_])(\s*\1){2,}\s*$/;
const LIST = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const FIGURE = /^\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/;
const CALLOUTS: Record<string, string> = { NOTE: "Note", TIP: "Tip", IMPORTANT: "Important", WARNING: "Warning", CAUTION: "Caution" };

// `held` is shared with nested calls (link text) so placeholders made by the outer pass survive.
function inline(src: string, held: string[] = []): string {
  const hold = (html: string) => `\u0000${held.push(html) - 1}\u0000`;
  let s = held.length ? src : src.replace(/\u0000/g, "");

  s = s.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (_, __, code: string) => hold(`<code>${esc(code.trim())}</code>`));
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (m, alt: string, url: string, title?: string) =>
    isSafeImage(url)
      ? hold(`<img src="${esc(url)}" alt="${esc(alt)}"${title ? ` title="${esc(title)}"` : ""} loading="lazy" />`)
      : hold(esc(m))
  );
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (m, text: string, url: string) => {
    if (!safeHref(url)) return hold(esc(m));
    const external = /^https?:/i.test(url);
    return hold(`<a href="${esc(url)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${inline(text, held)}</a>`);
  });
  s = s.replace(/\bhttps?:\/\/[^\s<>"'`]+[^\s<>"'`.,;:!?)\]]/g, (url) =>
    hold(`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a>`)
  );

  s = esc(s)
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>")
    .replace(/__(?=\S)([\s\S]*?\S)__/g, "<strong>$1</strong>")
    .replace(/\*([^\s*](?:[^*]*?[^\s*])?)\*/g, "<em>$1</em>")
    .replace(/(^|[^\w])_([^\s_](?:[^_]*?[^\s_])?)_(?!\w)/g, "$1<em>$2</em>")
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>");

  return s.replace(/\u0000(\d+)\u0000/g, (_, i: string) => held[Number(i)]);
}

/** Paragraph lines join with spaces; a trailing double space or backslash forces a line break. */
const paragraph = (lines: string[]) =>
  lines
    .map((l, i) => {
      const hard = i < lines.length - 1 && /( {2,}|\\)$/.test(l);
      return inline(l.replace(/\\$/, "").trim()) + (i < lines.length - 1 ? (hard ? "<br />" : " ") : "");
    })
    .join("");

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, "|"));

const isTableStart = (line: string, next?: string) => line.includes("|") && next !== undefined && TABLE_SEP.test(next);

function startsBlock(line: string, next?: string) {
  return (
    FENCE.test(line) || HEADING.test(line) || HR.test(line) || /^\s*>/.test(line) || LIST.test(line) || isTableStart(line, next)
  );
}

type Ctx = { headings: Heading[]; ids: Map<string, number>; toc: boolean };

function headingId(text: string, ctx: Ctx) {
  const base = slugify(text) || "section";
  const n = ctx.ids.get(base) ?? 0;
  ctx.ids.set(base, n + 1);
  return n ? `${base}-${n}` : base;
}

function blocks(src: string, ctx: Ctx): string {
  const lines = src.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1];

    if (!line.trim()) {
      i++;
      continue;
    }

    const fence = line.match(FENCE);
    if (fence) {
      const close = new RegExp(`^\\s*${fence[1][0] === "`" ? "`" : "~"}{${fence[1].length},}\\s*$`);
      const body: string[] = [];
      i++;
      while (i < lines.length && !close.test(lines[i])) body.push(lines[i++]);
      i++;
      const lang = fence[2].toLowerCase();
      const wave = lang === "wave" ? renderWave(body.join("\n")) : null;
      out.push(
        wave ??
          `<pre${lang ? ` data-lang="${esc(lang)}"` : ""}><code${lang ? ` class="language-${esc(lang)}"` : ""}>${highlight(body.join("\n"), lang)}</code></pre>`
      );
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      const level = Math.min(4, Math.max(2, heading[1].length));
      const html = inline(heading[2]);
      const text = html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      const id = headingId(text, ctx);
      if (ctx.toc && level <= 3) ctx.headings.push({ id, text, level: level as 2 | 3 });
      out.push(`<h${level} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${html}</h${level}>`);
      i++;
      continue;
    }

    if (HR.test(line)) {
      out.push("<hr />");
      i++;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) body.push(lines[i++].replace(/^\s*>\s?/, ""));
      const callout = body[0]?.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i);
      const inner = blocks((callout ? body.slice(1) : body).join("\n"), { ...ctx, toc: false });
      if (callout) {
        const kind = callout[1].toUpperCase();
        out.push(`<aside class="callout callout-${kind.toLowerCase()}"><p class="callout-title">${CALLOUTS[kind]}</p>${inner}</aside>`);
      } else out.push(`<blockquote>${inner}</blockquote>`);
      continue;
    }

    const item = line.match(LIST);
    if (item) {
      const base = item[1].length;
      const ordered = /\d/.test(item[2]);
      const start = ordered ? parseInt(item[2], 10) : 1;
      const items: string[][] = [];
      while (i < lines.length) {
        const l = lines[i];
        const m = l.match(LIST);
        if (m && m[1].length <= base + 1) {
          if (/\d/.test(m[2]) !== ordered) break;
          items.push([m[3]]);
          i++;
        } else if (l.trim() && /^\s/.test(l) && items.length) {
          items[items.length - 1].push(l.replace(new RegExp(`^\\s{0,${base + 4}}`), ""));
          i++;
        } else if (!l.trim() && LIST.test(lines[i + 1] ?? "") && (lines[i + 1].match(LIST)![1].length <= base + 1)) {
          i++;
        } else break;
      }
      const lis = items.map(([first, ...rest]) => {
        const task = first.match(/^\[([ xX])\]\s+(.*)$/);
        const head = task
          ? `<input type="checkbox" disabled${task[1] !== " " ? " checked" : ""} /> ${inline(task[2])}`
          : inline(first);
        const nested = rest.length ? blocks(rest.join("\n"), { ...ctx, toc: false }) : "";
        return `<li${task ? ' class="task"' : ""}>${head}${nested}</li>`;
      });
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}${ordered && start !== 1 ? ` start="${start}"` : ""}>${lis.join("")}</${tag}>`);
      continue;
    }

    if (isTableStart(line, next)) {
      const head = cells(line);
      const align = cells(next!).map((c) => (c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : c.startsWith(":") ? "left" : ""));
      const td = (tag: string, c: string, k: number) => `<${tag}${align[k] ? ` style="text-align:${align[k]}"` : ""}>${inline(c)}</${tag}>`;
      i += 2;
      const rows: string[] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        const r = cells(lines[i++]);
        rows.push(`<tr>${head.map((_, k) => td("td", r[k] ?? "", k)).join("")}</tr>`);
      }
      out.push(
        `<div class="table-wrap"><table><thead><tr>${head.map((c, k) => td("th", c, k)).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`
      );
      continue;
    }

    const figure = line.match(FIGURE);
    if (figure && isSafeImage(figure[2])) {
      const caption = figure[3] || figure[1];
      out.push(
        `<figure><img src="${esc(figure[2])}" alt="${esc(figure[1])}" loading="lazy" />${caption ? `<figcaption>${esc(caption)}</figcaption>` : ""}</figure>`
      );
      i++;
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !(para.length && startsBlock(lines[i], lines[i + 1]))) para.push(lines[i++]);
    out.push(`<p>${paragraph(para)}</p>`);
  }

  return out.join("\n");
}

export function renderMarkdown(src: string) {
  const ctx: Ctx = { headings: [], ids: new Map(), toc: true };
  const html = blocks(src.replace(/\r\n?/g, "\n").replace(/\t/g, "    "), ctx);
  return { html, headings: ctx.headings };
}
