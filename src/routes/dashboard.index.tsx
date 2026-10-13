import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { useIncoData, type IncoData } from "@/lib/use-inco";
import { useOrganization } from "@/hooks/useOrganization";
import { complianceScore } from "@/lib/compliance";
import { HandleList } from "@/components/HandleList";
import { VoucherTable } from "@/components/VoucherTable";
import { AuditTable } from "@/components/AuditTable";
import { VoucherForm } from "@/components/VoucherForm";
import { Btn, Section } from "@/components/ui-kit";
import { SkeletonRows } from "@/components/controls";
import { MetricCard } from "@/components/analytics/MetricCard";
import { Sparkline } from "@/components/analytics/Sparkline";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Overview — Obscura" },
      { name: "description", content: "Encrypted handles and delegated viewing vouchers for your organization on Inco." },
      { property: "og:title", content: "Overview — Obscura" },
      { property: "og:description", content: "Encrypted handles and delegated viewing vouchers on Inco." },
    ],
  }),
  component: Overview,
});

// deterministic pseudo-random series for sparklines
const series = (seed: number, n: number, base: number, drift: number) => {
  let x = seed;
  return Array.from({ length: n }, (_, i) => {
    x = (x * 9301 + 49297) % 233280;
    return Math.max(0, Math.round(base + drift * i + ((x / 233280) - 0.5) * base * 0.35));
  });
};

function AnalyticsRow({ data }: { data: IncoData }) {
  const m = useMemo(() => {
    const now = Date.now();
    const week = 7 * 24 * 3600_000;
    const active = data.vouchers.filter((v) => v.status === "active").length;
    const activeLastWeek = data.vouchers.filter((v) => v.createdAt < now - week && v.expiresAt > now - week && (!v.revokedAt || v.revokedAt > now - week)).length;
    const handleSeries = Array.from({ length: 30 }, (_, i) => data.handles.filter((h) => h.createdAt <= now - (29 - i) * 24 * 3600_000).length);
    const decSeries = series(7, 30, 6, 0.25);
    const ended = data.vouchers.map((v) => ((v.revokedAt ?? Math.min(v.expiresAt, now)) - v.createdAt) / 3600_000);
    const avg = ended.length ? ended.reduce((a, b) => a + b, 0) / ended.length : 0;
    const decryptions = decSeries.reduce((a, b) => a + b, 0) + data.log.filter((e) => e.action === "used").length;
    return { active, delta: active - activeLastWeek, handleSeries, decSeries, avg, decryptions, score: complianceScore() };
  }, [data]);

  return (
    <div className="grid grid-cols-1 divide-y divide-border border border-border bg-panel sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x [&>*]:border-border">
      <MetricCard label="Total encrypted handles" value={data.handles.length}>
        <Sparkline data={m.handleSeries} />
      </MetricCard>
      <MetricCard label="Active vouchers" value={m.active} foot="vs. last week">
        <span className={`flex items-center gap-0.5 font-mono text-[11px] ${m.delta >= 0 ? "text-success" : "text-destructive"}`}>
          {m.delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {m.delta >= 0 ? "+" : ""}{m.delta}
        </span>
      </MetricCard>
      <MetricCard label="Decryptions this month" value={m.decryptions}>
        <Sparkline data={m.decSeries} />
      </MetricCard>
      <MetricCard label="Avg voucher lifetime" value={m.avg.toFixed(1)} unit="h" foot={`across ${data.vouchers.length} vouchers`} />
      <MetricCard label="Compliance score" value={m.score} unit="/ 100" foot={<div className="h-0.5 w-full bg-border-strong"><div className="h-full bg-foreground" style={{ width: `${m.score}%` }} /></div>} />
    </div>
  );
}

function Overview() {
  const { address, isEvm } = useWallet();
  const data = useIncoData(address);
  const { can } = useOrganization(address);
  const [open, setOpen] = useState(false);

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="label-caps">Organization</p>
          <h1 className="mt-1 text-[22px] font-medium">Confidential audit overview</h1>
        </div>
        {can.create && isEvm && <Btn variant="solid" onClick={() => setOpen(true)}>Issue voucher</Btn>}
      </div>

      {!data || !address ? (
        <div className="border border-border bg-panel"><SkeletonRows rows={8} /></div>
      ) : (
        <>
          <AnalyticsRow data={data} />

          <Section title="Encrypted handles" meta={`${data.handles.length} owned`}>
            <HandleList handles={data.handles} vouchers={data.vouchers} />
          </Section>

          <Section title="Recent vouchers" actions={<Link to="/dashboard/vouchers" className="text-[12px] text-muted-foreground hover:text-foreground">View all →</Link>}>
            <VoucherTable vouchers={data.vouchers} handles={data.handles} owner={address} limit={5} canRevoke={can.revoke && isEvm} />
          </Section>

          <Section title="Recent activity" actions={<Link to="/dashboard/audit" className="text-[12px] text-muted-foreground hover:text-foreground">Full log →</Link>}>
            <AuditTable log={data.log} handles={data.handles} limit={6} />
          </Section>

          <VoucherForm open={open} onClose={() => setOpen(false)} handles={data.handles} owner={address} />
        </>
      )}
    </div>
  );
}
