export const profile = {
  // Set to "/profile.jpg" after adding your portrait to public/.
  image: "",
  name: "Shubhasmita Sahoo",
  first: "Shubhasmita",
  last: "Sahoo",
  role: "Design Verification Engineer",
  company: "Synopsys",
  title: "R&D Senior Engineer",
  location: "Bengaluru, India",
  years: "4.2+",
  linkedin: "https://www.linkedin.com/in/shubhasmitavlsi",
  booking: "/book",
  tagline:
    "IP and SoC verification, timing-aware validation, GLS-SDF, FIFO verification, assertions, coverage closure, emulation support and debug that holds up on silicon.",
};

export const marquee = [
  "SystemVerilog",
  "UVM",
  "SVA",
  "GLS-SDF",
  "PG-GLS",
  "UPF",
  "FIFO",
  "APB",
  "AXI / AXI-Lite",
  "VCS",
  "Verdi",
  "PrimeTime",
  "ZeBu",
  "Python",
  "TCL",
  "Coverage Closure",
  "X-Propagation",
  "RAG / Agentic AI",
];

export const metrics = [
  { value: 4.2, decimals: 1, suffix: "+", label: "Years in design verification", note: "IP · SoC · Gate level" },
  { value: 5, decimals: 0, suffix: "", label: "Verification domains", note: "IP · SoC · GLS · Emulation · Automation" },
  { value: 3, decimals: 0, suffix: "", label: "Gate-level flows handled", note: "GLS · PG-GLS · GLS-SDF" },
  { value: 2, decimals: 0, suffix: "", label: "Engineering degrees", note: "B.Tech · M.Tech" },
];

export const pills = [
  "IP verification",
  "SoC verification",
  "FIFO verification",
  "SDF back-annotation",
  "SVA property checks",
  "UPF / power-aware",
  "Hardware emulation",
  "M.Tech · KIIT",
  "B.Tech · NIT Rourkela",
];

export type Project = {
  id: string;
  title: string;
  period: string;
  org: string;
  summary: string;
  tags: string[];
  detail: string;
  bullets: string[];
  layers: string[];
};

export const projects: Project[] = [
  {
    id: "01",
    title: "IP Verification",
    period: "2023 — Now",
    org: "Synopsys",
    summary:
      "IP-level functional verification with assertions, coverage closure, corner-aware checks and timing-aware debug.",
    tags: ["SystemVerilog", "SVA", "Coverage"],
    detail:
      "Contributed to IP-level functional verification using assertions, coverage analysis, corner-aware functional checks and timing-aware debug. Implementation and program details are kept confidential.",
    bullets: [
      "Feature-based test plans for IP-level functionality",
      "Corner-aware functional checks",
      "SVA properties for control, protocol and functional behavior",
      "Functional and code coverage closure against a feature-based plan",
    ],
    layers: ["Test plan", "Stimulus", "Assertions", "Coverage", "Debug"],
  },
  {
    id: "02",
    title: "SoC Verification",
    period: "Multiple projects",
    org: "Synopsys",
    summary:
      "IP integration, functional scenarios, coverage closure, FIFO verification and gate-level verification in SoC context.",
    tags: ["FIFO", "Integration", "GLS"],
    detail:
      "Contributed to SoC verification, covering IP integration, functional scenarios, coverage closure, FIFO verification and gate-level verification. Details are generalized to protect confidential program and process information.",
    bullets: [
      "IP integration checks inside the full-chip context",
      "SoC-level functional scenarios",
      "FIFO ordering, full/empty and overflow/underflow checks",
      "Gate-level runs to confirm behavior after synthesis",
    ],
    layers: ["IP integration", "SoC scenarios", "FIFO checks", "Coverage", "Gate level"],
  },
  {
    id: "03",
    title: "Gate-Level & Timing-Aware Verification",
    period: "2023 — Now",
    org: "Synopsys",
    summary:
      "Gate-level simulation skills: SDF-annotated timing simulation, setup/hold checks and X-propagation debug.",
    tags: ["GLS-SDF", "PG-GLS", "PrimeTime"],
    detail:
      "Worked with gate-level simulation, including power-aware GLS and SDF-annotated timing simulation, debugging setup/hold timing checks and X-propagation issues.",
    bullets: [
      "Gate-level and power-aware gate-level simulation",
      "SDF back-annotated timing simulation",
      "Setup/hold timing-check debug",
      "X-propagation debug",
    ],
    layers: ["Netlist", "SDF timing", "Timing checks", "X-prop debug", "Root cause"],
  },
  {
    id: "04",
    title: "Hardware Emulation & SVA",
    period: "2023 — Now",
    org: "Synopsys",
    summary:
      "Hardware-emulation-based verification and debug, and SVA for earlier, sharper failure detection.",
    tags: ["Emulation", "SVA", "Debug"],
    detail:
      "Supported hardware-emulation-based verification and debug. Wrote SystemVerilog Assertions for IP behavior and control/protocol properties to improve observability, catch violations earlier and accelerate debug.",
    bullets: [
      "Hardware-emulation-based verification and debug",
      "Property-based checks for protocol and control behavior",
      "Faster root-cause through assertion-driven observability",
    ],
    layers: ["Emulation", "Assertions", "Debug"],
  },
  {
    id: "05",
    title: "Regression & DV Automation",
    period: "Ongoing",
    org: "Synopsys",
    summary:
      "Python and Makefile-driven RTL/GLS regression workflows, triage and repeatable flows that keep engineering time on real debug.",
    tags: ["Python", "TCL", "Makefiles"],
    detail:
      "Automated RTL and GLS regression workflows using Python and Makefiles, created feature-based test plans and validated low-power behavior using UPF concepts.",
    bullets: [
      "Automated RTL and GLS regression launch and reporting",
      "Feature-based test plans with traceability to coverage",
      "Low-power behavior validated with UPF concepts",
      "Failure triage that speeds up debug",
    ],
    layers: ["Test plan", "Regression", "Triage", "Coverage report", "Standardize"],
  },
];

