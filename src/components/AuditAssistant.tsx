import { useRef, useState } from "react";
import { Sparkles, Send, Square } from "lucide-react";
import type { IncoData } from "@/lib/use-inco";
import { DISCLOSURE } from "@/lib/disclosure";
import { describeVerifier } from "@/lib/verifiers";
import { Btn } from "./ui-kit";
import { inputCls } from "./controls";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string; error?: boolean };

const SUGGESTIONS = [
  "Summarize activity in the last 24 hours",
  "Which auditors decrypted the most handles?",
  "Flag anything unusual about voucher usage",
  "Were any vouchers revoked shortly after being used?",
];

function buildContext(data: IncoData, events: IncoData["log"]) {
  const label = (h?: string) => (h ? data.handles.find((x) => x.handle === h)?.label ?? h.slice(0, 10) : undefined);
  return {
    now: new Date().toISOString(),
    handles: data.handles.map((h) => ({ label: h.label, category: h.category })),
    vouchers: data.vouchers.map((v) => ({
      id: v.id,
      auditor: v.auditor,
      status: v.status,
      disclosure: DISCLOSURE[v.disclosure].title,
      verifiers: v.verifiers.map((x) => `${x.type}: ${describeVerifier(x)}`),
      handles: v.handles.map(label),
      issued: new Date(v.createdAt).toISOString(),
      expires: new Date(v.expiresAt).toISOString(),
      revoked: v.revokedAt ? new Date(v.revokedAt).toISOString() : null,
    })),
    events: events.slice(0, 300).map((e) => ({ t: new Date(e.timestamp).toISOString(), event: e.action, voucher: e.voucherId, actor: e.actor, handle: label(e.handle) })),
  };
}

export function AuditAssistant({ data, events }: { data: IncoData; events: IncoData["log"] }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    const history = msgs.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
    setMsgs((m) => [...m, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setQ("");
    setBusy(true);
    const ac = new AbortController();
    abort.current = ac;
    const patch = (fn: (m: Msg) => Msg) => setMsgs((all) => [...all.slice(0, -1), fn(all[all.length - 1]!)]);
    try {
      const res = await fetch("/api/audit-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history, context: buildContext(data, events) }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        patch((m) => ({ ...m, content: j.error ?? "The assistant couldn't answer right now.", error: true }));
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const l of lines) {
          if (!l.trim()) continue;
          const ev = JSON.parse(l);
          if (ev.type === "text") patch((m) => ({ ...m, content: m.content + ev.delta }));
          if (ev.type === "error") patch((m) => ({ ...m, content: m.content ? `${m.content}\n\n${ev.message}` : ev.message, error: !m.content }));
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") patch((m) => ({ ...m, content: m.content ? `${m.content}\n\n[stopped]` : "[stopped]" }));
      else patch((m) => ({ ...m, content: "Connection lost. Try again.", error: true }));
    } finally {
      setBusy(false);
      abort.current = null;
    }
  };

  return (
    <div className="flex flex-col">
      <div className="max-h-[560px] min-h-[260px] space-y-4 overflow-y-auto px-4 py-4">
        {!msgs.length && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-muted-foreground"><Sparkles className="size-3.5" /> Ask about voucher activity. Only metadata is shared, never encrypted values.</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)} className="border border-border-strong px-2.5 py-1 text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground">{s}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={cn("fade-in", m.role === "user" ? "flex justify-end" : "")}>
            {m.role === "user" ? (
              <p className="max-w-[80%] border border-border-strong bg-background px-3 py-2">{m.content}</p>
            ) : (
              <div className={cn("border-l-2 pl-3 whitespace-pre-wrap leading-relaxed", m.error ? "border-destructive text-destructive" : "border-foreground")}>
                {m.content || <span className="font-mono text-[11px] text-muted-foreground">analyzing events…</span>}
              </div>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2 border-t border-border px-4 py-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about audit events…" aria-label="Question" className={cn(inputCls, "h-9")} maxLength={1000} />
        {busy ? (
          <Btn type="button" onClick={() => abort.current?.abort()}><Square className="size-3.5" /> Stop</Btn>
        ) : (
          <Btn type="submit" variant="solid" disabled={!q.trim()}><Send className="size-3.5" /> Ask</Btn>
        )}
      </form>
    </div>
  );
}
