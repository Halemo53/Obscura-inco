import { useState } from "react";
import type { Handle, Voucher } from "@/lib/types";
import { fmtRemaining, fmtTime, short } from "@/lib/constants";
import { revokeVoucher } from "@/lib/inco-mock";
import { revokeOnChain } from "@/lib/voucher-chain";
import { StatusBadge } from "./StatusBadge";
import { DISCLOSURE } from "@/lib/disclosure";
import { VERIFIER_META, describeVerifier } from "@/lib/verifiers";
import { Btn, th, td } from "./ui-kit";

export function VoucherTable({ vouchers, handles, owner, limit, canRevoke = true }: { vouchers: Voucher[]; handles: Handle[]; owner: string; limit?: number; canRevoke?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const label = (h: string) => handles.find((x) => x.handle === h)?.label ?? short(h);
  const rows = limit ? vouchers.slice(0, limit) : vouchers;

  const revoke = async (id: string) => {
    setBusy(id);
    try {
      const v = vouchers.find((x) => x.id === id);
      const tx = v?.onchainId ? await revokeOnChain(owner, v.onchainId) : undefined;
      await revokeVoucher(owner, id, tx);
    } catch (e: any) {
      alert(e?.shortMessage ?? e?.message ?? "Revoke failed");
    } finally {
      setBusy(null);
      setConfirm(null);
    }
  };

  if (!rows.length) return <p className="px-4 py-8 text-center text-muted-foreground">No vouchers issued.</p>;

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className={th}>Voucher</th>
          <th className={th}>Auditor</th>
          <th className={th}>Scope</th>
          <th className={th}>Mode</th>
          <th className={th}>Verifiers</th>
          <th className={th}>Issued</th>
          <th className={th}>Expires</th>
          <th className={th}>Remaining</th>
          <th className={th}>Status</th>
          <th className={`${th} text-right`}>Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((v) => (
          <tr key={v.id} className="hover:bg-accent">
            <td className={`${td} font-mono text-[11.5px]`}>{v.id}</td>
            <td className={`${td} font-mono text-[11.5px]`} title={v.auditor}>{short(v.auditor)}</td>
            <td className={td}>
              <div className="max-w-[260px] truncate" title={v.handles.map(label).join(", ")}>
                {label(v.handles[0] ?? "")}
                {v.handles.length > 1 && <span className="text-muted-foreground"> +{v.handles.length - 1}</span>}
              </div>
            </td>
            <td className={td}>
              <span title={DISCLOSURE[v.disclosure].title} className="inline-flex items-center gap-1 border border-border-strong px-1.5 py-0.5 font-mono text-[10px] tracking-wider">
                {(() => { const I = DISCLOSURE[v.disclosure].icon; return <I className="size-3" />; })()}
                {DISCLOSURE[v.disclosure].badge}
              </span>
            </td>
            <td className={td}>
              {v.verifiers.length ? (
                <span className="flex gap-1">
                  {v.verifiers.map((x) => { const I = VERIFIER_META[x.type].icon; return <span key={x.type} title={`${VERIFIER_META[x.type].title}: ${describeVerifier(x)}`} className="grid size-5 place-items-center border border-border text-muted-foreground"><I className="size-3" /></span>; })}
                </span>
              ) : <span className="font-mono text-[11px] text-muted-foreground">none</span>}
            </td>
            <td className={`${td} font-mono text-[11px] text-muted-foreground`}>{fmtTime(v.createdAt)}</td>
            <td className={`${td} font-mono text-[11px] text-muted-foreground`}>{fmtTime(v.expiresAt)}</td>
            <td className={`${td} font-mono text-[11.5px]`}>{v.status === "active" ? fmtRemaining(v.expiresAt - Date.now()) : "—"}</td>
            <td className={td}><StatusBadge status={v.status} /></td>
            <td className={`${td} text-right`}>
              {v.status === "active" && v.revocable && canRevoke ? (
                confirm === v.id ? (
                  <span className="inline-flex gap-1.5">
                    <Btn size="sm" variant="ghost" onClick={() => setConfirm(null)}>Cancel</Btn>
                    <Btn size="sm" variant="danger" disabled={busy === v.id} onClick={() => revoke(v.id)}>
                      {busy === v.id ? "Revoking…" : "Confirm"}
                    </Btn>
                  </span>
                ) : (
                  <Btn size="sm" variant="danger" onClick={() => setConfirm(v.id)}>Revoke</Btn>
                )
              ) : (
                <span className="font-mono text-[11px] text-muted-foreground">{v.status === "active" ? (v.revocable ? "owner only" : "non-revocable") : "—"}</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
