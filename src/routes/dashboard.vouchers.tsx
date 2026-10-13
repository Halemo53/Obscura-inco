import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useWallet } from "@/lib/wallet";
import { useIncoData } from "@/lib/use-inco";
import { useOrganization } from "@/hooks/useOrganization";
import { VoucherTable } from "@/components/VoucherTable";
import { VoucherForm } from "@/components/VoucherForm";
import { EvmOnly } from "@/components/EvmOnly";
import { SkeletonRows } from "@/components/controls";
import { Btn, Section } from "@/components/ui-kit";
import type { VoucherStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/vouchers")({
  head: () => ({
    meta: [
      { title: "Vouchers — Obscura" },
      { name: "description", content: "Manage time-limited, revocable decryption vouchers issued to auditors." },
      { property: "og:title", content: "Vouchers — Obscura" },
      { property: "og:description", content: "Manage revocable decryption vouchers issued to auditors." },
    ],
  }),
  component: () => (
    <EvmOnly>
      <Vouchers />
    </EvmOnly>
  ),
});

const filters: (VoucherStatus | "all")[] = ["all", "active", "expired", "revoked"];

function Vouchers() {
  const { address } = useWallet();
  const data = useIncoData(address);
  const { can } = useOrganization(address);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<(typeof filters)[number]>("all");
  const rows = !data ? [] : f === "all" ? data.vouchers : data.vouchers.filter((v) => v.status === f);

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="label-caps">Delegated viewing</p>
          <h1 className="mt-1 text-[22px] font-medium">Access vouchers</h1>
        </div>
        {can.create && <Btn variant="solid" onClick={() => setOpen(true)}>Issue voucher</Btn>}
      </div>
      <Section
        title="Issued vouchers"
        meta={data ? `${rows.length} of ${data.vouchers.length}` : undefined}
        actions={
          <div className="flex border border-border">
            {filters.map((x, i) => (
              <button key={x} onClick={() => setF(x)} className={cn("h-6 px-2.5 font-mono text-[10.5px] uppercase tracking-wider", i && "border-l border-border", f === x ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {x} {x !== "all" && data && data.vouchers.filter((v) => v.status === x).length}
              </button>
            ))}
          </div>
        }
      >
        {data && address ? <VoucherTable vouchers={rows} handles={data.handles} owner={address} canRevoke={can.revoke} /> : <SkeletonRows />}
      </Section>
      {data && address && <VoucherForm open={open} onClose={() => setOpen(false)} handles={data.handles} owner={address} />}
    </div>
  );
}
