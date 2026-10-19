/**
 * Mock Inco service layer. Swap these functions for @inco/lightning-js +
 * session-key (voucher) calls later; signatures are kept async on purpose.
 */
import type { AuditEntry, CreateVoucherParams, Handle, Voucher } from "./types";

const rhex = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const now = () => Date.now();
const H = 3600_000;

type State = { handles: Handle[]; vouchers: Voucher[]; log: AuditEntry[] };

const seedAuditor = "0x7a3F9c21B4e8D05a6C1f2E9b3D4a8C7e6F5b0912";
const seedAuditor2 = "0x2B91dE4c7A0F38b5C6e1D9a2F4b7C8e3A6d5F017";

function seed(owner: string): State {
  const t = now();
  const handles: Handle[] = [
    { label: "Q4 Payroll Total", category: "payroll", createdAt: t - 40 * 24 * H },
    { label: "Q1 Payroll Total — 2026", category: "payroll", createdAt: t - 6 * 24 * H },
    { label: "Vendor Payment — Acme Corp", category: "vendor", createdAt: t - 22 * 24 * H },
    { label: "Vendor Payment — Halden Systems", category: "vendor", createdAt: t - 15 * 24 * H },
    { label: "Treasury Reserve — Q1", category: "treasury", createdAt: t - 60 * 24 * H },
    { label: "Audit Log — January 2026", category: "audit", createdAt: t - 3 * 24 * H },
  ].map((h) => ({ ...h, handle: "0x" + rhex(64) })) as Handle[];

  const vouchers: Voucher[] = [
    { id: "vch_" + rhex(8), grantor: owner, auditor: seedAuditor, handles: [handles[0]!.handle, handles[1]!.handle], createdAt: t - 2 * H, expiresAt: t + 22 * H, revocable: true, status: "active", disclosure: "full", verifiers: [{ type: "time", from: "08:00", to: "18:00", timezone: "UTC" }] },
    { id: "vch_" + rhex(8), grantor: owner, auditor: seedAuditor2, handles: [handles[2]!.handle], createdAt: t - 9 * 24 * H, expiresAt: t - 2 * 24 * H, revocable: true, status: "expired", disclosure: "comparison", verifiers: [{ type: "threshold", value: 250000, op: "gt" }] },
    { id: "vch_" + rhex(8), grantor: owner, auditor: seedAuditor, handles: [handles[4]!.handle], createdAt: t - 5 * 24 * H, expiresAt: t + 25 * 24 * H, revocable: true, revokedAt: t - 4 * 24 * H, status: "revoked", disclosure: "range", verifiers: [] },
  ];

  const log: AuditEntry[] = [];
  const add = (timestamp: number, action: AuditEntry["action"], v: Voucher, actor: string, handle?: string) =>
    log.push({ id: rhex(10), timestamp, action, voucherId: v.id, actor, ...(handle ? { handle } : {}), txRef: "0x" + rhex(64) });
  add(vouchers[1]!.createdAt, "created", vouchers[1]!, owner);
  add(vouchers[1]!.createdAt + 3 * H, "used", vouchers[1]!, seedAuditor2, handles[2]!.handle);
  add(vouchers[1]!.expiresAt, "expired", vouchers[1]!, "system");
  add(vouchers[2]!.createdAt, "created", vouchers[2]!, owner);
  add(vouchers[2]!.revokedAt!, "revoked", vouchers[2]!, owner);
  add(vouchers[0]!.createdAt, "created", vouchers[0]!, owner);
  add(vouchers[0]!.createdAt + 40 * 60000, "used", vouchers[0]!, seedAuditor, handles[0]!.handle);
  log.sort((a, b) => b.timestamp - a.timestamp);
  return { handles, vouchers, log };
}

const stores = new Map<string, State>();
const listeners = new Set<() => void>();
let version = 0;
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};
export const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const getVersion = () => version;

function store(address: string) {
  const k = address.toLowerCase();
  if (!stores.has(k)) stores.set(k, seed(address));
  const s = stores.get(k)!;
  // sweep expiries
  const t = now();
  for (const v of s.vouchers) {
    if (v.status === "active" && v.expiresAt <= t) {
      v.status = "expired";
      s.log.unshift({ id: rhex(10), timestamp: v.expiresAt, action: "expired", voucherId: v.id, actor: "system", txRef: "0x" + rhex(64) });
    }
  }
  return s;
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export async function getOwnedHandles(address: string): Promise<Handle[]> {
  return [...store(address).handles];
}

export async function getVouchers(address: string): Promise<Voucher[]> {
  return [...store(address).vouchers].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAuditLog(address: string): Promise<AuditEntry[]> {
  return [...store(address).log];
}

export async function createVoucher(p: CreateVoucherParams): Promise<Voucher> {
  await delay(400);
  const s = store(p.grantor);
  const t = now();
  const v: Voucher = {
    id: "vch_" + rhex(8),
    grantor: p.grantor,
    auditor: p.auditor,
    handles: p.handles,
    createdAt: t,
    expiresAt: t + p.durationMs,
    revocable: p.revocable,
    status: "active",
    disclosure: p.disclosure,
    verifiers: p.verifiers,
    ...(p.onchainId ? { onchainId: p.onchainId, txRef: p.txRef } : {}),
  };
  s.vouchers.unshift(v);
  s.log.unshift({ id: rhex(10), timestamp: t, action: "created", voucherId: v.id, actor: p.grantor, txRef: p.txRef ?? "0x" + rhex(64) });
  emit();
  return v;
}

export async function revokeVoucher(address: string, id: string, txRef?: string): Promise<Voucher> {
  if (!txRef) await delay(300);
  const s = store(address);
  const v = s.vouchers.find((x) => x.id === id);
  if (!v) throw new Error("Voucher not found");
  if (!v.revocable) throw new Error("Voucher is not revocable");
  if (v.status !== "active") throw new Error("Voucher is not active");
  v.status = "revoked";
  v.revokedAt = now();
  s.log.unshift({ id: rhex(10), timestamp: v.revokedAt, action: "revoked", voucherId: v.id, actor: address, txRef: txRef ?? "0x" + rhex(64) });
  emit();
  return v;
}

/** Append an externally observed event (e.g. from the live stream) to the log. */
export function recordEvent(address: string, e: AuditEntry) {
  store(address).log.unshift(e);
  emit();
}