export type Duty = { heading: string; items: string[] };
export type Role = {
  period: string;
  org: string;
  title: string;
  blurb: string;
  duties: Duty[];
};

export const experience: Role[] = [
  {
    period: "Jul 2023 — Present",
    org: "Synopsys",
    title: "R&D Senior Engineer",
    blurb: "Design Verification Engineer with experience across IP and SoC verification.",
    duties: [],
  },
  {
    period: "2021 — 2023",
    org: "Kalinga Institute of Industrial Technology",
    title: "M.Tech",
    blurb: "Post-graduate study that deepened the VLSI and verification foundation.",
    duties: [
      {
        heading: "Focus",
        items: [
          "Built depth in digital design and verification fundamentals ahead of industry DV work.",
          "Bridged into hands-on IP and SoC verification at Synopsys from July 2023.",
        ],
      },
    ],
  },
  {
    period: "2015 — 2019",
    org: "National Institute of Technology Rourkela",
    title: "Bachelor's degree",
    blurb: "Engineering foundation in electronics and digital systems.",
    duties: [
      {
        heading: "Foundation",
        items: [
          "Core engineering training in digital logic, circuits and systems.",
          "Advanced Embedded Systems certification from Central Tool Room & Training Centre (2017).",
        ],
      },
    ],
  },
];

export const stack = [
  {
    title: "Languages & Methodology",
    icon: "lang",
    items: [
      "SystemVerilog, Verilog, UVM",
      "Constrained-random verification",
      "SVA / assertion-based verification",
      "Functional & code coverage",
      "Test planning & traceability",
      "IP / SoC verification",
    ],
  },
  {
    title: "Timing, Power & Silicon",
    icon: "timing",
    items: [
      "GLS, PG-GLS, GLS-SDF",
      "SDF back-annotation & timing checks",
      "X-propagation & setup/hold debug",
      "UPF / power-aware verification",
      "FIFO verification",
    ],
  },
  {
    title: "Tools, Protocols & Automation",
    icon: "tools",
    items: [
      "VCS, Verdi, PrimeTime",
      "FIFO, APB, AXI / AXI-Lite",
      "Python, TCL, Makefiles",
      "Regression infrastructure",
      "Waveform debug & failure triage",
      "ZeBu / hardware emulation",
    ],
  },
  {
    title: "AI for VLSI",
    icon: "ai",
    items: [
      "AI-assisted verification concepts",
      "Python for AI & automation",
      "RAG & retrieval over specs",
      "Agentic AI workflows",
      "LangChain concepts",
      "Practical LLM workflows",
    ],
  },
];

