import type { VoucherStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<VoucherStatus, string> = {
  active: "text-success border-success/30",
  expired: "text-muted-foreground border-border-strong",
  revoked: "text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: VoucherStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-wider", styles[status])}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
