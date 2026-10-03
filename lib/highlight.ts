// Lightweight syntax highlighting for code blocks: SystemVerilog/Verilog, Python,
// TCL and shell. Every token is HTML-escaped, so the output stays injection-safe.

type Rule = [cls: string, re: RegExp];
type Lang = { rules: Rule[]; keywords: Set<string>; types: Set<string>; typePrefix?: RegExp };

const words = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

const sv: Lang = {
  rules: [
    ["c", /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y],
    ["s", /"(?:\\.|[^"\\\n])*"?/y],
    ["n", /\d*'[sS]?[bBoOdDhH][0-9a-fA-FxXzZ_?]+|\d+(?:\.\d+)?(?:fs|ps|ns|us|ms|s)\b|\d[\d_]*(?:\.\d+)?/y],
    ["f", /\$[A-Za-z_]\w*/y],
    ["p", /`[A-Za-z_]\w*/y],
  ],
  keywords: words(`module endmodule class endclass function endfunction task endtask begin end if else for foreach
    while do repeat forever case casez casex endcase default always always_ff always_comb always_latch initial final
    assign property endproperty sequence endsequence assert assume cover covergroup endgroup coverpoint bins
    illegal_bins ignore_bins cross constraint solve before rand randc inside dist with virtual pure extends implements
    new return break continue fork join join_any join_none posedge negedge edge disable iff throughout within
    interface endinterface modport package endpackage import export typedef enum struct union packed parameter
    localparam input output inout ref const static automatic local protected this super null void unique unique0
    priority wait wait_order program endprogram clocking endclocking generate endgenerate genvar or and not
    s_eventually eventually nexttime until until_with implies first_match intersect`),
  types: words(`logic bit byte shortint int longint integer real realtime shortreal string reg wire tri time event
    chandle signed unsigned mailbox semaphore process`),
  typePrefix: /^(uvm_|UVM_)/,
};

const py: Lang = {
  rules: [
    ["c", /#[^\n]*/y],
    ["s", /[rbfRBF]{0,2}("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)/y],
    ["n", /0[xX][0-9a-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?/y],
    ["p", /@[A-Za-z_][\w.]*/y],
  ],
  keywords: words(`def class return if elif else for while in not and or is import from as with try except finally
    raise pass break continue lambda yield async await global nonlocal assert del True False None`),
  types: words(`int float str bool list dict set tuple bytes object print len range open enumerate zip map filter
    isinstance super self cls`),
};

const tcl: Lang = {
  rules: [
    ["c", /#[^\n]*/y],
    ["s", /"(?:\\.|[^"\\])*"?/y],
    ["f", /\$\{?[A-Za-z_][\w:]*\}?/y],
    ["n", /\d+(?:\.\d+)?/y],
  ],
  keywords: words(`proc set if elseif else foreach for while return puts expr source lappend lindex llength list
    string incr global upvar catch switch break continue exec file open close gets namespace variable`),
  types: words(``),
};

const sh: Lang = {
  rules: [
    ["c", /#[^\n]*/y],
    ["s", /"(?:\\.|[^"\\])*"?|'[^']*'?/y],
    ["f", /\$\{?[A-Za-z_][\w]*\}?|\$[0-9@#?*]/y],
    ["n", /\b\d+\b/y],
  ],
  keywords: words(`if then else elif fi for while until do done case esac in function return export local source
    echo cd exit set unset`),
  types: words(`make vcs verdi xrun vsim python python3 git grep sed awk`),
};

const LANGS: Record<string, Lang> = {
  sv, systemverilog: sv, verilog: sv, v: sv, svh: sv, uvm: sv, sva: sv,
  py: py, python: py,
  tcl: tcl,
  sh: sh, bash: sh, shell: sh, zsh: sh, console: sh,
};

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

export const canHighlight = (lang: string) => Object.hasOwn(LANGS, lang);

/** Returns escaped HTML with <span class="tok-*"> tokens; unknown languages are just escaped. */
export function highlight(code: string, lang: string): string {
  const l = LANGS[lang];
  if (!l) return esc(code);
  let out = "";
  let plain = "";
  const flush = () => {
    out += esc(plain);
    plain = "";
  };
  const emit = (cls: string, text: string) => {
    flush();
    out += `<span class="tok-${cls}">${esc(text)}</span>`;
  };
  let i = 0;
  scan: while (i < code.length) {
    for (const [cls, re] of l.rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m[0]) {
        emit(cls, m[0]);
        i += m[0].length;
        continue scan;
      }
    }
    const word = /[A-Za-z_]\w*/y;
    word.lastIndex = i;
    const w = word.exec(code);
    if (w) {
      const t = w[0];
      if (l.keywords.has(t)) emit("k", t);
      else if (l.types.has(t) || l.typePrefix?.test(t)) emit("t", t);
      else if (code[i + t.length] === "(") emit("fn", t);
      else plain += t;
      i += t.length;
      continue;
    }
    plain += code[i++];
  }
  flush();
  return out;
}
