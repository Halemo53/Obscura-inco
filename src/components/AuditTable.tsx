import type { AuditEntry, Handle } from "@/lib/types";
import { fmtTime, short } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { th, td } from "./ui-kit";

const tone: Record<AuditEntry["action"], string> = {
  created: "text-event-created",
  used: "text-event-used",
  expired: "text-event-expired",
  revoked: "text-event-revoked",
};

export function AuditTable({ log, handles, limit }: { log: AuditEntry[]; handles: Handle[]; limit?: number }) {
  const rows = limit ? log.slice(0, limit) : log;
  const label = (h?: string) => (h ? handles.find((x) => x.handle === h)?.label ?? short(h) : "—");
  if (!rows.length) return <p className="px-4 py-8 text-center text-muted-foreground">No events.</p>;
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className={th}>Timestamp</th>
          <th className={th}>Event</th>
          <th className={th}>Voucher</th>
          <th className={th}>Actor</th>
          <th className={th}>Handle</th>
          <th className={th}>Ref</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((e) => (
          <tr key={e.id} className="hover:bg-accent">
            <td className={`${td} font-mono text-[11px] text-muted-foreground`}>{fmtTime(e.timestamp)}</td>
            <td className={cn(td, "font-mono text-[11px] uppercase tracking-wider", tone[e.action])}>voucher.{e.action}</td>
            <td className={`${td} font-mono text-[11.5px]`}>{e.voucherId}</td>
            <td className={`${td} font-mono text-[11.5px]`}>{e.actor === "system" ? "system" : short(e.actor)}</td>
            <td className={td}>{label(e.handle)}</td>
            <td className={`${td} font-mono text-[11px] text-muted-foreground`}>{short(e.txRef, 8, 4)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
