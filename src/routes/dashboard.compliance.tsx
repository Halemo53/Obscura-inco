import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GripVertical, Eye, EyeOff, FileText, Download, ShieldCheck } from "lucide-react";
import { HOLDERS, DEFAULT_RULES, REPORT_HISTORY, REPORT_SECTIONS, generateReport, type HolderStatus, type Report, type ReportSection, type TransferRule } from "@/lib/compliance";
import { COUNTRIES } from "@/lib/verifiers";
import { downloadBlob } from "@/hooks/useAuditStream";
import { EvmOnly } from "@/components/EvmOnly";
import { Btn, Section, th, td } from "@/components/ui-kit";
import { MultiSelect, Toggle, inputCls } from "@/components/controls";
import { fmtTime, short } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/compliance")({
  head: () => ({
    meta: [
      { title: "ERC-3643 compliance — Obscura" },
      { name: "description", content: "Holder verification, confidential transfer rules and regulatory reports." },
      { property: "og:title", content: "ERC-3643 compliance — Obscura" },
      { property: "og:description", content: "Holder verification, confidential transfer rules and regulatory reports." },
    ],
  }),
  component: () => (
    <EvmOnly>
      <Compliance />
    </EvmOnly>
  ),
});

const statusCls: Record<HolderStatus, string> = {
  verified: "text-success border-success/30",
  pending: "text-warning border-warning/30",
  rejected: "text-destructive border-destructive/30",
};

function HolderBadge({ s }: { s: HolderStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wider", statusCls[s])}>
      <span className="size-1.5 rounded-full bg-current" />{s}
    </span>
  );
}

