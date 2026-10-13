import { Clock, Globe, BadgeCheck, Users, Scale, type LucideIcon } from "lucide-react";
import type { VerifierType, VoucherVerifier } from "./types";

export const VERIFIER_META: Record<VerifierType, { title: string; short: string; description: string; icon: LucideIcon }> = {
  time: { title: "Time window", short: "Time", description: "Decryption allowed only between set hours.", icon: Clock },
  geo: { title: "Geographic", short: "Geo", description: "Auditor must attest to an approved jurisdiction.", icon: Globe },
  role: { title: "Role credential", short: "Role", description: "Auditor must hold a credential token.", icon: BadgeCheck },
  multisig: { title: "Multi-signature", short: "N-of-M", description: "N of M auditors must co-sign each request.", icon: Users },
  threshold: { title: "Amount threshold", short: "Threshold", description: "Reveals only whether the value is above or below a bound.", icon: Scale },
};

export const VERIFIER_ORDER: VerifierType[] = ["time", "geo", "role", "multisig", "threshold"];

export const TIMEZONES = ["UTC", "Europe/London", "Europe/Zurich", "America/New_York", "Asia/Singapore", "Asia/Dubai"];

export const COUNTRIES: { code: string; name: string; flag: string }[] = [
  ["US", "United States"], ["GB", "United Kingdom"], ["DE", "Germany"], ["FR", "France"], ["CH", "Switzerland"],
  ["NL", "Netherlands"], ["IE", "Ireland"], ["LU", "Luxembourg"], ["SG", "Singapore"], ["HK", "Hong Kong"],
  ["JP", "Japan"], ["AE", "United Arab Emirates"], ["CA", "Canada"], ["AU", "Australia"], ["EG", "Egypt"],
].map(([code, name]) => ({
  code: code!,
  name: name!,
  flag: String.fromCodePoint(...[...code!].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)),
}));

export function defaultVerifier(type: VerifierType): VoucherVerifier {
  switch (type) {
    case "time": return { type, from: "09:00", to: "17:00", timezone: "UTC" };
    case "geo": return { type, countries: ["CH"] };
    case "role": return { type, contract: "", tokenId: "1", minBalance: 1 };
    case "multisig": return { type, required: 2, signers: [] };
    case "threshold": return { type, value: 100000, op: "gt" };
  }
}

const isAddr = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s);

/** Validates verifier configuration. Returns an error message or null. */
export function validateVerifier(v: VoucherVerifier): string | null {
  switch (v.type) {
    case "time": return v.from === v.to ? "Time window cannot be empty." : null;
    case "geo": return v.countries.length ? null : "Select at least one jurisdiction.";
    case "role": return !isAddr(v.contract) ? "Credential contract must be a valid address." : v.minBalance < 1 ? "Minimum balance must be at least 1." : null;
    case "multisig":
      if (v.signers.length < 2) return "Multi-sig needs at least 2 signers.";
      if (v.signers.some((s) => !isAddr(s))) return "All signers must be valid addresses.";
      return v.required < 1 || v.required > v.signers.length ? "N must be between 1 and M." : null;
    case "threshold": return Number.isFinite(v.value) ? null : "Threshold must be a number.";
  }
}

export function describeVerifier(v: VoucherVerifier): string {
  switch (v.type) {
    case "time": return `${v.from}–${v.to} ${v.timezone}`;
    case "geo": return v.countries.join(", ");
    case "role": return `≥${v.minBalance} of #${v.tokenId}`;
    case "multisig": return `${v.required}-of-${v.signers.length}`;
    case "threshold": return `${v.op === "gt" ? ">" : "<"} ${v.value.toLocaleString()}`;
  }
}

/** Mock runtime check — would run in the custom verifier contract. */
export function mockEvaluate(v: VoucherVerifier, ctx: { now: Date; country: string; balance: number; signatures: number }): boolean {
  switch (v.type) {
    case "time": {
      const hm = ctx.now.toISOString().slice(11, 16);
      return v.from < v.to ? hm >= v.from && hm < v.to : hm >= v.from || hm < v.to;
    }
    case "geo": return v.countries.includes(ctx.country);
    case "role": return ctx.balance >= v.minBalance;
    case "multisig": return ctx.signatures >= v.required;
    case "threshold": return true;
  }
}
