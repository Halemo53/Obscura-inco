import type { Handle, Voucher } from "@/lib/types";
import { fmtTime, short } from "@/lib/constants";
import { th, td } from "./ui-kit";

export function HandleList({ handles, vouchers }: { handles: Handle[]; vouchers: Voucher[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className={th}>Label</th>
          <th className={th}>Handle (euint256)</th>
          <th className={th}>Category</th>
          <th className={th}>Value</th>
          <th className={th}>Active grants</th>
          <th className={th}>Created</th>
        </tr>
      </thead>
      <tbody>
        {handles.map((h) => {
          const grants = vouchers.filter((v) => v.status === "active" && v.handles.includes(h.handle)).length;
          return (
            <tr key={h.handle} className="hover:bg-accent">
              <td className={td}>{h.label}</td>
              <td className={`${td} font-mono text-[11.5px] text-muted-foreground`} title={h.handle}>{short(h.handle, 10, 6)}</td>
              <td className={`${td} font-mono text-[11px] uppercase text-muted-foreground`}>{h.category}</td>
              <td className={`${td} font-mono text-[11.5px] text-muted-foreground`}>
                <span className="tracking-[0.2em]">••••••••</span> <span className="text-[10px]">encrypted</span>
              </td>
              <td className={`${td} font-mono text-[11.5px]`}>{grants}</td>
              <td className={`${td} font-mono text-[11px] text-muted-foreground`}>{fmtTime(h.createdAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
