/**
 * Simulated live audit stream. Swap the interval for wagmi's
 * useWatchContractEvent once the voucher registry contract is deployed.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { AuditAction, AuditEntry, Voucher } from "@/lib/types";
import { recordEvent } from "@/lib/inco-mock";

const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");

type StreamState = { events: AuditEntry[]; pending: number; live: boolean };
let state: StreamState = { events: [], pending: 2, live: true };
const subs = new Set<() => void>();
const set = (s: StreamState) => {
  state = s;
  subs.forEach((f) => f());
};
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

/** Global, read-only view (e.g. Header live counter). */
export function useStreamSnapshot() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export const setLive = (live: boolean) => set({ ...state, live });

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]!;

/** Drives the simulated stream. Mount once (in the dashboard layout). */
export function useAuditStreamDriver(address: string | null, vouchers: Voucher[] | undefined, enabled: boolean) {
  const vRef = useRef(vouchers);
  vRef.current = vouchers;
  useEffect(() => {
    if (!address || !enabled) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const vs = vRef.current ?? [];
      const active = vs.filter((v) => v.status === "active");
      if (vs.length) {
        const action: AuditAction = active.length ? pick<AuditAction>(["used", "used", "used", "created", "expired", "revoked"]) : "created";
        const v = pick(active.length ? active : vs);
        const e: AuditEntry = {
          id: hex(10),
          timestamp: Date.now(),
          action,
          voucherId: action === "created" ? "vch_" + hex(8) : v.id,
          actor: action === "used" ? v.auditor : action === "expired" ? "system" : address,
          ...(action === "used" ? { handle: pick(v.handles) } : {}),
          txRef: "0x" + hex(64),
        };
        recordEvent(address, e);
        set({ ...state, events: [e, ...state.events].slice(0, 200), pending: Math.max(0, state.pending + pick([-1, 0, 0, 1])) });
      }
      timer = setTimeout(tick, 3000 + Math.random() * 7000);
    };
    timer = setTimeout(tick, 3000 + Math.random() * 7000);
    return () => clearTimeout(timer);
  }, [address, enabled]);
}

/** Page-level view with pause support: pausing freezes the visible list without stopping the stream. */
export function useAuditStream(seed: AuditEntry[]) {
  const snap = useStreamSnapshot();
  const [paused, setPaused] = useState(false);
  const [frozen, setFrozen] = useState<AuditEntry[] | null>(null);
  const live = mergeUnique(snap.events, seed);
  useEffect(() => {
    if (paused && !frozen) setFrozen(live);
    if (!paused) setFrozen(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);
  const [, force] = useState(0);
  useEffect(() => {
    const i = setInterval(() => force((x) => x + 1), 5000); // re-evaluate "older than 60s" fading
    return () => clearInterval(i);
  }, []);
  const events = frozen ?? live;
  return { events, paused, setPaused, buffered: frozen ? live.length - frozen.length : 0 };
}

function mergeUnique(a: AuditEntry[], b: AuditEntry[]) {
  const seen = new Set<string>();
  return [...a, ...b].filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true))).sort((x, y) => y.timestamp - x.timestamp);
}

export function toCsv(rows: AuditEntry[]) {
  const head = ["timestamp", "event", "voucher_id", "actor", "handle", "tx_ref"];
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const body = rows.map((r) => [new Date(r.timestamp).toISOString(), `voucher.${r.action}`, r.voucherId, r.actor, r.handle ?? "", r.txRef].map(esc).join(","));
  return [head.join(","), ...body].join("\n");
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
