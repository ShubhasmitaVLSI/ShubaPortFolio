import {
  aiUses,
  approach,
  certifications,
  experience,
  growth,
  marquee,
  metrics,
  profile,
  projects,
  roadmap,
  stack,
} from "./data";

const first = profile.first;

// Everything the assistant may know comes from lib/data.ts, so the chat stays in sync with the page.
export function buildKnowledge() {
  const lines: string[] = [
    "# Profile",
    `Name: ${profile.name}`,
    `Role: ${profile.role} (${profile.title}) at ${profile.company}`,
    `Location: ${profile.location}`,
    `Experience: ${profile.years} years in design verification`,
    `LinkedIn: ${profile.linkedin} · GitHub: ${profile.github}`,
    `Summary: ${profile.tagline}`,
    "",
    "# Highlights",
    ...metrics.map((m) => `- ${m.value}${m.suffix} ${m.label} (${m.note})`),
    "",
    "# Experience & education",
  ];
  for (const r of experience) {
    lines.push(`## ${r.title}, ${r.org} (${r.period})`, r.blurb);
    r.duties.forEach((d) => d.items.forEach((it) => lines.push(`- ${it}`)));
  }
  lines.push("", "# Projects (generalized; confidential details withheld)");
  for (const p of projects) {
    lines.push(`## ${p.title} (${p.org}, ${p.period})`, p.detail, `Flow: ${p.layers.join(" → ")}`, `Tags: ${p.tags.join(", ")}`);
  }
  lines.push("", "# Skills");
  stack.forEach((g) => lines.push(`- ${g.title}: ${g.items.join(", ")}`));
  lines.push("", "# Engineering approach", ...approach.map((a) => `- ${a.title}: ${a.body}`));
  lines.push("", "# AI-for-VLSI track", ...aiUses.map((u) => `- ${u.title}: ${u.body}`));
  lines.push("", "# Roadmap");
  roadmap.forEach((r) => lines.push(`- ${r.phase} (${r.label}): ${r.items.join(", ")}`));
  lines.push("", "# Growth interests", `Primary: ${growth.primary.join("; ")}`, `Adjacent: ${growth.adjacent.join("; ")}`);
  lines.push("", "# Certifications", ...certifications.map((c) => `- ${c.name} — ${c.by} (${c.year})`));
  return lines.join("\n");
}

export type SectionContext = { label: string; hint: string; questions: string[] };

export const sectionContexts: Record<string, SectionContext> = {
  top: { label: "the introduction", hint: "the hero introduction", questions: [`What does ${first} do?`, "What's the tech stack?"] },
  impact: { label: "the verification summary", hint: "the highlights and metrics", questions: ["What SoC verification has she done?"] },
  about: { label: "the profile", hint: "the professional profile", questions: [`What are ${first}'s career goals?`] },
  work: { label: "the case files", hint: "the project cards", questions: ["Tell me about GLS-SDF debug", "What IP verification has she done?"] },
  schema: { label: "the career schema", hint: "the ER diagram of the career (engineer, employer, projects, skills, flows, education, certifications, goals)", questions: ["Which verification flows are covered?"] },
  experience: { label: "the timeline", hint: "the experience and education timeline", questions: [`What does ${first} do at Synopsys?`] },
  stack: { label: "the skill hierarchy", hint: "the UVM-style skill tree", questions: [`Which EDA tools does ${first} use?`] },
  approach: { label: "the engineering approach", hint: "the engineering approach section", questions: [`How does ${first} approach debug?`] },
  ai: { label: "the AI-for-VLSI track", hint: "the AI-assisted VLSI section", questions: [`How does ${first} use AI in verification?`] },
  roadmap: { label: "the roadmap", hint: "the career roadmap", questions: [`What is ${first} learning next?`] },
  education: { label: "education", hint: "education and certifications", questions: [`Where did ${first} study?`] },
  contact: { label: "contact", hint: "the contact section", questions: [`How can I reach ${first}?`] },
  projects: { label: "the project archive", hint: "the full project archive page", questions: ["Which project involved emulation?"] },
};

export const suggestedQuestions = [
  `What does ${first} do?`,
  "Tell me about the SoC verification work",
  "What's the tech stack?",
  `How can I reach ${first}?`,
];

export const guideActions = [
  { label: "Quick intro", detail: "Role, focus and experience", question: `What does ${first} do?` },
  { label: "Verification depth", detail: "GLS-SDF, SVA, emulation", question: "Tell me about her GLS-SDF and SVA work" },
  { label: "SoC verification", detail: "Integration to gate level", question: "Tell me about the SoC verification work" },
  { label: "Where she's heading", detail: "Staff / Principal-track DV", question: `What are ${first}'s career goals?` },
];

