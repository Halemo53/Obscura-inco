import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "./run-id.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const INSTRUCTIONS = `You are the audit assistant inside Obscura, a confidential compliance tool built on Inco.
You answer questions from auditors and compliance officers about voucher (delegated decryption) activity.
You only ever see metadata: timestamps, event types (created, used, expired, revoked), voucher ids, actor addresses, handle labels, disclosure modes and verifier rules. You never see encrypted values — never speculate about amounts.

Answer in plain text (no markdown tables, no bold). Use this structure:
Summary
<2-4 sentences directly answering the question, citing counts and time ranges>

Flags
- <noteworthy pattern, with voucher ids / short addresses as evidence>
(write "- None observed" if nothing stands out)

Patterns worth flagging include: bursts of decryptions in a short window, use outside a voucher's time-window verifier, one auditor touching many handles, full-decryption vouchers on sensitive handles, revocations right after use, vouchers used close to expiry, activity from actors not listed as auditors.
Be concise and factual. If the data cannot answer the question, say so.`;

type Body = { question: string; history: { role: "user" | "assistant"; content: string }[]; context: unknown };

const enc = new TextEncoder();
const line = (o: unknown) => enc.encode(JSON.stringify(o) + "\n");

export async function handleAuditAssistant(request: Request): Promise<Response> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return Response.json({ error: "AI is not configured for this app." }, { status: 500 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const question = String(body.question ?? "").trim().slice(0, 1000);
  if (!question) return Response.json({ error: "Ask a question first." }, { status: 400 });
  const ctx = JSON.stringify(body.context ?? {});
  if (ctx.length > 120_000) return Response.json({ error: "Too much audit data to analyze at once." }, { status: 413 });
  const history = (Array.isArray(body.history) ? body.history : [])
    .slice(-8)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  const messages: ModelMessage[] = [
    { role: "user", content: `Audit metadata (JSON):\n${ctx}` },
    { role: "assistant", content: "Understood. I have the audit metadata." },
    ...history,
    { role: "user", content: question },
  ];

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    instructions: INSTRUCTIONS,
    messages,
    abortSignal: request.signal,
    maxRetries: 0,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let got = false;
      try {
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            got = true;
            controller.enqueue(line({ type: "text", delta: (part as any).text ?? (part as any).delta ?? "" }));
          } else if (part.type === "error") {
            controller.enqueue(line({ type: "error", message: friendly(part.error) }));
            controller.close();
            return;
          }
        }
        const finish = await result.finishReason;
        if (!got) controller.enqueue(line({ type: "error", message: finish === "content-filter" ? "The request was declined." : "No answer was produced." }));
        controller.enqueue(line({ type: "done" }));
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") controller.enqueue(line({ type: "error", message: friendly(e) }));
      }
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache, no-transform" } });
}

function friendly(e: unknown): string {
  const status = (e as any)?.statusCode ?? (e as any)?.status;
  if (status === 402) return "AI credits are used up for this workspace. Add credits to keep using the assistant.";
  if (status === 429) return "The assistant is busy. Try again in a moment.";
  if (status === 403) return (e as any)?.message ?? "Access to the AI model was denied.";
  console.error("audit assistant error", e);
  return "The assistant couldn't answer right now.";
}
