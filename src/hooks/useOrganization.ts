import { useSyncExternalStore } from "react";
import type { Invitation, Member, MemberActivity, Role, Workspace } from "@/lib/types";

const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const D = 24 * 3600_000;
const H = 3600_000;

export const WORKSPACES: (Workspace & { myRole: Role })[] = [
  { id: "ws_1", name: "Meridian Holdings", slug: "meridian", myRole: "owner" },
  { id: "ws_2", name: "Halden Systems GmbH", slug: "halden", myRole: "admin" },
  { id: "ws_3", name: "Kestrel Audit Partners", slug: "kestrel", myRole: "auditor" },
];

export const PERMISSIONS: Record<Role, { create: boolean; revoke: boolean; manageMembers: boolean; settings: boolean }> = {
  owner: { create: true, revoke: true, manageMembers: true, settings: true },
  admin: { create: true, revoke: false, manageMembers: false, settings: false },
  auditor: { create: false, revoke: false, manageMembers: false, settings: false },
};

export const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", auditor: "Auditor" };

type OrgState = {
  workspaceId: string;
  members: Record<string, Member[]>;
  invitations: Record<string, Invitation[]>;
  activity: Record<string, MemberActivity[]>;
};

const t = Date.now();
const seedMembers = (): Member[] => [
  { address: "0x" + hex(40), role: "admin", joinedAt: t - 74 * D, lastActive: t - 3 * H, label: "R. Okafor — Finance" },
  { address: "0x7a3F9c21B4e8D05a6C1f2E9b3D4a8C7e6F5b0912", role: "auditor", joinedAt: t - 40 * D, lastActive: t - 40 * 60000, label: "Kestrel Audit" },
  { address: "0x2B91dE4c7A0F38b5C6e1D9a2F4b7C8e3A6d5F017", role: "auditor", joinedAt: t - 21 * D, lastActive: t - 2 * D, label: "FINMA reviewer" },
  { address: "0x" + hex(40), role: "admin", joinedAt: t - 9 * D, lastActive: t - 6 * D, label: "L. Brandt — Compliance" },
];

const ACTIONS = ["Issued voucher", "Viewed audit log", "Used voucher on Q4 Payroll Total", "Exported audit CSV", "Generated regulatory report", "Revoked voucher", "Signed multi-sig request"];

let state: OrgState = { workspaceId: "ws_1", members: {}, invitations: {}, activity: {} };
const subs = new Set<() => void>();
const set = (s: OrgState) => {
  state = s;
  subs.forEach((f) => f());
};

function ensure(ws: string, me: string) {
  if (state.members[ws]) return;
  const myRole = WORKSPACES.find((w) => w.id === ws)!.myRole;
  const others = seedMembers();
  if (myRole !== "owner") others.unshift({ address: "0x" + hex(40), role: "owner", joinedAt: t - 88 * D, lastActive: t - 5 * H, label: "Workspace owner" });
  const members: Member[] = [{ address: me, role: myRole, joinedAt: t - 88 * D, lastActive: t, label: "You" }, ...others];
  const activity: MemberActivity[] = members.flatMap((m) =>
    Array.from({ length: 3 }, (_, i) => ({ id: hex(8), address: m.address, timestamp: m.lastActive - i * (6 + Math.random() * 30) * H, action: ACTIONS[Math.floor(Math.random() * ACTIONS.length)]! })),
  );
  state = {
    ...state,
    members: { ...state.members, [ws]: members },
    invitations: { ...state.invitations, [ws]: [{ id: hex(8), address: "0x" + hex(40), role: "auditor", message: "Q4 statutory audit access", sentAt: t - 2 * D, status: "pending" }] },
    activity: { ...state.activity, [ws]: activity.sort((a, b) => b.timestamp - a.timestamp) },
  };
}

export function useOrganization(me: string | null) {
  const s = useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state,
    () => state,
  );
  const ws = WORKSPACES.find((w) => w.id === s.workspaceId)!;
  if (me) ensure(ws.id, me);
  const st = state;
  return {
    workspace: ws,
    workspaces: WORKSPACES,
    role: ws.myRole,
    can: PERMISSIONS[ws.myRole],
    members: st.members[ws.id] ?? [],
    invitations: st.invitations[ws.id] ?? [],
    activity: st.activity[ws.id] ?? [],
    switchWorkspace: (id: string) => set({ ...state, workspaceId: id }),
    invite: (address: string, role: Exclude<Role, "owner">, message?: string) => {
      const inv: Invitation = { id: hex(8), address, role, ...(message ? { message } : {}), sentAt: Date.now(), status: "pending" };
      set({
        ...state,
        invitations: { ...state.invitations, [ws.id]: [inv, ...(state.invitations[ws.id] ?? [])] },
        activity: { ...state.activity, [ws.id]: [{ id: hex(8), address: me ?? "", timestamp: Date.now(), action: `Invited ${address.slice(0, 8)}… as ${ROLE_LABEL[role]}` }, ...(state.activity[ws.id] ?? [])] },
      });
    },
    cancelInvite: (id: string) => set({ ...state, invitations: { ...state.invitations, [ws.id]: (state.invitations[ws.id] ?? []).filter((i) => i.id !== id) } }),
    changeRole: (address: string, role: Role) =>
      set({ ...state, members: { ...state.members, [ws.id]: (state.members[ws.id] ?? []).map((m) => (m.address === address ? { ...m, role } : m)) } }),
    removeMember: (address: string) =>
      set({ ...state, members: { ...state.members, [ws.id]: (state.members[ws.id] ?? []).filter((m) => m.address !== address) } }),
  };
}
