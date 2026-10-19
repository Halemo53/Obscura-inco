export type Handle = {
  handle: string; // euint256 handle (hex) or Solana account (base58)
  label: string;
  category: "payroll" | "vendor" | "audit" | "treasury";
  createdAt: number;
};

export type VoucherStatus = "active" | "expired" | "revoked";

export type DisclosureMode = "full" | "range" | "comparison" | "aggregate" | "zk";

export type VerifierType = "time" | "geo" | "role" | "multisig" | "threshold";

export type VoucherVerifier =
  | { type: "time"; from: string; to: string; timezone: string }
  | { type: "geo"; countries: string[] }
  | { type: "role"; contract: string; tokenId: string; minBalance: number }
  | { type: "multisig"; required: number; signers: string[] }
  | { type: "threshold"; value: number; op: "gt" | "lt" };

export type Voucher = {
  id: string;
  grantor: string;
  auditor: string;
  handles: string[];
  createdAt: number;
  expiresAt: number;
  revocable: boolean;
  revokedAt?: number;
  status: VoucherStatus;
  disclosure: DisclosureMode;
  verifiers: VoucherVerifier[];
  onchainId?: string;
  txRef?: string;
};

export type AuditAction = "created" | "used" | "expired" | "revoked";

export type AuditEntry = {
  id: string;
  timestamp: number;
  action: AuditAction;
  voucherId: string;
  actor: string;
  handle?: string;
  txRef: string;
};

export type CreateVoucherParams = {
  grantor: string;
  auditor: string;
  handles: string[];
  durationMs: number;
  revocable: boolean;
  disclosure: DisclosureMode;
  verifiers: VoucherVerifier[];
  onchainId?: string;
  txRef?: string;
};

export type Role = "owner" | "admin" | "auditor";

export type Member = {
  address: string;
  role: Role;
  joinedAt: number;
  lastActive: number;
  label?: string;
};

export type Invitation = {
  id: string;
  address: string;
  role: Exclude<Role, "owner">;
  message?: string;
  sentAt: number;
  status: "pending" | "accepted";
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
};

export type MemberActivity = {
  id: string;
  address: string;
  timestamp: number;
  action: string;
};
