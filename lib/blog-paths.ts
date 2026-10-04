// Curated reading paths: an ordered route through related posts, with a line on
// why each step comes next. Steps whose post isn't live are skipped, so a path
// never links to a draft or a deleted post.

import { readingMinutes, type Post } from "@/lib/blog";

type Step = { slug: string; stage: string; why: string };
type ReadingPath = { id: string; title: string; summary: string; steps: Step[] };

export const READING_PATHS: ReadingPath[] = [
  {
    id: "rtl-to-silicon",
    title: "From RTL to silicon",
    summary: "Follow one design from its first testbench, through the gate-level netlist and timing signoff, to the tester.",
    steps: [
      {
        slug: "verifying-a-synchronous-fifo",
        stage: "Functional verification",
        why: "Start with the contract: a scoreboard, flag assertions and corner coverage on RTL.",
      },
      {
        slug: "gls-foundations-part-1-netlists-cells-liberty",
        stage: "Gate-level simulation",
        why: "Take the same design to the netlist: standard cells, Liberty, SDF, and how a timing violation becomes an X.",
      },
      {
        slug: "gls-foundations-part-2-sdc-sta-testbench",
        stage: "Timing signoff",
        why: "Learn what STA trusts, read a path report line by line, and make your testbench run on the netlist.",
      },
      {
        slug: "dft-hidden-gems",
        stage: "Design for test",
        why: "Scan chains bring their own hold problems, at-speed tests and X-sources. Here is what coverage reports hide.",
      },
      {
        slug: "advanced-dft-beyond-coverage",
        stage: "Silicon test",
        why: "Defect-level math, timing-aware ATPG, secure scan and what happens after the part leaves the tester.",
      },
    ],
  },
];

export type PathStep = Step & { n: number; title: string; minutes: number };
export type ResolvedPath = { id: string; title: string; summary: string; steps: PathStep[] };

/** A path with only the steps visitors can open, numbered in reading order. */
export function resolvePath(path: ReadingPath, live: Post[]): ResolvedPath {
  const bySlug = new Map(live.map((p) => [p.slug, p]));
  const steps = path.steps.flatMap((s) => {
    const post = bySlug.get(s.slug);
    return post ? [{ ...s, title: post.title, minutes: readingMinutes(post.content) }] : [];
  });
  return { ...path, steps: steps.map((s, i) => ({ ...s, n: i + 1 })) };
}

/** The first path that includes `slug`, with the post's position in it. */
export function pathFor(slug: string, live: Post[]) {
  for (const p of READING_PATHS) {
    const path = resolvePath(p, live);
    const index = path.steps.findIndex((s) => s.slug === slug);
    if (index >= 0 && path.steps.length > 1) return { path, index };
  }
  return null;
}
