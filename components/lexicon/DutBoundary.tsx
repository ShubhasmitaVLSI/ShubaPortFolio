"use client";

import { useState } from "react";
import type { LexiconEntry } from "@/lib/lexicon";

type Diagram = LexiconEntry["architecture"]["diagram"];
type Focus = "" | "dut" | "tb";

function Wire({ dir, ports }: { dir: "in" | "out"; ports: string[] }) {
  return (
    <div className={`bd-wire ${dir}`} aria-hidden="true">
      <span className="bd-line" />
      <i />
      <i />
      <i />
      <ul className="bd-ports">
        {ports.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The verification boundary as a picture: the testbench wraps the DUT, stimulus
 * flows in through the ports and responses flow out to the checkers. The switch
 * swaps the same DUT between its RTL and gate-level forms.
 */
export function DutBoundary({ d }: { d: Diagram }) {
  const [mode, setMode] = useState<"rtl" | "gls">("rtl");
  const [focus, setFocus] = useState<Focus>("");
  const blocks = mode === "rtl" ? d.rtl : d.gls;
  const hover = (f: Focus) => ({
    onMouseEnter: () => setFocus(f),
    onMouseLeave: () => setFocus(""),
    onFocus: () => setFocus(f),
    onBlur: () => setFocus(""),
  });

  return (
    <figure className="boundary" data-mode={mode} data-focus={focus || undefined}>
      <div className="bd-toolbar">
        <div className="segmented" role="group" aria-label="DUT abstraction">
          <button type="button" aria-pressed={mode === "rtl"} onClick={() => setMode("rtl")}>
            RTL DUT
          </button>
          <button type="button" aria-pressed={mode === "gls"} onClick={() => setMode("gls")}>
            Gate-level DUT
          </button>
        </div>
        <div className="bd-legend">
          <button type="button" className="bd-key dut" {...hover("dut")}>
            Inside DUT
          </button>
          <button type="button" className="bd-key tb" {...hover("tb")}>
            Testbench
          </button>
        </div>
      </div>

      <div className="bd-env">
        <span className="bd-env-label">Verification environment</span>
        <div className="bd-stage">
          <div className="bd-group tb">
            <p className="bd-title">Stimulus</p>
            {d.stimulus.map((s) => (
              <span className="bd-pill" key={s}>
                {s}
              </span>
            ))}
          </div>

          <Wire dir="in" ports={d.inputs} />

          <div className="bd-dut">
            <p className="bd-dut-head">
              <span>DUT</span>
              <code>{d.dut}</code>
            </p>
            {/* Keyed on mode so the blocks re-enter one after another on every switch. */}
            <ul className="bd-blocks" key={mode}>
              {blocks.map((b, i) => (
                <li key={b} style={{ "--i": i } as React.CSSProperties}>
                  {b}
                </li>
              ))}
            </ul>
            <p className="bd-dut-foot">{mode === "rtl" ? "Behavioral / structural RTL · zero-delay" : "Standard-cell netlist · SDF-annotated delays"}</p>
          </div>

          <Wire dir="out" ports={d.outputs} />

          <div className="bd-group tb">
            <p className="bd-title">Checking</p>
            {d.checking.map((s) => (
              <span className="bd-pill" key={s}>
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="bd-group tb bd-control">
          <p className="bd-title">Closure</p>
          {d.control.map((s) => (
            <span className="bd-pill" key={s}>
              {s}
            </span>
          ))}
        </div>
      </div>
      <figcaption>
        {mode === "rtl"
          ? "The testbench drives and checks the DUT only through its ports."
          : "Same ports, same testbench: only the implementation inside the boundary changed. Cell names are illustrative."}
      </figcaption>
    </figure>
  );
}
