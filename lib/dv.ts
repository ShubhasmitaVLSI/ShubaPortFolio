// Design-verification vocabulary used across the page: UVM phases per
// section, a glossary, and the UVM constructs marquee.

/** Each section is tagged with a UVM phase, in real UVM phase order. */
export const phases = [
  { id: "top", phase: "build_phase", label: "Intro" },
  { id: "impact", phase: "connect_phase", label: "Verification summary" },
  { id: "about", phase: "end_of_elaboration", label: "Profile" },
  { id: "work", phase: "start_of_simulation", label: "Case files" },
  { id: "schema", phase: "reset_phase", label: "Career schema" },
  { id: "experience", phase: "configure_phase", label: "Timeline" },
  { id: "stack", phase: "main_phase", label: "Skill hierarchy" },
  { id: "approach", phase: "shutdown_phase", label: "Approach" },
  { id: "glossary", phase: "extract_phase", label: "Glossary" },
  { id: "ai", phase: "check_phase", label: "AI for VLSI" },
  { id: "roadmap", phase: "report_phase", label: "Roadmap" },
  { id: "contact", phase: "final_phase", label: "Contact" },
] as const;

export const phaseOf = (id: string) => phases.find((p) => p.id === id)?.phase ?? "";

/** UVM / SystemVerilog constructs used day to day in testbench work. */
export const uvmTerms = [
  "uvm_sequence",
  "uvm_driver",
  "uvm_monitor",
  "uvm_scoreboard",
  "uvm_agent",
  "covergroup",
  "coverpoint",
  "cross coverage",
  "assert property",
  "constraint solver",
  "randomize()",
  "TLM ports",
  "$setuphold",
  "sdf_annotate",
  "power domains",
  "TAP controller",
  "APB / AXI checks",
  "regression triage",
];

export type Term = { term: string; full: string; kind: string; def: string; use: string };

export const glossary: Term[] = [
  {
    term: "GLS-SDF",
    full: "Gate-level sim + Standard Delay Format",
    kind: "Gate level",
    def: "Simulating the synthesized netlist with real cell and interconnect delays back-annotated from SDF, so timing checks run in simulation.",
    use: "SDF-annotated timing simulation and setup/hold debug.",
  },
  {
    term: "X-prop",
    full: "X-propagation",
    kind: "Gate level",
    def: "How unknown (X) values spread through logic. Analysing it catches reset and power-up issues that optimistic RTL simulation can hide.",
    use: "Tracing X sources across reset and power sequences.",
  },
  {
    term: "SVA",
    full: "SystemVerilog Assertions",
    kind: "Checking",
    def: "Temporal properties evaluated every cycle, flagging protocol or control violations at the moment they happen.",
    use: "IP-level protocol, control and functional properties.",
  },
  {
    term: "UVM",
    full: "Universal Verification Methodology",
    kind: "Methodology",
    def: "A SystemVerilog class library for reusable testbenches built from agents, sequences, drivers, monitors and scoreboards.",
    use: "IP and SoC-level verification environments.",
  },
  {
    term: "Coverage",
    full: "Functional + code coverage closure",
    kind: "Methodology",
    def: "Measuring which features, corners and code were exercised, then closing the gaps until the verification plan is met.",
    use: "Feature-based plans traced to coverage.",
  },
  {
    term: "PVT",
    full: "Process · Voltage · Temperature",
    kind: "Silicon",
    def: "The operating extremes a chip must survive, checked as process, voltage and temperature corners.",
    use: "Corner-aware functional checks.",
  },
  {
    term: "FIFO",
    full: "First-in, first-out buffer",
    kind: "Design",
    def: "A queue that returns data in arrival order, used to absorb rate mismatches or cross clock domains; full, empty, overflow and underflow are the classic corner cases.",
    use: "FIFO ordering, full/empty and overflow/underflow checks.",
  },
  {
    term: "UPF",
    full: "Unified Power Format",
    kind: "Low power",
    def: "Describes power domains, isolation, retention and supply states so power-aware simulation can check low-power behavior.",
    use: "Power-aware GLS and low-power scenarios.",
  },
  {
    term: "Emulation",
    full: "Hardware-accelerated verification",
    kind: "Scale",
    def: "Running the design on emulation hardware for far faster execution than simulation; hybrid flows pair a simulator with the emulator.",
    use: "Hardware-emulation-based verification and debug.",
  },
  {
    term: "CRV",
    full: "Constrained-random verification",
    kind: "Methodology",
    def: "Random stimulus bounded by constraints, reaching corner cases that hand-written directed tests tend to miss.",
    use: "Stimulus generation with coverage feedback.",
  },
  {
    term: "Setup / Hold",
    full: "Timing checks around a clock edge",
    kind: "Gate level",
    def: "Data must be stable for a window before (setup) and after (hold) the clock edge; SDF simulations report violations of either.",
    use: "Timing-check debug in SDF-annotated GLS.",
  },
  {
    term: "Scoreboard",
    full: "Reference-model checker",
    kind: "Checking",
    def: "A testbench component that compares DUT outputs against expected results and flags every mismatch.",
    use: "End-to-end checking alongside assertions.",
  },
];

export const seoKeywords = [
  "Design Verification Engineer",
  "ASIC verification",
  "SoC verification",
  "IP verification",
  "SystemVerilog",
  "UVM",
  "SVA",
  "Assertion-based verification",
  "Functional coverage",
  "Coverage closure",
  "Constrained-random verification",
  "Gate-level simulation",
  "GLS-SDF",
  "SDF back-annotation",
  "X-propagation",
  "UPF",
  "Power-aware verification",
  "FIFO verification",
  "AMBA APB AXI",
  "Emulation",
  "ZeBu",
  "VCS",
  "Verdi",
  "PrimeTime",
  "Python automation",
  "Synopsys",
  "Bengaluru",
];
