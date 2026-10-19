import { Link } from "@tanstack/react-router";
import * as Popover from "@radix-ui/react-popover";
import { LayoutGrid, KeyRound, ScrollText, ShieldCheck, Users, Building2, ChevronsUpDown, Check } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { useOrganization, ROLE_LABEL } from "@/hooks/useOrganization";
import { cn } from "@/lib/utils";

const main = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid, exact: true },
  { to: "/dashboard/vouchers", label: "Vouchers", icon: KeyRound, exact: false },
  { to: "/dashboard/audit", label: "Audit", icon: ScrollText, exact: false },
  { to: "/dashboard/compliance", label: "Compliance", icon: ShieldCheck, exact: false },
] as const;
const settings = [
  { to: "/dashboard/settings/members", label: "Members", icon: Users, exact: false },
  { to: "/dashboard/settings/workspace", label: "Workspace", icon: Building2, exact: false },
] as const;

function NavItem({ to, label, icon: Icon, exact }: { to: (typeof main)[number]["to"] | (typeof settings)[number]["to"]; label: string; icon: typeof Users; exact: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      className="flex h-8 items-center gap-2.5 border-l-2 border-transparent px-3 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
      activeProps={{ className: "!border-foreground !text-foreground bg-accent" }}
    >
      <Icon className="size-3.5" />
      {label}
    </Link>
  );
}

export function WorkspaceSwitcher() {
  const { address } = useWallet();
  const org = useOrganization(address);
  return (
    <Popover.Root>
      <Popover.Trigger className="flex w-full items-center gap-2.5 border-b border-border px-3 py-3 text-left hover:bg-accent">
        <span className="grid size-6 shrink-0 place-items-center border border-border-strong font-display text-[11px]">{org.workspace.name[0]}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px]">{org.workspace.name}</span>
          <span className="block font-mono text-[10.5px] text-muted-foreground">{ROLE_LABEL[org.role].toLowerCase()} · {org.workspace.slug}</span>
        </span>
        <ChevronsUpDown className="size-3.5 text-muted-foreground" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={4} className="z-50 w-56 rounded-sm border border-border-strong bg-panel p-1">
          <p className="label-caps px-2 py-1.5">Workspaces</p>
          {org.workspaces.map((w) => (
            <Popover.Close key={w.id} asChild>
              <button onClick={() => org.switchWorkspace(w.id)} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent">
                <span className="grid size-5 place-items-center border border-border-strong text-[10px]">{w.name[0]}</span>
                <span className="flex-1 truncate text-[12.5px]">{w.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{ROLE_LABEL[w.myRole]}</span>
                <Check className={cn("size-3", w.id === org.workspace.id ? "opacity-100" : "opacity-0")} />
              </button>
            </Popover.Close>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-background md:flex">
      <Link to="/dashboard" className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <span className="grid size-5 place-items-center border border-foreground">
          <span className="size-2 bg-foreground" />
        </span>
        <span className="font-display text-[15px] font-medium tracking-tight">Obscura</span>
        <span className="font-mono text-[10px] text-muted-foreground">/ inco</span>
      </Link>
      <WorkspaceSwitcher />
      <nav className="flex-1 space-y-px py-3">
        {main.map((n) => <NavItem key={n.to} {...n} />)}
        <p className="label-caps px-3 pb-1 pt-5">Settings</p>
        {settings.map((n) => <NavItem key={n.to} {...n} />)}
      </nav>
      <p className="border-t border-border px-4 py-3 font-mono text-[10px] text-muted-foreground">mock data layer · v0.2</p>
    </aside>
  );
}

export const MOBILE_NAV = [...main, ...settings];
