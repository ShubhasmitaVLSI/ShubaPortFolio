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
  github: "https://github.com/sashikantcodex",
  tagline:
    "IP and SoC verification, timing-aware validation, GLS-SDF, PVT sensor IP, testchip bring-up over JTAG, assertions, coverage closure, emulation support and debug that holds up on silicon.",
};

export const marquee = [
  "SystemVerilog",
  "UVM",
  "SVA",
  "GLS-SDF",
  "PG-GLS",
  "UPF",
  "JTAG",
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
  { value: 4.2, decimals: 1, suffix: "+", label: "Years in design verification", note: "IP · SoC · Testchip" },
  { value: 3, decimals: 0, suffix: "", label: "Testchip projects verified", note: "Integration to gate level" },
  { value: 3, decimals: 0, suffix: "", label: "Gate-level flows handled", note: "GLS · PG-GLS · GLS-SDF" },
  { value: 2, decimals: 0, suffix: "", label: "Emulation modes supported", note: "Full & hybrid sim-emu" },
];

export const pills = [
  "PVT sensor IP",
  "Testchip DV × 3",
  "JTAG bring-up",
  "SDF back-annotation",
  "SVA property checks",
  "UPF / power-aware",
  "ZeBu emulation support",
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
    title: "PVT Sensor IP Verification",
    period: "2023 — Now",
    org: "Synopsys",
    summary:
      "Behavioral-model-based validation, corner-oriented checks, assertions, coverage and timing-aware debug for PVT sensor IP.",
    tags: ["SystemVerilog", "SVA", "Coverage"],
    detail:
      "Verified PVT sensor IP through behavioral-model-based validation, corner-oriented functional checks, assertions, coverage analysis, timing-aware debug and correlation-oriented verification. Supported scalable validation while keeping implementation and program details confidential.",
    bullets: [
      "Behavioral models driven across process, voltage and temperature corners",
      "Model-to-simulation correlation for functional robustness",
      "SVA properties for control, protocol and functional behavior",
      "Functional and code coverage closure against a feature-based plan",
    ],
    layers: ["Behavioral model", "Corner stimulus", "Assertions", "Coverage", "Correlation"],
  },
  {
    id: "02",
    title: "Testchip Verification",
    period: "3 projects",
    org: "Synopsys",
    summary:
      "IP integration, functional and firmware-oriented scenarios, coverage closure, JTAG bring-up and gate-level verification in chip context.",
    tags: ["JTAG", "Firmware tests", "GLS"],
    detail:
      "Contributed to verification across three testchip projects, covering IP integration, functional scenarios, firmware-oriented validation, coverage closure, JTAG-related bring-up and debug, and gate-level verification. Details are generalized to protect confidential program and process information.",
    bullets: [
      "IP integration checks inside the full-chip context",
      "Firmware-oriented scenarios exercised through real access paths",
      "JTAG used for access, control and bring-up debug",
      "Gate-level runs to confirm behavior after synthesis",
    ],
    layers: ["IP integration", "Firmware scenarios", "JTAG access", "Coverage", "Gate level"],
  },
  {
    id: "03",
    title: "GLS-SDF & Timing-Aware Debug",
    period: "2023 — Now",
    org: "Synopsys",
    summary:
      "SDF annotation, timing checks, X-propagation, setup/hold failures and RTL-to-netlist correlation across GLS regressions.",
    tags: ["GLS-SDF", "PG-GLS", "PrimeTime"],
    detail:
      "Handled GLS, power-aware GLS and GLS-SDF regression and debug, including SDF back-annotation, timing-check analysis, X-propagation, setup/hold-related failures, annotation issues, and correlation of functional behavior between RTL and netlist environments.",
    bullets: [
      "SDF back-annotation and annotation-coverage issue debug",
      "Setup/hold timing-check violations traced to root cause",
      "X-propagation analysis across reset and power sequences",
      "RTL vs netlist functional correlation in regression",
    ],
    layers: ["Netlist", "SDF annotate", "Timing checks", "X-prop triage", "RTL correlation"],
  },
  {
    id: "04",
    title: "Emulation Support & SVA",
    period: "2023 — Now",
    org: "Synopsys",
    summary:
      "Behavioral-model enablement for emulation, full and hybrid sim-emu flows, and SVA for earlier, sharper failure detection.",
    tags: ["ZeBu", "Hybrid emu", "SVA"],
    detail:
      "Supported emulation enablement for PVT IP behavioral models and hybrid/full-emulation validation flows. Wrote SystemVerilog Assertions for IP behavior and control/protocol properties to improve observability, catch violations earlier and accelerate debug.",
    bullets: [
      "Made behavioral models compatible with emulation flows",
      "Supported full-emulation and hybrid simulation-emulation validation",
      "Property-based checks for protocol and control behavior",
      "Faster root-cause through assertion-driven observability",
    ],
    layers: ["Model enablement", "Full emulation", "Hybrid sim-emu", "Assertions", "Debug"],
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
      "Automated RTL and GLS regression workflows using Python and Makefiles, created feature-based test plans, supported Liberty-model correlation and validated low-power behavior using UPF concepts.",
    bullets: [
      "Automated RTL and GLS regression launch and reporting",
      "Feature-based test plans with traceability to coverage",
      "Low-power behavior validated with UPF concepts",
      "Liberty-model correlation support",
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
    blurb: "Hands-on verification across IP, testchip and silicon-oriented flows.",
    duties: [
      {
        heading: "Verification",
        items: [
          "Contributed to testchip verification across three projects: IP integration, functional behavior, firmware-oriented scenarios, coverage and gate-level flows in chip context.",
          "Verified PVT sensor IP using behavioral models and corner-oriented validation, with attention to functional robustness and model-to-simulation correlation.",
          "Worked on JTAG-based bring-up and verification, using the interface for access and control paths across verification and silicon-oriented scenarios.",
          "Developed SystemVerilog Assertions for IP-level checking of protocol, control and functional behavior.",
        ],
      },
      {
        heading: "Sign-off & scale",
        items: [
          "Handled GLS, power-aware GLS and GLS-SDF: SDF back-annotation, timing checks, X-propagation, setup/hold debug and annotation issues.",
          "Provided emulation support for PVT IP, enabling behavioral models for full-emulation and hybrid simulation-emulation validation.",
          "Automated RTL/GLS regression workflows with Python and Makefiles; validated low-power behavior with UPF concepts.",
          "Collaborated across design, backend, verification and silicon-facing teams to root-cause functional and timing issues.",
        ],
      },
    ],
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
      "IP / SoC / testchip verification",
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
      "PVT sensor IP validation",
      "Liberty-model validation support",
    ],
  },
  {
    title: "Tools, Protocols & Automation",
    icon: "tools",
    items: [
      "VCS, Verdi, PrimeTime",
      "JTAG, APB, AXI / AXI-Lite",
      "Python, TCL, Makefiles",
      "Regression infrastructure",
      "Waveform debug & failure triage",
      "ZeBu / emulation-flow support",
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
    "Verification architecture for IP, subsystem, SoC and testchip programs",
    "Advanced UVM environments, SVA strategy, coverage and sign-off quality",
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