export function buildSystemPrompt(section?: string) {
  const ctx = section && Object.hasOwn(sectionContexts, section) ? sectionContexts[section] : undefined;
  const where = ctx ? `\n\nThe visitor is currently viewing ${ctx.hint}. "This" or "here" refers to that part of the site.` : "";
  return `You are the portfolio assistant on ${profile.name}'s website. Visitors are mostly recruiters, hiring managers and engineers.

Rules:
- Answer only from the KNOWLEDGE below. If something is not covered, say you don't have that detail and suggest reaching out on LinkedIn: ${profile.linkedin}
- Refer to ${first} in the third person (she/her). Be warm, direct and concise: 2–5 sentences or a short "- " bullet list.
- Plain text only. No headings, tables or markdown links; write URLs out in full.
- Never invent numbers, employers, dates, customers, process nodes or confidential program details.${where}

KNOWLEDGE:
${buildKnowledge()}`;
}

const has = (q: string, words: string[]) => words.some((w) => q.includes(w));

const intro = () =>
  `${first} is a ${profile.role} (${profile.title}) at ${profile.company}, ${profile.location}, with ${profile.years} years in design verification. ${profile.tagline}`;
const stackAnswer = () => `Core stack: ${marquee.join(", ")}.`;
const contact = () => `The best way to reach ${first} is LinkedIn: ${profile.linkedin} (GitHub: ${profile.github}).`;

// Direct answers for the most common questions, answered before any model call.
export function profileAnswer(question: string): string | undefined {
  const q = question.toLowerCase().replace(/[’']/g, "'");
  if (has(q, ["salary", "notice", "ctc", "relocat", "visa"])) return undefined;
  const parts: string[] = [];
  if (has(q, ["what does", "who is", "current role", "introduce"])) parts.push(intro());
  if (has(q, ["tech stack", "tect stack", "technolog", "stack?", "skills"]) && !projects.some((p) => q.includes(p.title.toLowerCase())))
    parts.push(stackAnswer());
  if (has(q, ["reach", "contact", "hire", "hiring", "connect", "email", "github", "linkedin"])) parts.push(contact());
  return parts.length ? parts.join("\n\n") : undefined;
}

// Offline fallback: keyword match over the same data when no model is available.
export function localAnswer(question: string): string {
  const direct = profileAnswer(question);
  if (direct) return direct;
  const q = question.toLowerCase();
  const project = projects.find((p) =>
    p.title
      .toLowerCase()
      .split(/[^a-z0-9-]+/)
      .filter((w) => w.length > 2 && !["and", "verification", "support"].includes(w))
      .some((w) => q.includes(w))
  );
  if (project) return `${project.title}: ${project.detail}\n- ${project.bullets.join("\n- ")}`;
  if (has(q, ["flow", "sign-off", "signoff"]))
    return `Verification flows ${first} works with: GLS, power-aware GLS (PG-GLS) and GLS-SDF timing simulation, plus hardware-emulation-based verification. ${projects[2].detail}`;
  if (has(q, ["ip verification", "ip-level", "ip level"])) return `${projects[0].title}: ${projects[0].detail}`;
  if (has(q, ["soc", "fifo"])) return projects[1].detail;
  if (has(q, ["sdf", "gls", "timing", "x-prop"])) return projects[2].detail;
  if (has(q, ["emulat", "zebu", "sva", "assert"])) return projects[3].detail;
  if (has(q, ["study", "education", "degree", "college", "nit", "kiit"]))
    return `${first} holds an M.Tech from KIIT (2021–2023) and a Bachelor's degree from NIT Rourkela (2015–2019).`;
  if (has(q, ["certif"])) return certifications.map((c) => `- ${c.name} — ${c.by} (${c.year})`).join("\n");
  if (has(q, ["goal", "career", "future", "next", "learn", "roadmap"]))
    return `${first} is growing toward Staff / Principal-track verification architecture.\n- ${roadmap
      .map((r) => `${r.phase}: ${r.items.slice(0, 3).join(", ")}`)
      .join("\n- ")}`;
  if (has(q, ["ai", "rag", "llm", "agent", "langchain"]))
    return `${first} treats AI as a productivity layer while engineering judgment stays with the engineer. Areas: ${aiUses
      .map((u) => u.title.toLowerCase())
      .join(", ")}.`;
  if (has(q, ["tool", "eda", "vcs", "verdi"])) return `Tools: ${stack[2].items.join(", ")}.`;
  if (has(q, ["debug", "approach", "method"])) return approach.map((a) => `- ${a.title}: ${a.body}`).join("\n");
  if (has(q, ["synopsys", "experience", "work"])) {
    const r = experience[0];
    return `${first} has been ${r.title} at ${r.org} since July 2023. ${r.blurb}`;
  }
  return `That detail is not listed on this portfolio. ${contact()}`;
}
