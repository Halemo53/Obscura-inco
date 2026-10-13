import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FilePlus, XCircle, Eye, Clock, Pause, Play, Download, Radio } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { useIncoData } from "@/lib/use-inco";
import { useAuditStream, useStreamSnapshot, setLive, toCsv, downloadBlob } from "@/hooks/useAuditStream";
import { AuditTable } from "@/components/AuditTable";
import { Btn, Section } from "@/components/ui-kit";
import { EmptyState, SkeletonRows, Toggle } from "@/components/controls";
import { fmtTime, short } from "@/lib/constants";
import type { AuditAction, AuditEntry, Handle } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/audit")({
  head: () => ({
    meta: [
      { title: "Audit log — Obscura" },
      { name: "description", content: "Live, metadata-only stream of every voucher action." },
      { property: "og:title", content: "Audit log — Obscura" },
      { property: "og:description", content: "Live, metadata-only stream of every voucher action." },
    ],
  }),
  component: Audit,
});

const EVENT: Record<AuditAction, { name: string; icon: typeof Eye; cls: string }> = {
  created: { name: "VoucherCreated", icon: FilePlus, cls: "text-event-created" },
  revoked: { name: "VoucherRevoked", icon: XCircle, cls: "text-event-revoked" },
  used: { name: "VoucherUsed", icon: Eye, cls: "text-event-used" },
  expired: { name: "VoucherExpired", icon: Clock, cls: "text-event-expired" },
};

function StreamRow({ e, handles }: { e: AuditEntry; handles: Handle[] }) {
  const ev = EVENT[e.action];
  const old = Date.now() - e.timestamp > 60_000;
  const label = e.handle ? handles.find((h) => h.handle === e.handle)?.label ?? short(e.handle) : null;
  return (
    <li className={cn("stream-in flex items-center gap-4 border-b border-border px-4 py-2.5 transition-opacity duration-500", old && "opacity-60")}>
      <ev.icon className={cn("size-3.5 shrink-0", ev.cls)} />
      <span className={cn("w-32 shrink-0 font-mono text-[11.5px]", ev.cls)}>{ev.name}</span>
      <span className="w-28 shrink-0 font-mono text-[11.5px]">{e.voucherId}</span>
      <span className="w-28 shrink-0 font-mono text-[11.5px] text-muted-foreground">{e.actor === "system" ? "system" : short(e.actor)}</span>
      <span className="min-w-0 flex-1 truncate">{label ?? <span className="text-muted-foreground">—</span>}</span>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{fmtTime(e.timestamp)}</span>
    </li>
  );
}

function Audit() {
  const { address, isEvm } = useWallet();
  const data = useIncoData(address);
  const { live } = useStreamSnapshot();
  const stream = useAuditStream(data?.log ?? []);
  const [tab, setTab] = useState<"stream" | "table">("stream");

  const exportCsv = () => {
    const rows = data?.log ?? [];
    downloadBlob(new Blob([toCsv(rows)], { type: "text/csv" }), `obscura-audit-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="fade-in space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Compliance</p>
          <h1 className="mt-1 text-[22px] font-medium">Audit log</h1>
          <p className="mt-1 text-muted-foreground">Metadata only. No encrypted values or amounts are recorded.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex h-8 items-center gap-2 border border-border px-3 font-mono text-[11px]">
            <span className="relative flex size-1.5">
              {live && isEvm && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />}
              <span className={cn("relative inline-flex size-1.5 rounded-full", live && isEvm ? "bg-success" : "bg-muted-foreground")} />
            </span>
            Live
            <Toggle checked={live} onChange={setLive} label="Live stream" disabled={!isEvm} />
          </label>
          <Btn onClick={() => stream.setPaused(!stream.paused)} disabled={tab !== "stream"}>
            {stream.paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            {stream.paused ? "Resume stream" : "Pause stream"}
          </Btn>
          <Btn onClick={exportCsv} disabled={!data}><Download className="size-3.5" /> Export CSV</Btn>
        </div>
      </div>

      <div className="flex border-b border-border">
        {(["stream", "table"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("-mb-px border-b px-3 py-2 text-[12.5px]", tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t === "stream" ? "Live stream" : "Table"}
          </button>
        ))}
      </div>

      {tab === "stream" ? (
        <Section
          title="Event stream"
          meta={stream.paused ? `paused · ${stream.buffered} buffered` : live && isEvm ? "listening · Base Sepolia" : "disconnected"}
        >
          {!data ? (
            <SkeletonRows />
          ) : stream.events.length ? (
            <ul>
              {stream.events.slice(0, 80).map((e) => <StreamRow key={e.id} e={e} handles={data.handles} />)}
            </ul>
          ) : (
            <EmptyState icon={Radio} title="Waiting for events" body="New voucher activity will appear here as it happens." />
          )}
        </Section>
      ) : (
        <Section title="Events" meta={data ? `${data.log.length} entries` : undefined}>
          {data ? <AuditTable log={data.log} handles={data.handles} /> : <SkeletonRows />}
        </Section>
      )}
    </div>
  );
}
