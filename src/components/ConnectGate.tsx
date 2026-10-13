import type { ReactNode } from "react";
import { useWallet } from "@/lib/wallet";
import { Btn } from "./ui-kit";

export function ConnectGate({ children }: { children: ReactNode }) {
  const w = useWallet();
  if (w.address) return <>{children}</>;
  return (
    <div className="fade-in mx-auto mt-24 max-w-md border border-border bg-panel">
      <div className="border-b border-border px-5 py-4">
        <h1 className="text-[17px] font-medium">Connect an organization wallet</h1>
        <p className="mt-1 text-muted-foreground">
          Obscura reads encrypted handles owned by your address on Base Sepolia and lets you issue scoped decryption vouchers to auditors.
        </p>
      </div>
      <div className="space-y-3 px-5 py-4">
        <div className="flex gap-2">
          <Btn variant="solid" onClick={w.connect} disabled={w.connecting}>{w.connecting ? "Connecting…" : "Connect MetaMask"}</Btn>
          <Btn variant="outline" onClick={w.connectDemo}>Use demo address</Btn>
        </div>
        {w.error && <p className="text-destructive">{w.error}</p>}
        <p className="font-mono text-[11px] text-muted-foreground">Data layer: mock · Inco Lightning SDK pending</p>
      </div>
    </div>
  );
}
