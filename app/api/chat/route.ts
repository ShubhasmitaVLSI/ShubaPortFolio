import { createGoogle } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  streamText,
  type LanguageModel,
  type UIMessage,
  type UIMessageStreamWriter,
} from "ai";
import { buildSystemPrompt, localAnswer, profileAnswer, sectionContexts } from "@/lib/chat-knowledge";

// Free-tier models via the Vercel AI SDK. Set GEMINI_API_KEY and/or GROQ_API_KEY;
// CHAT_MODEL overrides the first Gemini model. Later models are tried when an
// earlier one fails. With no key, answers come from lib/chat-knowledge.ts.
type Candidate = { model: LanguageModel };

export const maxDuration = 60;

function candidates(): Candidate[] {
  const list: Candidate[] = [];
  if (process.env.GEMINI_API_KEY) {
    const google = createGoogle({ apiKey: process.env.GEMINI_API_KEY });
    const ids = [process.env.CHAT_MODEL, "gemini-flash-latest", "gemini-flash-lite-latest"].filter(Boolean) as string[];
    for (const id of new Set(ids)) list.push({ model: google(id) });
  }
  if (process.env.GROQ_API_KEY) {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    list.push({ model: groq("llama-3.3-70b-versatile") }, { model: groq("llama-3.1-8b-instant") });
  }
  return list;
}

const MAX_TURNS = 12;
const MAX_CHARS = 600;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hits = new Map<string, number[]>();

// Best-effort per-instance limit so one visitor cannot drain the free quota.
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

const textOf = (m: UIMessage) =>
  m.parts.map((p) => (p?.type === "text" && typeof p.text === "string" ? p.text : "")).join("");

// Keep only recent plain-text turns, trimmed, so visitors cannot inflate the prompt.
function clean(body: unknown): UIMessage[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw)) return null;
  const messages = raw
    .filter((m): m is UIMessage => (m?.role === "user" || m?.role === "assistant") && Array.isArray(m?.parts))
    .map((m) => ({
      id: String(m.id ?? generateId()),
      role: m.role,
      parts: [{ type: "text" as const, text: textOf(m).slice(0, MAX_CHARS) }],
    }))
    .filter((m) => m.parts[0].text.trim() !== "")
    .slice(-MAX_TURNS);
  return messages.at(-1)?.role === "user" ? messages : null;
}

function say(writer: UIMessageStreamWriter, text: string) {
  const id = generateId();
  writer.write({ type: "text-start", id });
  writer.write({ type: "text-delta", id, delta: text });
  writer.write({ type: "text-end", id });
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const messages = clean(body);
  if (!messages) return new Response("Bad request", { status: 400 });
  const question = textOf(messages.at(-1)!);
  // Only known section ids reach the prompt, so the field cannot inject text.
  const section = (body as { section?: unknown }).section;
  const system = buildSystemPrompt(
    typeof section === "string" && Object.hasOwn(sectionContexts, section) ? section : undefined
  );
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const direct = profileAnswer(question);
      if (direct) return say(writer, direct);
      if (limited(ip)) return say(writer, "You're asking quickly. Give it a few seconds and try again.");
      const modelMessages = await convertToModelMessages(messages);
      const deadline = AbortSignal.timeout(50_000);
      for (const { model } of candidates()) {
        if (deadline.aborted || request.signal.aborted) break;
        const id = generateId();
        let sent = false;
        try {
          const result = streamText({
            model,
            system,
            messages: modelMessages,
            temperature: 0.3,
            maxOutputTokens: 900,
            maxRetries: 0,
            abortSignal: AbortSignal.any([request.signal, deadline]),
            onError: () => {},
          });
          for await (const part of result.fullStream) {
            if (part.type === "error") throw part.error instanceof Error ? part.error : new Error(String(part.error));
            if (part.type !== "text-delta" || !part.text) continue;
            if (!sent) writer.write({ type: "text-start", id });
            sent = true;
            writer.write({ type: "text-delta", id, delta: part.text });
          }
        } catch (error) {
          console.error("chat model failed", error instanceof Error ? error.name : "UnknownError");
          if (sent) writer.write({ type: "text-delta", id, delta: "…\n\nThe connection dropped. Please ask again." });
        }
        if (sent) return writer.write({ type: "text-end", id });
        if (request.signal.aborted) return;
      }
      // No key configured, or every model failed: answer from the portfolio data.
      say(writer, localAnswer(question));
    },
    onError: () => "Something went wrong. Please try again.",
  });

  return createUIMessageStreamResponse({ stream, headers: { "Cache-Control": "no-store" } });
}
