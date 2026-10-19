import type { ReactNode } from "react";

export function MetricCard({ label, value, unit, children, foot }: { label: string; value: ReactNode; unit?: string; children?: ReactNode; foot?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col justify-between gap-2 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground">{label}</p>
      <div className="flex items-end justify-between gap-3">
        <p className="font-display text-[24px] font-medium leading-none tabular-nums">
          {value}
          {unit && <span className="ml-1 text-[12px] text-muted-foreground">{unit}</span>}
        </p>
        {children}
      </div>
      {foot && <div className="text-[11px] text-muted-foreground">{foot}</div>}
    </div>
  );
}