export const approach = [
  {
    title: "Understand before verifying",
    body: "Start from architecture, data/control flow, interfaces, reset/power behavior, timing intent and failure modes before expanding tests or constraints.",
  },
  {
    title: "Layer verification techniques",
    body: "Constrained-random, directed scenarios, assertions, coverage, GLS-SDF, low-power checks and emulation, so each technique covers a different class of risk.",
  },
  {
    title: "Debug from evidence",
    body: "Waveforms, assertions, coverage gaps, timing reports, regression trends and reproducible failing scenarios drive root-cause analysis.",
  },
  {
    title: "Automate repetitive work",
    body: "Python, TCL, Makefiles and regression infrastructure reduce manual effort and keep engineering time for higher-value debug.",
  },
];

export const cycle = ["Learn", "Apply", "Measure", "Reflect", "Standardize"];

export const roadmap = [
  {
    phase: "0 — 6 months",
    label: "Deepen",
    items: [
      "Formal + SVA depth",
      "Stronger GLS / X-prop methodology",
      "Python DV automation",
      "AI + RAG foundations",
      "Architecture reading discipline",
      "Public verification notes & projects",
    ],
  },
  {
    phase: "6 — 18 months",
    label: "Broaden",
    items: [
      "Emulation workflow depth",
      "Performance DV",
      "CDC/RDC & low-power depth",
      "Hardware security verification",
      "Agentic AI / LangChain",
      "AI-assisted debug prototypes",
      "SoC / interconnect verification",
    ],
  },
  {
    phase: "18+ months",
    label: "Lead",
    items: [
      "Staff-level verification architecture",
      "Cross-IP methodology ownership",
      "Domain-grounded DV copilots",
      "Verification productivity strategy",
      "Mentoring & technical influence",
      "Principal-track leadership",
    ],
  },
];

export const aiUses = [
  { title: "Spec retrieval", body: "Specification and micro-architecture knowledge retrieval grounded in source documents." },
  { title: "Log triage", body: "Regression-log triage and failure clustering to shrink time-to-first-look." },
  { title: "Coverage gaps", body: "Coverage-gap analysis that points to the scenarios still missing." },
  { title: "Assertion ideation", body: "Assertion and testcase ideation, reviewed and signed off by the engineer." },
  { title: "Debug memory", body: "Debug knowledge capture so a root cause is only found once." },
  { title: "DV docs", body: "Verification documentation kept in step with the environment." },
];

export const certifications = [
  { name: "Teamwork Essentials: Stand Out as a Valuable Team Member", by: "LinkedIn", year: "2025" },
  { name: "Aligning Goals and Priorities To Manage Time", by: "Skillsoft", year: "2024" },
  { name: "Effective Team Communication", by: "Skillsoft", year: "2024" },
  { name: "Generative AI and Its Impact to Everyday Business", by: "Skillsoft", year: "2024" },
  { name: "Trust Building through Effective Communication", by: "Skillsoft", year: "2024" },
  { name: "Advanced Embedded Systems", by: "Central Tool Room & Training Centre", year: "2017" },
];

export const growth = {
  primary: [
    "Verification architecture for IP, subsystem and SoC programs",
    "Advanced UVM environments, SVA strategy, coverage and verification closure quality",
    "GLS-SDF, X-propagation, low-power and timing-aware verification",
    "Emulation-aware verification and large-regression methodology",
    "Technical ownership, mentoring and cross-team verification strategy",
    "Low-power, CDC/RDC and SoC integration verification",
  ],
  adjacent: [
    "Formal verification and proof-oriented methodology",
    "Hardware security verification",
    "Performance verification and architecture-aware DV",
    "Verification productivity, CI/CD and data-driven regression analysis",
    "AI-assisted DV: RAG, agentic workflows, log and coverage analysis",
    "Verification knowledge systems and reusable engineering playbooks",
  ],
};

export const education = [
  { years: "2021 — 2023", degree: "M.Tech", school: "Kalinga Institute of Industrial Technology (KIIT)" },
  { years: "2015 — 2019", degree: "Bachelor's degree", school: "National Institute of Technology Rourkela" },
];

// Rows of the uvm_report_summary card under the skill tree: [severity, id, message].
export const methodologyReport = [
  ["UVM_INFO", "test plan", "feature-based, traceable"],
  ["UVM_INFO", "stimulus", "constrained-random + directed"],
  ["UVM_INFO", "checking", "SVA properties + scoreboards"],
  ["UVM_INFO", "gate level", "GLS · PG-GLS · GLS-SDF"],
  ["UVM_INFO", "power", "UPF-aware scenarios"],
  ["UVM_INFO", "scale", "emulation + automated regressions"],
] as const;
