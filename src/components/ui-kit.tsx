import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const btn = cva(
  "inline-flex items-center justify-center gap-2 rounded-sm text-[12.5px] font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        solid: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border-strong text-foreground hover:bg-accent",
        ghost: "text-muted-foreground hover:text-foreground hover:bg-accent",
        danger: "border border-destructive/40 text-destructive hover:bg-destructive/10",
      },
      size: { sm: "h-7 px-2.5", md: "h-8 px-3.5" },
    },
    defaultVariants: { variant: "outline", size: "md" },
  },
);

export function Btn({ variant, size, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof btn>) {
  return <button className={cn(btn({ variant, size }), className)} {...p} />;
}

export function Section({ title, meta, actions, children }: { title: string; meta?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="border border-border bg-panel">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[13px] font-medium">{title}</h2>
          {meta && <span className="font-mono text-[11px] text-muted-foreground">{meta}</span>}
        </div>
        {actions}
      </header>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export const th = "label-caps px-4 py-2 text-left font-medium border-b border-border";
export const td = "px-4 py-2.5 border-b border-border align-middle";