function Holders() {
  const [holders, setHolders] = useState(HOLDERS);
  const recheck = (a: string) => setHolders((hs) => hs.map((h) => (h.address === a ? { ...h, lastCheck: Date.now(), status: h.status === "rejected" ? "pending" : h.status } : h)));
  const counts = { verified: holders.filter((h) => h.status === "verified").length, pending: holders.filter((h) => h.status === "pending").length };
  return (
    <Section title="Token holder verification" meta={`${counts.verified} verified · ${counts.pending} pending · ${holders.length} total`}>
      <table className="w-full">
        <thead>
          <tr>
            <th className={th}>Address</th><th className={th}>Entity</th><th className={th}>Status</th><th className={th}>Jurisdiction</th><th className={th}>Last check</th><th className={`${th} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {holders.map((h) => (
            <tr key={h.address} className="hover:bg-accent">
              <td className={`${td} font-mono text-[11.5px]`} title={h.address}>{short(h.address, 8, 6)}</td>
              <td className={td}>{h.entity}</td>
              <td className={td}><HolderBadge s={h.status} /></td>
              <td className={`${td} font-mono text-[11.5px]`}>{h.jurisdiction}</td>
              <td className={`${td} font-mono text-[11px] text-muted-foreground`}>{fmtTime(h.lastCheck)}</td>
              <td className={`${td} text-right`}><Btn size="sm" onClick={() => recheck(h.address)}>Re-check</Btn></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

const RULE_TITLE: Record<TransferRule["id"], string> = {
  "verified-only": "Only verified holders can receive",
  "max-amount": "Max transfer amount",
  blackout: "Transfers blocked during",
  jurisdictions: "Jurisdiction whitelist",
};

function RuleBody({ r, set }: { r: TransferRule; set: (r: TransferRule) => void }) {
  const [reveal, setReveal] = useState(false);
  switch (r.id) {
    case "verified-only":
      return <p className="text-[11.5px] text-muted-foreground">Receiver identity must be registered in the ONCHAINID registry.</p>;
    case "max-amount":
      return (
        <div className="flex max-w-xs items-center gap-1.5">
          {reveal ? (
            <input type="number" value={r.amount} onChange={(e) => set({ ...r, amount: Number(e.target.value) })} className={cn(inputCls, "font-mono")} />
          ) : (
            <span className={cn(inputCls, "flex items-center font-mono tracking-[0.3em] text-muted-foreground")}>•••</span>
          )}
          <Btn type="button" aria-label={reveal ? "Hide amount" : "Reveal amount"} onClick={() => setReveal(!reveal)}>{reveal ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}</Btn>
        </div>
      );
    case "blackout":
      return (
        <div className="flex items-center gap-2">
          <input type="date" value={r.from} onChange={(e) => set({ ...r, from: e.target.value })} className={cn(inputCls, "w-40 font-mono")} />
          <span className="text-muted-foreground">to</span>
          <input type="date" value={r.to} min={r.from} onChange={(e) => set({ ...r, to: e.target.value })} className={cn(inputCls, "w-40 font-mono")} />
        </div>
      );
    case "jurisdictions":
      return (
        <div className="max-w-md">
          <MultiSelect placeholder="Select jurisdictions" value={r.countries} onChange={(countries) => set({ ...r, countries })} options={COUNTRIES.map((c) => ({ value: c.code, label: c.name, prefix: c.flag }))} />
        </div>
      );
  }
}

function Rules() {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const update = (r: TransferRule) => setRules((rs) => rs.map((x) => (x.id === r.id ? r : x)));
  const drop = (to: number) => {
    if (drag === null || drag === to) return;
    setRules((rs) => {
      const n = [...rs];
      const [m] = n.splice(drag, 1);
      n.splice(to, 0, m!);
      return n;
    });
  };
  return (
    <Section title="Confidential transfer rules" meta={`${rules.filter((r) => r.enabled).length} of ${rules.length} enforced · evaluated in order`}>
      <ol className="space-y-px bg-border">
        {rules.map((r, i) => (
          <li
            key={r.id}
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => { e.preventDefault(); setOver(i); }}
            onDragEnd={() => { setDrag(null); setOver(null); }}
            onDrop={() => { drop(i); setDrag(null); setOver(null); }}
            className={cn("flex items-start gap-3 bg-panel px-3 py-3", drag === i && "opacity-40", over === i && drag !== i && "outline outline-1 outline-border-strong")}
          >
            <GripVertical className="mt-0.5 size-4 shrink-0 cursor-grab text-muted-foreground" aria-label="Drag to reorder" />
            <span className="mt-0.5 w-5 font-mono text-[11px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <div className={cn("flex-1 space-y-2", !r.enabled && "opacity-50")}>
              <p className="text-[12.5px]">{RULE_TITLE[r.id]}</p>
              <RuleBody r={r} set={update} />
            </div>
            <Toggle checked={r.enabled} onChange={(enabled) => update({ ...r, enabled })} label={RULE_TITLE[r.id]} />
          </li>
        ))}
      </ol>
    </Section>
  );
}

function ReportDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (r: Report, b: Blob) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [sections, setSections] = useState<ReportSection[]>(REPORT_SECTIONS.map((s) => s.id));
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [result, setResult] = useState<{ report: Report; blob: Blob } | null>(null);
  if (!open) return null;
  const close = () => { setPhase("idle"); setResult(null); onClose(); };
  const run = async () => {
    setPhase("running");
    const r = await generateReport({ from, to, sections });
    setResult(r);
    onDone(r.report, r.blob);
    setPhase("done");
  };
  return (
    <div className="fade-in fixed inset-0 z-50 grid place-items-center bg-background/80 p-4" onClick={close}>
      <div role="dialog" aria-label="Generate regulatory report" className="w-full max-w-md border border-border-strong bg-panel" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-[15px] font-medium">Generate regulatory report</h2>
          <p className="mt-0.5 text-muted-foreground">Metadata and counts only. No decrypted values are included.</p>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div>
            <p className="label-caps mb-1.5">Date range</p>
            <div className="flex items-center gap-2">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={cn(inputCls, "font-mono")} />
              <span className="text-muted-foreground">to</span>
              <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={cn(inputCls, "font-mono")} />
            </div>
          </div>
          <div>
            <p className="label-caps mb-1.5">Include</p>
            <div className="border border-input">
              {REPORT_SECTIONS.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 last:border-b-0 hover:bg-accent">
                  <input type="checkbox" className="accent-foreground" checked={sections.includes(s.id)} onChange={() => setSections((x) => (x.includes(s.id) ? x.filter((y) => y !== s.id) : [...x, s.id]))} />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
          {phase === "running" && (
            <div className="space-y-1.5">
              <div className="h-0.5 w-full overflow-hidden bg-border-strong"><div className="h-full animate-[obscura-progress_2s_linear_forwards] bg-foreground" /></div>
              <p className="font-mono text-[11px] text-muted-foreground">Compiling report…</p>
            </div>
          )}
          {phase === "done" && result && (
            <div className="flex items-center justify-between border border-success/30 px-3 py-2">
              <span>Report ready</span>
              <Btn size="sm" onClick={() => downloadBlob(result.blob, `${result.report.id}.pdf`)}><Download className="size-3.5" /> Download PDF</Btn>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Btn variant="ghost" onClick={close}>{phase === "done" ? "Close" : "Cancel"}</Btn>
          {phase !== "done" && <Btn variant="solid" onClick={run} disabled={phase === "running" || !sections.length}>{phase === "running" ? "Generating…" : "Generate"}</Btn>}
        </div>
      </div>
    </div>
  );
}

function Reports() {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<(Report & { blob?: Blob })[]>(REPORT_HISTORY);
  return (
    <Section title="Regulatory report generator">
      <div className="space-y-4 p-4">
        <Btn variant="solid" className="h-11 w-full text-[13px]" onClick={() => setOpen(true)}><FileText className="size-4" /> Generate report</Btn>
        <div>
          <p className="label-caps mb-2">Report history</p>
          <ul className="border border-border">
            {history.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
                <FileText className="size-3.5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px]">{r.name}</p>
                  <p className="font-mono text-[10.5px] text-muted-foreground">{fmtTime(r.createdAt).slice(0, 16)} · {r.sizeKb} KB</p>
                </div>
                {r.blob && <button aria-label="Download" onClick={() => downloadBlob(r.blob!, `${r.id}.pdf`)} className="text-muted-foreground hover:text-foreground"><Download className="size-3.5" /></button>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ReportDialog open={open} onClose={() => setOpen(false)} onDone={(r, blob) => setHistory((h) => [{ ...r, blob }, ...h])} />
    </Section>
  );
}

function Compliance() {
  return (
    <div className="fade-in space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="label-caps">ERC-3643 · T-REX</p>
          <h1 className="mt-1 text-[22px] font-medium">Compliance</h1>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground"><ShieldCheck className="size-3.5" /> Identity registry synced</span>
      </div>
      <Holders />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Rules />
        <Reports />
      </div>
    </div>
  );
}
