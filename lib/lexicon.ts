// DV Lexicon: long-form guides to verification terms. Every entry follows the same
// eight-part template (definition, architecture, RTL vs GLS, scenario, code,
// interview, knowledge check, takeaways), so each part gets its own layout.

export type LexiconLink = { label: string; href?: string };

export type QuizQuestion = { q: string; options: string[]; answer: number; why: string };

export type LexiconEntry = {
  slug: string;
  term: string;
  full: string;
  track: string;
  level: string;
  minutes: string;
  summary: string;
  definition: { text: string; distinction: string };
  architecture: {
    intro: string;
    /** [inside the DUT, outside the DUT] */
    rows: [string, string][];
    diagram: {
      dut: string;
      inputs: string[];
      outputs: string[];
      rtl: string[];
      gls: string[];
      stimulus: string[];
      checking: string[];
      control: string[];
    };
  };
  comparison: { rows: [string, string, string][]; important: string };
  scenario: { requirement: string; symptom: string; checks: string[]; workflow: string[]; wave: string };
  code: { lang: string; source: string; assumptions: string };
  interview: { q: string; a: string }[];
  quiz: QuizQuestion[];
  mistakes: string[];
  remember: string;
  related: LexiconLink[];
  further: { label: string; href: string; note: string }[];
};

/** The template's sections, in order; ids double as in-page anchors. */
export const SECTIONS = [
  { id: "definition", label: "Quick definition" },
  { id: "architecture", label: "Architecture context" },
  { id: "rtl-vs-gls", label: "RTL vs GLS" },
  { id: "scenario", label: "Real-world scenario" },
  { id: "code", label: "Code snippet" },
  { id: "interview", label: "Interview preparation" },
  { id: "knowledge-check", label: "Knowledge check" },
  { id: "takeaways", label: "Mistakes & takeaways" },
] as const;

const FIFO = "/blog/verifying-a-synchronous-fifo";
const GLS1 = "/blog/gls-foundations-part-1-netlists-cells-liberty";
const GLS2 = "/blog/gls-foundations-part-2-sdc-sta-testbench";

