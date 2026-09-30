import { certifications, profile, projects, roadmap } from "./data";

/* ---------- Skill hierarchy (rendered as a UVM-style component tree) ---------- */

export type SkillLeaf = { name: string; note: string };
export type SkillBranch = { id: string; inst: string; label: string; leaves: SkillLeaf[] };

export const skillTree: { root: { inst: string; label: string }; branches: SkillBranch[] } = {
  root: { inst: "uvm_test_top", label: "Shubhasmita · DV" },
  branches: [
    {
      id: "method",
      inst: "env.methodology",
      label: "Methodology",
      leaves: [
        { name: "SystemVerilog / UVM", note: "Reusable UVM environments for IP and SoC-level verification." },
        { name: "Constrained-random", note: "Randomized stimulus steered by constraints toward corner cases." },
        { name: "SVA", note: "Property-based checks for protocol, control and functional behavior." },
        { name: "Coverage closure", note: "Functional and code coverage driven to closure against the plan." },
        { name: "Test planning", note: "Feature-based test plans with traceability to coverage." },
      ],
    },
    {
      id: "signoff",
      inst: "env.gls_agent",
      label: "Gate-level / timing-aware verification",
      leaves: [
        { name: "GLS", note: "Gate-level simulation to confirm post-synthesis behavior." },
        { name: "PG-GLS", note: "Power-aware gate-level runs across power sequences." },
        { name: "GLS-SDF", note: "SDF-annotated timing simulation and timing checks." },
        { name: "X-propagation", note: "X-propagation debug at gate level." },
        { name: "UPF", note: "Low-power intent validated with UPF concepts." },
      ],
    },
    {
      id: "silicon",
      inst: "env.silicon_agent",
      label: "Silicon & testchip",
      leaves: [
        { name: "IP verification", note: "Assertion- and coverage-driven IP-level checks." },
        { name: "Testchip DV", note: "Multiple testchip verification projects in chip context." },
        { name: "JTAG", note: "JTAG-based verification and debug." },
      ],
    },
    {
      id: "tools",
      inst: "env.tool_agent",
      label: "Tools & protocols",
      leaves: [
        { name: "VCS · Verdi", note: "Simulation, waveform debug and failure triage." },
        { name: "PrimeTime", note: "Timing context for setup/hold and SDF-related debug." },
        { name: "ZeBu", note: "Hardware-emulation-based verification and debug." },
        { name: "APB · AXI", note: "AMBA transaction behavior, protocol checks and coverage." },
      ],
    },
    {
      id: "auto",
      inst: "env.regress_seq",
      label: "Automation",
      leaves: [
        { name: "Python", note: "Regression launch, reporting and verification data analysis." },
        { name: "TCL", note: "Tool-flow scripting across simulation and timing tools." },
        { name: "Makefiles", note: "Repeatable RTL and GLS regression flows." },
      ],
    },
    {
      id: "ai",
      inst: "env.ai_copilot",
      label: "AI for VLSI",
      leaves: [
        { name: "RAG", note: "Spec and micro-architecture retrieval grounded in source documents." },
        { name: "Agentic AI", note: "Agent workflows for log triage and coverage-gap analysis." },
        { name: "LangChain", note: "Orchestration concepts for LLM-backed engineering tools." },
      ],
    },
  ],
};

/* ---------- Career schema (rendered as an ER diagram) ---------- */

export type Field = { name: string; type: string; key?: "PK" | "FK" };
export type Entity = {
  id: string;
  label: string;
  x: number;
  y: number;
  hue: 1 | 2 | 3;
  fields: Field[];
  rows: Record<string, string>[];
};
export type Card = "one" | "many";
export type Relation = { from: string; to: string; verb: string; fromCard: Card; toCard: Card };

