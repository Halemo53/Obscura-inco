import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CHAIN } from "./constants";
import { b58 } from "./solana-mock";

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<any>; on?: any; removeListener?: any };
const eth = (): Eth | undefined => (typeof window !== "undefined" ? (window as any).ethereum : undefined);
const sol = (): any => (typeof window !== "undefined" ? (window as any).phantom?.solana ?? (window as any).solana : undefined);

export type Network = "base-sepolia" | "solana-devnet";
export const NETWORKS: Record<Network, { label: string; beta: boolean; evm: boolean }> = {
  "base-sepolia": { label: "Base Sepolia", beta: false, evm: true },
  "solana-devnet": { label: "Solana Devnet", beta: true, evm: false },
};

type Ctx = {
  address: string | null;
  chainId: number | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  connectDemo: () => void;
  disconnect: () => void;
  isDemo: boolean;
  network: Network;
  setNetwork: (n: Network) => void;
  isEvm: boolean;
};
const WalletCtx = createContext<Ctx | null>(null);

const DEMO_EVM = "0xA11cE0b500000000000000000000000000c0DE42";
const DEMO_SOL = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [network, setNetworkState] = useState<Network>("base-sepolia");

  useEffect(() => {
    const e = eth();
    if (!e?.on || network !== "base-sepolia") return;
    const onAcc = (a: string[]) => setAddress(a[0] ?? null);
    const onChain = (c: string) => setChainId(parseInt(c, 16));
    e.on("accountsChanged", onAcc);
    e.on("chainChanged", onChain);
    return () => {
      e.removeListener?.("accountsChanged", onAcc);
      e.removeListener?.("chainChanged", onChain);
    };
  }, [network]);

  const setNetwork = useCallback((n: Network) => {
    setNetworkState(n);
    setAddress(null);
    setChainId(null);
    setIsDemo(false);
    setError(null);
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (network === "solana-devnet") {
      const p = sol();
      if (!p) return setError("No Solana wallet detected. Install Phantom or use demo mode.");
      setConnecting(true);
      try {
        const r = await p.connect();
        setAddress(r.publicKey.toString());
        setIsDemo(false);
      } catch (err: any) {
        setError(err?.message ?? "Connection rejected");
      } finally {
        setConnecting(false);
      }
      return;
    }
    const e = eth();
    if (!e) return setError("No injected wallet detected. Install MetaMask or use demo mode.");
    setConnecting(true);
    try {
      const accs: string[] = await e.request({ method: "eth_requestAccounts" });
      try {
        await e.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN.hexId }] });
      } catch (err: any) {
        if (err?.code === 4902) {
          await e.request({
            method: "wallet_addEthereumChain",
            params: [{ chainId: CHAIN.hexId, chainName: CHAIN.name, rpcUrls: [CHAIN.rpc], nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, blockExplorerUrls: [CHAIN.explorer] }],
          });
        }
      }
      const c: string = await e.request({ method: "eth_chainId" });
      setChainId(parseInt(c, 16));
      setAddress(accs[0] ?? null);
      setIsDemo(false);
    } catch (err: any) {
      setError(err?.message ?? "Connection rejected");
    } finally {
      setConnecting(false);
    }
  }, [network]);

  const connectDemo = useCallback(() => {
    setAddress(network === "solana-devnet" ? DEMO_SOL || b58() : DEMO_EVM);
    setChainId(network === "solana-devnet" ? null : CHAIN.id);
    setIsDemo(true);
    setError(null);
  }, [network]);

  const disconnect = useCallback(() => {
    if (network === "solana-devnet") sol()?.disconnect?.();
    setAddress(null);
    setChainId(null);
    setIsDemo(false);
  }, [network]);

  return (
    <WalletCtx.Provider value={{ address, chainId, connecting, error, connect, connectDemo, disconnect, isDemo, network, setNetwork, isEvm: NETWORKS[network].evm }}>
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  const c = useContext(WalletCtx);
  if (!c) throw new Error("useWallet outside provider");
  return c;
}
