import { Link } from "@tanstack/react-router";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { useWallet, NETWORKS, type Network } from "@/lib/wallet";
import { CHAIN, short } from "@/lib/constants";
import { useIncoData } from "@/lib/use-inco";
import { useOrganization, ROLE_LABEL } from "@/hooks/useOrganization";
import { useStreamSnapshot } from "@/hooks/useAuditStream";
import { cn } from "@/lib/utils";
import { Btn } from "./ui-kit";
import { MOBILE_NAV } from "./Sidebar";

function BetaBadge() {
  return <span className="rounded-sm border border-warning/40 px-1 font-mono text-[9.5px] uppercase tracking-wider text-warning">Beta</span>;
}

function NetworkSwitcher() {
  const w = useWallet();
  const wrongChain = w.isEvm && w.address && !w.isDemo && w.chainId !== CHAIN.id;
  return (
    <Popover.Root>
      <Popover.Trigger className="flex h-7 items-center gap-2 border border-border px-2.5 font-mono text-[11px] hover:bg-accent">
        <span className={cn("size-1.5 rounded-full", wrongChain ? "bg-destructive" : w.isEvm ? "bg-success" : "bg-warning")} />
        <span className={wrongChain ? "text-destructive" : "text-muted-foreground"}>{wrongChain ? `Wrong network (${w.chainId})` : NETWORKS[w.network].label}</span>
        {NETWORKS[w.network].beta && <BetaBadge />}
        <ChevronDown className="size-3 text-muted-foreground" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={4} className="z-50 w-56 rounded-sm border border-border-strong bg-panel p-1">
          {(Object.keys(NETWORKS) as Network[]).map((n) => (
            <Popover.Close key={n} asChild>
              <button onClick={() => n !== w.network && w.setNetwork(n)} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left font-mono text-[11.5px] hover:bg-accent">
                <span className="flex-1">{NETWORKS[n].label}</span>
                {NETWORKS[n].beta && <BetaBadge />}
                <Check className={cn("size-3", n === w.network ? "opacity-100" : "opacity-0")} />
              </button>
            </Popover.Close>
          ))}
          <p className="border-t border-border px-2 pb-1 pt-2 text-[11px] text-muted-foreground">Switching networks disconnects the current wallet.</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function Header() {
  const w = useWallet();
  const data = useIncoData(w.address);
  const org = useOrganization(w.address);
  const stream = useStreamSnapshot();
  const active = data?.vouchers.filter((v) => v.status === "active").length ?? 0;
  const pending = stream.pending + org.invitations.filter((i) => i.status === "pending").length;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="flex h-12 items-center gap-4 px-6">
        <div className="min-w-0">
          <p className="truncate text-[12.5px]">{org.workspace.name}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <NetworkSwitcher />
          {w.address && (
            <span className="hidden items-center gap-2 font-mono text-[11px] text-muted-foreground lg:flex">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-success" />
              </span>
              <span className="text-foreground">{active}</span> active sessions · <span className="text-foreground">{pending}</span> pending requests
            </span>
          )}
          {w.address ? (
            <>
              <span className="flex items-center border border-border">
                <span className="px-2 py-1 font-mono text-[11.5px]">{short(w.address)}</span>
                <span className="border-l border-border px-1.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{ROLE_LABEL[org.role]}</span>
              </span>
              <Btn size="sm" variant="ghost" onClick={w.disconnect}>Disconnect</Btn>
            </>
          ) : (
            <Btn size="sm" variant="solid" onClick={w.connect} disabled={w.connecting}>
              {w.connecting ? "Connecting…" : "Connect wallet"}
            </Btn>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 md:hidden">
        {MOBILE_NAV.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: n.exact }} className="whitespace-nowrap border-b border-transparent px-2 py-2 text-[12px] text-muted-foreground" activeProps={{ className: "!border-foreground !text-foreground" }}>
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
