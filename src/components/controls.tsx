import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={cn("relative h-4 w-7 shrink-0 rounded-full border transition-colors disabled:opacity-40", checked ? "border-foreground bg-foreground" : "border-border-strong bg-background")}
    >
      <span className={cn("absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full transition-all", checked ? "left-[14px] bg-background" : "left-[2px] bg-muted-foreground")} />
    </button>
  );
}

export const inputCls =
  "h-8 w-full rounded-sm border border-input bg-background px-2.5 text-[12.5px] outline-none placeholder:text-muted-foreground focus:border-ring";

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { value: string; label: string; prefix?: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className={cn(inputCls, "flex items-center justify-between text-left")}>
          <span className={cn("truncate font-mono text-[11.5px]", !value.length && "text-muted-foreground")}>{value.length ? value.join(", ") : placeholder}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={4} className="z-[60] max-h-64 w-[var(--radix-popover-trigger-width)] overflow-auto rounded-sm border border-border-strong bg-panel p-1">
          {options.map((o) => (
            <button
              type="button"
              key={o.value}
              onClick={() => toggle(o.value)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12.5px] hover:bg-accent"
            >
              <span className={cn("grid size-3.5 place-items-center border", value.includes(o.value) ? "border-foreground bg-foreground text-primary-foreground" : "border-border-strong")}>
                {value.includes(o.value) && <Check className="size-2.5" />}
              </span>
              {o.prefix && <span>{o.prefix}</span>}
              <span className="font-mono text-[11px] text-muted-foreground">{o.value}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex border border-input">
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn("h-8 px-3 text-[12px]", i > 0 && "border-l border-input", value === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-6 px-4 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3 flex-1 animate-pulse bg-accent" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: React.ComponentType<{ className?: string }>; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      <Icon className="size-5 text-muted-foreground" />
      <p className="text-[13px]">{title}</p>
      {body && <p className="max-w-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
