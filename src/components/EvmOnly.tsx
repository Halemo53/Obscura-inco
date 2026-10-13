import type { ReactNode } from "react";
import { Layers } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { EmptyState } from "./controls";

export function EvmOnly({ children }: { children: ReactNode }) {
  const { isEvm } = useWallet();
  if (isEvm) return <>{children}</>;
  return (
    <div className="fade-in grid min-h-[60vh] place-items-center">
      <div className="border border-border bg-panel">
        <EmptyState icon={Layers} title="EVM features are not available on Solana yet. Coming soon." body="Switch to Base Sepolia from the network menu to use this page." />
      </div>
    </div>
  );
}