export const schema: { width: number; height: number; entities: Entity[]; relations: Relation[] } = {
  width: 1080,
  height: 660,
  entities: [
    {
      id: "engineer",
      label: "ENGINEER",
      x: 430,
      y: 240,
      hue: 1,
      fields: [
        { name: "engineer_id", type: "int", key: "PK" },
        { name: "name", type: "varchar" },
        { name: "role", type: "varchar" },
        { name: "base", type: "varchar" },
        { name: "experience", type: "varchar" },
      ],
      rows: [
        {
          engineer_id: "1",
          name: profile.name,
          role: profile.role,
          base: profile.location,
          experience: `${profile.years} yrs`,
        },
      ],
    },
    {
      id: "goal",
      label: "CAREER_GOAL",
      x: 430,
      y: 20,
      hue: 3,
      fields: [
        { name: "goal_id", type: "int", key: "PK" },
        { name: "engineer_id", type: "int", key: "FK" },
        { name: "horizon", type: "varchar" },
        { name: "focus", type: "text" },
      ],
      rows: roadmap.map((r, i) => ({
        goal_id: String(i + 1),
        engineer_id: "1",
        horizon: r.phase,
        focus: r.items.slice(0, 3).join(", "),
      })),
    },
    {
      id: "employer",
      label: "EMPLOYER",
      x: 30,
      y: 30,
      hue: 2,
      fields: [
        { name: "employer_id", type: "int", key: "PK" },
        { name: "engineer_id", type: "int", key: "FK" },
        { name: "name", type: "varchar" },
        { name: "title", type: "varchar" },
        { name: "since", type: "date" },
      ],
      rows: [{ employer_id: "1", engineer_id: "1", name: "Synopsys", title: "R&D Senior Engineer", since: "2023-07" }],
    },
    {
      id: "project",
      label: "PROJECT",
      x: 30,
      y: 320,
      hue: 3,
      fields: [
        { name: "project_id", type: "int", key: "PK" },
        { name: "employer_id", type: "int", key: "FK" },
        { name: "title", type: "varchar" },
        { name: "period", type: "varchar" },
      ],
      rows: projects.map((p) => ({ project_id: p.id, employer_id: "1", title: p.title, period: p.period })),
    },
    {
      id: "skill",
      label: "SKILL",
      x: 430,
      y: 495,
      hue: 2,
      fields: [
        { name: "skill_id", type: "int", key: "PK" },
        { name: "name", type: "varchar" },
        { name: "category", type: "varchar" },
      ],
      rows: skillTree.branches
        .flatMap((b) => b.leaves.map((l) => ({ name: l.name, category: b.label })))
        .map((r, i) => ({ skill_id: String(i + 1), ...r })),
    },
    {
      id: "education",
      label: "EDUCATION",
      x: 830,
      y: 30,
      hue: 1,
      fields: [
        { name: "edu_id", type: "int", key: "PK" },
        { name: "engineer_id", type: "int", key: "FK" },
        { name: "degree", type: "varchar" },
        { name: "institute", type: "varchar" },
        { name: "years", type: "varchar" },
      ],
      rows: [
        { edu_id: "1", engineer_id: "1", degree: "M.Tech", institute: "KIIT", years: "2021–2023" },
        { edu_id: "2", engineer_id: "1", degree: "Bachelor's", institute: "NIT Rourkela", years: "2015–2019" },
      ],
    },
    {
      id: "certification",
      label: "CERTIFICATION",
      x: 830,
      y: 240,
      hue: 2,
      fields: [
        { name: "cert_id", type: "int", key: "PK" },
        { name: "engineer_id", type: "int", key: "FK" },
        { name: "name", type: "varchar" },
        { name: "issuer", type: "varchar" },
        { name: "year", type: "int" },
      ],
      rows: certifications.map((c, i) => ({
        cert_id: String(i + 1),
        engineer_id: "1",
        name: c.name,
        issuer: c.by,
        year: c.year,
      })),
    },
    {
      id: "flow",
      label: "VERIFICATION_FLOW",
      x: 830,
      y: 495,
      hue: 3,
      fields: [
        { name: "flow_id", type: "int", key: "PK" },
        { name: "name", type: "varchar" },
        { name: "checks", type: "text" },
      ],
      rows: [
        { flow_id: "1", name: "GLS", checks: "post-synthesis functional behavior" },
        { flow_id: "2", name: "PG-GLS", checks: "power-aware gate-level sequences" },
        { flow_id: "3", name: "GLS-SDF", checks: "timing checks, setup/hold, X-prop" },
        { flow_id: "4", name: "Emulation", checks: "hardware-emulation-based verification" },
      ],
    },
  ],
  relations: [
    { from: "engineer", to: "employer", verb: "works_at", fromCard: "one", toCard: "one" },
    { from: "employer", to: "project", verb: "delivers", fromCard: "one", toCard: "many" },
    { from: "project", to: "skill", verb: "applies", fromCard: "many", toCard: "many" },
    { from: "skill", to: "flow", verb: "powers", fromCard: "many", toCard: "many" },
    { from: "engineer", to: "skill", verb: "masters", fromCard: "one", toCard: "many" },
    { from: "engineer", to: "education", verb: "studied", fromCard: "one", toCard: "many" },
    { from: "engineer", to: "certification", verb: "earned", fromCard: "one", toCard: "many" },
    { from: "engineer", to: "goal", verb: "pursues", fromCard: "one", toCard: "many" },
  ],
};
