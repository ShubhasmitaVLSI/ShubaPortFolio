// Cross-links between the home-page views: the capability wheel, skill tree,
// ER diagram and case files all describe the same career, so selecting
// something in one can bring up the matching item in another.

import { projects } from "./data";
import { skillTree, type SkillLeaf } from "./structure";

export type FocusTarget =
  | { kind: "skill"; name: string }
  | { kind: "entity"; id: string; row?: string }
  | { kind: "project"; id: string };

const EVENT = "dv:focus";

/** Ask whichever view owns the target to select it and scroll it into view. */
export function focusOn(target: FocusTarget) {
  window.dispatchEvent(new CustomEvent<FocusTarget>(EVENT, { detail: target }));
}

/** Subscribe to focus requests; returns the unsubscribe function. */
export function onFocus(cb: (target: FocusTarget) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<FocusTarget>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

const leaves: SkillLeaf[] = skillTree.branches.flatMap((b) => b.leaves);

/** Projects whose copy mentions the skill (matched on its first word). */
export function projectsForSkill(name: string) {
  const key = name.toLowerCase().split(/[\s/·×]+/)[0];
  if (key.length < 3) return [];
  return projects.filter((p) => `${p.title} ${p.detail} ${p.tags.join(" ")}`.toLowerCase().includes(key));
}

/** Skills that show up in a project, in skill-tree order. */
export function skillsForProject(id: string) {
  return leaves.filter((l) => projectsForSkill(l.name).some((p) => p.id === id));
}

/** The skill-tree leaf a project tag refers to, if any. */
export function skillForTag(tag: string) {
  const t = tag.toLowerCase();
  return (
    leaves.find((l) => l.name.toLowerCase() === t) ??
    leaves.find((l) => l.name.toLowerCase().split(/\s*[/·]\s*|\s+/).includes(t)) ??
    leaves.find((l) => l.name.toLowerCase().startsWith(t))
  );
}

/** Scroll an element into view and play a short highlight on it. */
export function ping(el: Element | null | undefined) {
  if (!el) return;
  el.scrollIntoView({ block: "center" });
  el.classList.remove("ping");
  // Restart the animation if the same element is pinged twice in a row.
  void (el as HTMLElement).offsetWidth;
  el.classList.add("ping");
  window.setTimeout(() => el.classList.remove("ping"), 1800);
}