export const LEXICON: LexiconEntry[] = [
  {
    slug: "dut",
    term: "DUT",
    full: "Design Under Test",
    track: "Fundamentals",
    level: "Intermediate",
    minutes: "6–8",
    summary:
      "A practical guide to what the DUT is, how its verification boundary changes from RTL to gate-level simulation, and how to test your understanding.",
    definition: {
      text: "The Design Under Test (DUT) is the hardware implementation being verified. It may be a module, IP block, subsystem, or entire SoC. The testbench stimulates the DUT through its interfaces, observes responses, and checks them against the specification.",
      distinction:
        "The DUT is what you verify; the testbench is how you verify it. A DUT is not inherently “RTL only”: the implementation can be RTL, a synthesized netlist, or another simulation model.",
    },
    architecture: {
      intro:
        "Consider a synchronous FIFO with clk, rst_n, wr_en, rd_en, wr_data, rd_data, full, and empty. The DUT implements storage, read/write control, and status generation. The testbench generates transactions, monitors accepted operations, maintains a queue-based reference model, and checks output ordering and flags.",
      rows: [
        ["Storage array, pointers, status flags", "Clock/reset generation, driver, monitor"],
        ["Control logic and output datapath", "Reference model, scoreboard, coverage"],
        ["Synthesized cells in GLS", "Assertions, protocol checks, regression control"],
      ],
      diagram: {
        dut: "fifo #(WIDTH=8, DEPTH=16)",
        inputs: ["clk", "rst_n", "wr_en", "rd_en", "wr_data[7:0]"],
        outputs: ["rd_data[7:0]", "full", "empty"],
        rtl: ["Storage array", "Write pointer", "Read pointer", "Status flags", "Control logic", "Output datapath"],
        gls: ["dfxtp × 128 · storage", "dfrtp · write pointer", "dfrtp · read pointer", "a21oi · nor2 · flags", "nand2 · xor2 · control", "mux4 × 8 · read path"],
        stimulus: ["Clock / reset gen", "Driver"],
        checking: ["Monitor", "Reference model", "Scoreboard"],
        control: ["Coverage", "Assertions", "Regression"],
      },
    },
    comparison: {
      rows: [
        ["Implementation", "Behavioral/structural RTL", "Mapped standard-cell netlist"],
        ["Timing", "Usually zero-delay functional model", "Cell/interconnect delays may be SDF-annotated"],
        [
          "Unknown values",
          "X from uninitialized/unknown logic; RTL semantics can mask uncertainty",
          "X from initialization, cell models, and timing-check notifiers",
        ],
        ["Typical objective", "Functional correctness, protocol, coverage", "Post-synthesis behavior, initialization, reset and timing-sensitive effects"],
        ["Testbench impact", "Transaction checks, functional assertions", "Adjust timing/sampling, reset sequencing, X handling and timeouts"],
      ],
      important:
        "GLS is not a replacement for static timing analysis. Timing-aware GLS complements STA and functional verification; the specific scope depends on project methodology.",
    },
    scenario: {
      requirement: "After reset, the FIFO must report empty = 1 and full = 0.",
      symptom: "A directed reset test passes on RTL, but GLS reports X on empty for several cycles.",
      checks: [
        "Reset release timing",
        "Synchronizer behavior (if the reset is asynchronous)",
        "Cell initialization",
        "Timing violations",
        "Whether the monitor samples before the status becomes valid",
      ],
      workflow: [
        "Reproduce the seed",
        "Identify the first divergence",
        "Inspect reset and timing-check logs",
        "Trace X to its first source",
        "DUT defect or testbench sampling issue?",
        "Add a targeted regression and checker",
      ],
      wave: [
        "# Illustrative: RTL reports empty at once, while GLS shows X on empty for a few cycles after reset release",
        "clk         : p.........",
        "rst_n       : 0..1......",
        "empty (RTL) : 1.........",
        "empty (GLS) : x.....1...",
        "full        : 0.........",
      ].join("\n"),
    },
    code: {
      lang: "sv",
      source: `module fifo_tb;
  logic clk = 0, rst_n = 0;
  logic wr_en = 0, rd_en = 0;
  logic [7:0] wr_data = '0;
  logic [7:0] rd_data;
  logic full, empty;

  always #5 clk = ~clk;

  fifo #(.WIDTH(8), .DEPTH(16)) dut (
    .clk(clk), .rst_n(rst_n),
    .wr_en(wr_en), .rd_en(rd_en),
    .wr_data(wr_data), .rd_data(rd_data),
    .full(full), .empty(empty)
  );

  initial begin
    repeat (3) @(negedge clk);
    rst_n = 1;
  end

  // Check at the next sampled clock after reset release.
  a_reset_status: assert property (
    @(posedge clk) $rose(rst_n) |-> (empty === 1'b1 && full === 1'b0)
  ) else $error("FIFO status invalid after reset release");
endmodule`,
      assumptions:
        "Illustrative synchronous FIFO with active-low reset; status must be valid at the first clock sampled after reset deassertion. Adapt the assertion to the actual reset contract and output latency. In GLS, avoid releasing reset too close to the active clock edge.",
    },
    interview: [
      {
        q: "What defines the DUT boundary in a UVM environment?",
        a: "The chosen hardware block and its observable interfaces. Drivers stimulate the boundary; monitors, assertions and scoreboards check externally specified behavior.",
      },
      {
        q: "Does the testbench change when moving from RTL to GLS?",
        a: "The core functional intent often stays the same, but timing, reset sequencing, SDF setup, sampling strategy, X diagnosis, and simulation timeouts may need changes.",
      },
      {
        q: "Should a scoreboard use internal DUT pointers?",
        a: "Generally avoid coupling expected behavior to implementation details. Prefer accepted transactions and architectural rules; use internal signals selectively for assertions or diagnosis.",
      },
    ],
    quiz: [
      {
        q: "Which item is part of the DUT?",
        options: ["Scoreboard", "FIFO read pointer", "UVM driver", "Coverage collector"],
        answer: 1,
        why: "The read pointer is part of the FIFO implementation.",
      },
      {
        q: "RTL reset test passes, but GLS status is X. What is the best first action?",
        options: ["Waive it", "Increase random seeds", "Trace first X and inspect reset/timing", "Remove the checker"],
        answer: 2,
        why: "Diagnose the earliest source and check the reset/timing contract before changing stimulus.",
      },
      {
        q: "What should an independent FIFO reference model primarily track?",
        options: ["DUT internal pointer encoding", "Accepted writes and reads", "Gate delays", "Cell library names"],
        answer: 1,
        why: "Model specified FIFO ordering independently of internal implementation.",
      },
      {
        q: "True or false: GLS with SDF makes STA unnecessary.",
        options: ["True", "False"],
        answer: 1,
        why: "STA and GLS address different, complementary verification needs.",
      },
    ],
    mistakes: [
      "Confusing DUT with the entire simulation environment.",
      "Assuming a passing RTL test automatically validates gate-level timing or initialization.",
      "Checking an output before the specification says it is valid.",
      "Using internal implementation details as the only source of expected behavior.",
    ],
    remember:
      "DUT = the implementation under verification. Verification quality depends on a clear boundary, a trustworthy expected-behavior model, meaningful checks, and awareness of the simulation abstraction.",
    related: [
      { label: "Testbench", href: `${GLS2}#04-getting-your-testbench-ready-for-gls` },
      { label: "Reference Model", href: `${FIFO}#a-reference-model-in-the-scoreboard` },
      { label: "Scoreboard", href: `${FIFO}#a-reference-model-in-the-scoreboard` },
      { label: "GLS", href: GLS1 },
      { label: "Reset Verification" },
      { label: "X-Propagation", href: `${GLS1}#how-a-timing-violation-becomes-an-x` },
    ],
    further: [
      { label: "Verifying a Synchronous FIFO", href: FIFO, note: "The same FIFO, verified on RTL with a scoreboard, assertions and coverage." },
      { label: "GLS Foundations, Part 1", href: GLS1, note: "What the gate-level DUT is made of, and how timing violations become X." },
    ],
  },
];

export const getEntry = (slug: string) => LEXICON.find((e) => e.slug === slug) ?? null;
