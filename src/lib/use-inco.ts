import { useEffect, useState, useSyncExternalStore } from "react";
import * as inco from "./inco-mock";
import * as solana from "./solana-mock";
import { useWallet } from "./wallet";
import type { AuditEntry, Handle, Voucher } from "./types";

export type IncoData = { handles: Handle[]; vouchers: Voucher[]; log: AuditEntry[] };

export function useIncoData(address: string | null) {
  const { isEvm } = useWallet();
  const version = useSyncExternalStore(inco.subscribe, inco.getVersion, () => 0);
  const [tick, setTick] = useState(0);
  const [data, setData] = useState<IncoData | null>(null);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!address) return setData(null);
    let live = true;
    const src = isEvm ? inco : solana;
    Promise.all([src.getOwnedHandles(address), src.getVouchers(address), src.getAuditLog(address)]).then(
      ([handles, vouchers, log]) => live && setData({ handles, vouchers, log }),
    );
    return () => {
      live = false;
    };
  }, [address, version, tick, isEvm]);

  return data;
}
