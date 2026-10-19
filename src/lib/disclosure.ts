import { Unlock, Ruler, ArrowLeftRight, Sigma, ShieldCheck, type LucideIcon } from "lucide-react";
import type { DisclosureMode } from "./types";

export const DISCLOSURE: Record<DisclosureMode, { title: string; badge: string; description: string; detail: string; icon: LucideIcon }> = {
  full: {
    title: "Full decryption", badge: "FULL", icon: Unlock,
    description: "For internal audits and trusted parties.",
    detail: "The auditor's session key can re-encrypt the handle to their own key and read the exact plaintext value.",
  },
  range: {
    title: "Range proof only", badge: "RANGE", icon: Ruler,
    description: "For regulatory threshold checks.",
    detail: "The auditor learns only that the value lies within a bucketed range, computed homomorphically before reveal.",
  },
  comparison: {
    title: "Comparison only", badge: "CMP", icon: ArrowLeftRight,
    description: "For binary compliance checks.",
    detail: "An encrypted comparison against a threshold is evaluated; only the resulting boolean is decrypted.",
  },
  aggregate: {
    title: "Aggregate only", badge: "AGG", icon: Sigma,
    description: "For portfolio-level reporting.",
    detail: "Handles are summed or averaged under encryption. Individual values never leave the ciphertext domain.",
  },
  zk: {
    title: "Zero-knowledge proof", badge: "ZK", icon: ShieldCheck,
    description: "For maximum privacy with verifiability.",
    detail: "The auditor receives a succinct proof that a predicate holds, verifiable onchain without any decryption.",
  },
};

export const DISCLOSURE_ORDER: DisclosureMode[] = ["full", "range", "comparison", "aggregate", "zk"];

/** Mock: what an auditor would see for a given plaintext under each mode. */
export function mockReveal(mode: DisclosureMode, values: number[], threshold = 100000): string {
  const v = values[0] ?? 0;
  switch (mode) {
    case "full": return v.toLocaleString();
    case "range": {
      const lo = Math.floor(v / 250000) * 250000;
      return `between ${lo.toLocaleString()} and ${(lo + 250000).toLocaleString()}`;
    }
    case "comparison": return v > threshold ? `> ${threshold.toLocaleString()}` : `≤ ${threshold.toLocaleString()}`;
    case "aggregate": return `sum ${values.reduce((a, b) => a + b, 0).toLocaleString()}`;
    case "zk": return "proof: predicate holds";
  }
}
