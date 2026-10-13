import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useWallet, NETWORKS } from "@/lib/wallet";
import { useOrganization, ROLE_LABEL } from "@/hooks/useOrganization";
import { Section } from "@/components/ui-kit";
import { inputCls } from "@/components/controls";
import { short } from "@/lib/constants";

export const Route = createFileRoute("/dashboard/settings/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace — Obscura" },
      { name: "description", content: "Workspace profile, defaults and network configuration." },
      { property: "og:title", content: "Workspace — Obscura" },
      { property: "og:description", content: "Workspace profile, defaults and network configuration." },
    ],
  }),
  component: WorkspacePage,
});

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
      <span className="label-caps">{k}</span>
      <div>{children}</div>
    </div>
  );
}

function WorkspacePage() {
  const w = useWallet();
  const org = useOrganization(w.address);
  const ro = !org.can.settings;
  return (
    <div className="fade-in space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="label-caps">Settings</p>
          <h1 className="mt-1 text-[22px] font-medium">Workspace</h1>
        </div>
        {ro && <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground"><Lock className="size-3" /> Read-only for {ROLE_LABEL[org.role]}</span>}
      </div>
      <Section title="Profile">
        <Row k="Name"><input key={org.workspace.id} defaultValue={org.workspace.name} disabled={ro} className={`${inputCls} max-w-sm disabled:opacity-60`} /></Row>
        <Row k="Slug"><span className="font-mono text-[12px]">{org.workspace.slug}</span></Row>
        <Row k="Your role"><span className="font-mono text-[12px]">{ROLE_LABEL[org.role]}</span></Row>
        <Row k="Members"><span className="font-mono text-[12px]">{org.members.length}</span></Row>
      </Section>
      <Section title="Defaults">
        <Row k="Default voucher expiry">
          <select disabled={ro} defaultValue="24h" className={`${inputCls} max-w-[180px] font-mono disabled:opacity-60`}><option>1h</option><option>24h</option><option>7d</option><option>30d</option></select>
        </Row>
        <Row k="Default disclosure mode">
          <select disabled={ro} defaultValue="comparison" className={`${inputCls} max-w-[180px] font-mono disabled:opacity-60`}><option value="full">Full</option><option value="range">Range</option><option value="comparison">Comparison</option><option value="aggregate">Aggregate</option><option value="zk">ZK proof</option></select>
        </Row>
      </Section>
      <Section title="Network">
        <Row k="Active network"><span className="font-mono text-[12px]">{NETWORKS[w.network].label}</span></Row>
        <Row k="Connected as"><span className="font-mono text-[12px]">{w.address ? short(w.address, 10, 8) : "—"}</span></Row>
        <Row k="Data source"><span className="font-mono text-[12px] text-muted-foreground">{w.isEvm ? "inco-mock (Lightning SDK pending)" : "solana-mock"}</span></Row>
      </Section>
    </div>
  );
}
