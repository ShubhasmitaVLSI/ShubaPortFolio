// A small renderer for Mermaid-style flowcharts in ```mermaid blocks:
//
//   flowchart TD
//       A[Spec] --> B[Plan]
//       B --> C{Done?}
//       C -->|no| B
//
// Supports [box] and {decision} nodes, --> edges and |labels|. Nodes are laid
// out top-down by their longest path from the start; edges that point back up
// the chart become labelled feedback loops listed beside it. Everything is
// escaped, so the output is safe to inject like the rest of the Markdown.

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

type Node = { id: string; label: string; decision: boolean; order: number };
type Edge = { from: string; to: string; label: string };

const NODE = /([A-Za-z][\w-]*)\s*(?:\[([^\]]*)\]|\{([^}]*)\})?/y;

/** Reads one node reference at `pos`, registering its label if it carries one. */
function readNode(line: string, pos: number, nodes: Map<string, Node>) {
  NODE.lastIndex = pos;
  const m = NODE.exec(line);
  if (!m) return null;
  const [, id, box, diamond] = m;
  const known = nodes.get(id);
  if (!known) nodes.set(id, { id, label: box ?? diamond ?? id, decision: diamond !== undefined, order: nodes.size });
  else if (box !== undefined || diamond !== undefined) Object.assign(known, { label: box ?? diamond, decision: diamond !== undefined });
  return { id, end: NODE.lastIndex };
}

/** Multi-line labels: the first line is the title, the rest a note. */
function labelHtml(label: string) {
  const [title, ...rest] = label.split(/<br\s*\/?>/i).map((s) => s.trim());
  return `<strong>${esc(title)}</strong>${rest.length ? `<small>${esc(rest.join(" "))}</small>` : ""}`;
}

export function renderFlow(src: string): string | null {
  const lines = src.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("%%"));
  if (!/^(flowchart|graph)\s+(TD|TB)\b/i.test(lines[0] ?? "")) return null;

  const nodes = new Map<string, Node>();
  const edges: Edge[] = [];
  for (const line of lines.slice(1)) {
    const a = readNode(line, 0, nodes);
    if (!a) continue;
    const arrow = line.slice(a.end).match(/^\s*-->\s*(?:\|([^|]*)\|\s*)?/);
    if (!arrow) continue;
    const b = readNode(line, a.end + arrow[0].length, nodes);
    if (b) edges.push({ from: a.id, to: b.id, label: (arrow[1] ?? "").trim() });
  }
  if (nodes.size < 2 || !edges.length) return null;

  // Level each node by its shortest distance from a start node. An edge that
  // points to the same or an earlier level is a feedback loop, not layout.
  // (Depth-first stack order would depend on which branch is explored first.)
  const ordered = [...nodes.values()].sort((x, y) => x.order - y.order);
  const targets = new Set(edges.map((e) => e.to));
  const level = new Map<string, number>();
  const queue = ordered.filter((n) => !targets.has(n.id)).map((n) => n.id);
  if (!queue.length) queue.push(ordered[0].id);
  queue.forEach((id) => level.set(id, 0));
  for (let i = 0; i < queue.length; i++)
    for (const e of edges)
      if (e.from === queue[i] && !level.has(e.to)) {
        level.set(e.to, level.get(e.from)! + 1);
        queue.push(e.to);
      }
  ordered.forEach((n) => level.has(n.id) || level.set(n.id, 0));
  const back = new Set(edges.filter((e) => level.get(e.to)! <= level.get(e.from)!));

  // Rank = longest forward path from a start node.
  const forward = edges.filter((e) => !back.has(e));
  const rank = new Map<string, number>(ordered.map((n) => [n.id, 0]));
  for (let pass = 0; pass < nodes.size; pass++)
    for (const e of forward) rank.set(e.to, Math.max(rank.get(e.to)!, rank.get(e.from)! + 1));
  const depth = Math.max(...rank.values());
  const rows = Array.from({ length: depth + 1 }, (_, r) => ordered.filter((n) => rank.get(n.id) === r));

  const parts: string[] = [];
  rows.forEach((row, r) => {
    parts.push(
      `<li class="flow-row${row.length > 1 ? " parallel" : ""}" style="--i:${r}">` +
        row.map((n) => `<span class="flow-node${n.decision ? " decision" : ""}">${labelHtml(n.label)}</span>`).join("") +
        `</li>`
    );
    if (r < depth) {
      // Label the connector with what gates the step below, e.g. a decision's "yes".
      const labels = [...new Set(forward.filter((e) => rank.get(e.from) === r && e.label).map((e) => e.label))];
      parts.push(`<li class="flow-link" style="--i:${r}" aria-hidden="true">${labels.length ? `<span>${esc(labels.join(" · "))}</span>` : ""}</li>`);
    }
  });

  const name = (id: string) => esc(nodes.get(id)!.label.split(/<br\s*\/?>/i)[0].trim());
  const loops = [...back].map(
    (e) =>
      `<li><span class="flow-loop-path">${name(e.from)} <i aria-hidden="true">↺</i> ${name(e.to)}</span>${e.label ? `<span class="flow-loop-why">${esc(e.label)}</span>` : ""}</li>`
  );

  return (
    `<figure class="flow"><div class="flow-body"><ol class="flow-rows" aria-label="Flowchart, top to bottom">${parts.join("")}</ol>` +
    (loops.length ? `<div class="flow-loops"><p>Feedback loops</p><ul>${loops.join("")}</ul></div>` : "") +
    `</div></figure>`
  );
}
