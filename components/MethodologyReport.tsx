import { methodologyReport } from "@/lib/data";

/** The methodology summary, styled as a clean uvm_report_summary. */
export default function MethodologyReport() {
  return (
    <div className="report" data-reveal>
      <div className="terminal-bar">
        <i className="dot r" />
        <i className="dot y" />
        <i className="dot g" />
        <span>uvm_report_summary — methodology</span>
      </div>
      <div className="report-body">
        {methodologyReport.map(([sev, id, msg], i) => (
          <div className="report-row" key={id} style={{ animationDelay: `${i * 120}ms` }}>
            <span className="sev">{sev}</span>
            <span className="rid">[{id}]</span>
            <span className="msg">{msg}</span>
            <span className="bar">
              <i style={{ animationDelay: `${300 + i * 140}ms` }} />
            </span>
          </div>
        ))}
        <div className="report-foot">
          <span>
            UVM_WARNING : <b>0</b>
          </span>
          <span>
            UVM_ERROR : <b>0</b>
          </span>
          <span>
            UVM_FATAL : <b>0</b>
          </span>
        </div>
      </div>
    </div>
  );
}
