import { aiUses } from "@/lib/data";

export default function AiUses() {
  return (
    <>
      <div className="ai-grid stagger">
        {aiUses.map((u, i) => (
          <article className="ai-card spot" key={u.title}>
            <span className="ai-idx">{String(i + 1).padStart(2, "0")}</span>
            <h3>{u.title}</h3>
            <p>{u.body}</p>
          </article>
        ))}
      </div>
      <p className="ai-learning">
        <span className="live" /> Learning now: Generative AI fundamentals · Python for AI · RAG · Agentic AI ·
        LangChain · practical LLM workflows
      </p>
    </>
  );
}
