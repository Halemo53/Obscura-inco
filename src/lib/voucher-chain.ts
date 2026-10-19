/** On-chain voucher issuance via the ObscuraVouchers contract on Base Sepolia (MetaMask). */
import { createPublicClient, createWalletClient, custom, decodeEventLog, http, keccak256, toHex, type Address, type Hex } from "viem";
import { baseSepolia } from "viem/chains";
import artifact from "./contracts/obscura-vouchers.json";
import type { CreateVoucherParams, DisclosureMode } from "./types";

const abi = artifact.abi as any[];
const KEY = "obscura.voucherContract";
const ORDER: DisclosureMode[] = ["full", "range", "comparison", "aggregate", "zk"];

const pub = createPublicClient({ chain: baseSepolia, transport: http() });
const eth = () => (typeof window !== "undefined" ? (window as any).ethereum : undefined);

function wallet() {
  const e = eth();
  if (!e) throw new Error("MetaMask not detected.");
  return createWalletClient({ chain: baseSepolia, transport: custom(e) });
}

async function ensureChain(w: ReturnType<typeof wallet>) {
  if ((await w.getChainId()) !== baseSepolia.id) await w.switchChain({ id: baseSepolia.id });
}

export const getContractAddress = (): Address | null =>
  typeof window === "undefined" ? null : ((localStorage.getItem(KEY) as Address | null) ?? null);
export const setContractAddress = (a: string | null) => (a ? localStorage.setItem(KEY, a) : localStorage.removeItem(KEY));

export async function deployContract(from: string): Promise<Address> {
  const w = wallet();
  await ensureChain(w);
  const hash = await w.deployContract({ abi, bytecode: artifact.bytecode as Hex, account: from as Address });
  const r = await pub.waitForTransactionReceipt({ hash });
  if (!r.contractAddress) throw new Error("Deployment failed.");
  setContractAddress(r.contractAddress);
  return r.contractAddress;
}

export async function issueOnChain(p: CreateVoucherParams): Promise<{ txRef: Hex; onchainId: string }> {
  const addr = getContractAddress();
  if (!addr) throw new Error("No voucher contract deployed.");
  const w = wallet();
  await ensureChain(w);
  const expires = BigInt(Math.floor((Date.now() + p.durationMs) / 1000));
  const vh = keccak256(toHex(JSON.stringify(p.verifiers)));
  const hash = await w.writeContract({
    address: addr, abi, functionName: "issue", account: p.grantor as Address,
    args: [p.auditor, p.handles, expires, p.revocable, ORDER.indexOf(p.disclosure), vh],
  });
  const r = await pub.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error("Transaction reverted.");
  let id = "";
  for (const l of r.logs) {
    try {
      const ev = decodeEventLog({ abi, data: l.data, topics: l.topics }) as any;
      if (ev.eventName === "VoucherIssued") id = String(ev.args.id);
    } catch {}
  }
  return { txRef: hash, onchainId: id };
}

export async function revokeOnChain(from: string, onchainId: string): Promise<Hex> {
  const addr = getContractAddress();
  if (!addr) throw new Error("No voucher contract deployed.");
  const w = wallet();
  await ensureChain(w);
  const hash = await w.writeContract({ address: addr, abi, functionName: "revoke", args: [BigInt(onchainId)], account: from as Address });
  const r = await pub.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error("Revoke reverted.");
  return hash;
}
