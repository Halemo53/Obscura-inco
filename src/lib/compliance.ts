const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const D = 24 * 3600_000;

export type HolderStatus = "verified" | "pending" | "rejected";
export type Holder = { address: string; status: HolderStatus; jurisdiction: string; lastCheck: number; entity: string };

const t0 = Date.now();
export const HOLDERS: Holder[] = (
  [
    ["verified", "CH", 2, "Helvetia Custody AG"],
    ["verified", "DE", 5, "Nordbank Treasury"],
    ["pending", "SG", 1, "Strait Capital Pte"],
    ["verified", "LU", 11, "Ardennes Fund SICAV"],
    ["rejected", "US", 19, "Unregistered entity"],
    ["verified", "GB", 7, "Thames Clearing Ltd"],
    ["pending", "AE", 3, "Gulf Digital Assets"],
    ["verified", "NL", 23, "Rijn Pension Fund"],
    ["verified", "IE", 41, "Liffey Securities"],
    ["rejected", "HK", 64, "Kowloon OTC Desk"],
  ] as const
).map(([status, jurisdiction, d, entity]) => ({ address: "0x" + hex(40), status, jurisdiction, lastCheck: t0 - d * D, entity }));

export type RuleId = "verified-only" | "max-amount" | "blackout" | "jurisdictions";
export type TransferRule =
  | { id: "verified-only"; enabled: boolean }
  | { id: "max-amount"; enabled: boolean; amount: number }
  | { id: "blackout"; enabled: boolean; from: string; to: string }
  | { id: "jurisdictions"; enabled: boolean; countries: string[] };

const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
export const DEFAULT_RULES: TransferRule[] = [
  { id: "verified-only", enabled: true },
  { id: "max-amount", enabled: true, amount: 2_500_000 },
  { id: "blackout", enabled: false, from: iso(t0 + 20 * D), to: iso(t0 + 27 * D) },
  { id: "jurisdictions", enabled: true, countries: ["CH", "DE", "LU", "GB", "NL", "IE"] },
];

export type ReportSection = "vouchers" | "decryptions" | "violations" | "members";
export const REPORT_SECTIONS: { id: ReportSection; label: string }[] = [
  { id: "vouchers", label: "Voucher activity" },
  { id: "decryptions", label: "Decryption count" },
  { id: "violations", label: "Rule violations" },
  { id: "members", label: "Member activity" },
];

export type Report = { id: string; name: string; createdAt: number; from: string; to: string; sizeKb: number; sections: ReportSection[] };

export const REPORT_HISTORY: Report[] = [
  { id: "rpt_" + hex(6), name: "ERC-3643 monthly — September 2026", createdAt: t0 - 12 * D, from: "2026-09-01", to: "2026-09-30", sizeKb: 412, sections: ["vouchers", "decryptions", "violations"] },
  { id: "rpt_" + hex(6), name: "Auditor access review — Q3", createdAt: t0 - 18 * D, from: "2026-07-01", to: "2026-09-30", sizeKb: 1184, sections: ["vouchers", "members"] },
  { id: "rpt_" + hex(6), name: "ERC-3643 monthly — August 2026", createdAt: t0 - 42 * D, from: "2026-08-01", to: "2026-08-31", sizeKb: 389, sections: ["vouchers", "decryptions", "violations"] },
  { id: "rpt_" + hex(6), name: "Transfer rule violations — July", createdAt: t0 - 70 * D, from: "2026-07-01", to: "2026-07-31", sizeKb: 96, sections: ["violations"] },
];

export async function generateReport(p: { from: string; to: string; sections: ReportSection[] }): Promise<{ report: Report; blob: Blob }> {
  await new Promise((r) => setTimeout(r, 2000));
  const lines = [
    "%PDF-1.4 (mock)",
    "Obscura regulatory report",
    `Period: ${p.from} to ${p.to}`,
    `Sections: ${p.sections.join(", ")}`,
    `Verified holders: ${HOLDERS.filter((h) => h.status === "verified").length}/${HOLDERS.length}`,
    "No encrypted values are included in this report.",
  ];
  const blob = new Blob([lines.join("\n")], { type: "application/pdf" });
  const report: Report = {
    id: "rpt_" + hex(6),
    name: `Regulatory report — ${p.from} to ${p.to}`,
    createdAt: Date.now(),
    from: p.from,
    to: p.to,
    sizeKb: 180 + p.sections.length * 70 + Math.floor(Math.random() * 60),
    sections: p.sections,
  };
  return { report, blob };
}

export function complianceScore() {
  const verified = HOLDERS.filter((h) => h.status === "verified").length / HOLDERS.length;
  return Math.round(60 + verified * 35);
}
