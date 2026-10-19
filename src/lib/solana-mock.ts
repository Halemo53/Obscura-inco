/**
 * Solana Devnet mock — mirrors inco-mock's read API with Solana-flavored data
 * (base58 accounts, SOL amounts). Write paths are not yet available on Solana.
 */
import type { AuditEntry, Handle, Voucher } from "./types";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export const b58 = (n = 44) => Array.from({ length: n }, () => B58[Math.floor(Math.random() * 58)]).join("");
const H = 3600_000;

type State = { handles: Handle[]; vouchers: Voucher[]; log: AuditEntry[]; balances: Record<string, number> };
const stores = new Map<string, State>();

function seed(owner: string): State {
  const t = Date.now();
  const handles: Handle[] = [
    { label: "Q4 Payroll Total — SOL", category: "payroll", createdAt: t - 30 * 24 * H },
    { label: "Vendor Payment — Acme Corp (SOL)", category: "vendor", createdAt: t - 12 * 24 * H },
    { label: "Treasury Reserve — Q1 (SOL)", category: "treasury", createdAt: t - 50 * 24 * H },
    { label: "Audit Log — January 2026", category: "audit", createdAt: t - 8 * 24 * H },
  ].map((h) => ({ ...h, handle: b58(44) })) as Handle[];
  const auditor = b58(44);
  const vouchers: Voucher[] = [
    { id: "vch_" + b58(8), grantor: owner, auditor, handles: [handles[0]!.handle], createdAt: t - 5 * H, expiresAt: t + 19 * H, revocable: true, status: "active", disclosure: "aggregate", verifiers: [] },
    { id: "vch_" + b58(8), grantor: owner, auditor, handles: [handles[2]!.handle], createdAt: t - 10 * 24 * H, expiresAt: t - 3 * 24 * H, revocable: true, status: "expired", disclosure: "zk", verifiers: [] },
  ];
  const log: AuditEntry[] = [
    { id: b58(10), timestamp: vouchers[0]!.createdAt, action: "created", voucherId: vouchers[0]!.id, actor: owner, txRef: b58(88) },
    { id: b58(10), timestamp: vouchers[1]!.expiresAt, action: "expired", voucherId: vouchers[1]!.id, actor: "system", txRef: b58(88) },
    { id: b58(10), timestamp: vouchers[1]!.createdAt, action: "created", voucherId: vouchers[1]!.id, actor: owner, txRef: b58(88) },
  ];
  return { handles, vouchers, log, balances: { [handles[2]!.handle]: 18420.55 } };
}

const store = (a: string) => {
  if (!stores.has(a)) stores.set(a, seed(a));
  return stores.get(a)!;
};

export async function getOwnedHandles(address: string) { return [...store(address).handles]; }
export async function getVouchers(address: string) { return [...store(address).vouchers]; }
export async function getAuditLog(address: string) { return [...store(address).log]; }
export const formatSol = (lamports: number) => `${(lamports / 1e9).toFixed(4)} SOL`;
