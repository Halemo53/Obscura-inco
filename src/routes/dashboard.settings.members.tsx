import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserPlus, Users, Lock, X } from "lucide-react";
import { useWallet } from "@/lib/wallet";
import { useOrganization, ROLE_LABEL, PERMISSIONS } from "@/hooks/useOrganization";
import { Btn, Section, th, td } from "@/components/ui-kit";
import { EmptyState, inputCls } from "@/components/controls";
import { fmtTime, short } from "@/lib/constants";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/settings/members")({
  head: () => ({
    meta: [
      { title: "Members — Obscura" },
      { name: "description", content: "Manage workspace members, roles and invitations." },
      { property: "og:title", content: "Members — Obscura" },
      { property: "og:description", content: "Workspace members, roles and invitations." },
    ],
  }),
  component: Members,
});

const rel = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

function RoleBadge({ role }: { role: Role }) {
  return <span className={cn("rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider", role === "owner" ? "border-foreground" : "border-border-strong text-muted-foreground")}>{ROLE_LABEL[role]}</span>;
}

function InviteDialog({ open, onClose, onInvite }: { open: boolean; onClose: () => void; onInvite: (a: string, r: "admin" | "auditor", m?: string) => void }) {
  const [addr, setAddr] = useState("");
  const [role, setRole] = useState<"admin" | "auditor">("auditor");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (open) { setAddr(""); setRole("auditor"); setMsg(""); }
  }, [open]);
  if (!open) return null;
  const valid = /^0x[0-9a-fA-F]{40}$/.test(addr);
  return (
    <div className="fade-in fixed inset-0 z-50 grid place-items-center bg-background/80 p-4" onClick={onClose}>
      <div role="dialog" aria-label="Invite member" className="w-full max-w-md border border-border-strong bg-panel" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-[15px] font-medium">Invite member</h2>
          <p className="mt-0.5 text-muted-foreground">The invitee signs a message from this address to join.</p>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div>
            <p className="label-caps mb-1.5">Wallet address</p>
            <input value={addr} onChange={(e) => setAddr(e.target.value.trim())} placeholder="0x…" className={cn(inputCls, "h-9 font-mono")} />
          </div>
          <div>
            <p className="label-caps mb-1.5">Role</p>
            <div role="radiogroup" className="grid grid-cols-2 gap-px border border-input bg-border">
              {(["admin", "auditor"] as const).map((r) => (
                <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={cn("border-l-4 px-3 py-2.5 text-left", role === r ? "border-foreground bg-panel" : "border-transparent bg-background hover:bg-panel")}>
                  <p className="text-[12.5px]">{ROLE_LABEL[r]}</p>
                  <p className="text-[11px] text-muted-foreground">{r === "admin" ? "Create vouchers, view all. Cannot revoke." : "View only. Decrypts with a valid voucher."}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label-caps mb-1.5">Message (optional)</p>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className={cn(inputCls, "h-auto py-2")} placeholder="Q4 statutory audit access" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="solid" disabled={!valid} onClick={() => { onInvite(addr, role, msg || undefined); onClose(); }}>Send invite</Btn>
        </div>
      </div>
    </div>
  );
}

function Members() {
  const { address } = useWallet();
  const org = useOrganization(address);
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const feed = focus ? org.activity.filter((a) => a.address === focus) : org.activity;

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="label-caps">Settings · {org.workspace.name}</p>
          <h1 className="mt-1 text-[22px] font-medium">Members</h1>
        </div>
        {org.can.manageMembers ? (
          <Btn variant="solid" onClick={() => setOpen(true)}><UserPlus className="size-3.5" /> Invite member</Btn>
        ) : (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground"><Lock className="size-3" /> Only owners can manage members</span>
        )}
      </div>

      <Section title="Workspace members" meta={`${org.members.length} members`}>
        {org.members.length ? (
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Address</th>
                <th className={th}>Name</th>
                <th className={th}>Role</th>
                <th className={th}>Joined</th>
                <th className={th}>Last active</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {org.members.map((m) => {
                const self = m.address === address;
                return (
                  <tr key={m.address} className={cn("cursor-pointer hover:bg-accent", focus === m.address && "bg-accent")} onClick={() => setFocus(focus === m.address ? null : m.address)}>
                    <td className={`${td} font-mono text-[11.5px]`} title={m.address}>{short(m.address, 8, 6)}</td>
                    <td className={td}>{m.label}</td>
                    <td className={td}>
                      {org.can.manageMembers && !self && m.role !== "owner" ? (
                        <select value={m.role} onClick={(e) => e.stopPropagation()} onChange={(e) => org.changeRole(m.address, e.target.value as Role)} className="h-6 rounded-sm border border-input bg-background px-1.5 font-mono text-[11px]">
                          <option value="admin">Admin</option>
                          <option value="auditor">Auditor</option>
                        </select>
                      ) : <RoleBadge role={m.role} />}
                    </td>
                    <td className={`${td} font-mono text-[11px] text-muted-foreground`}>{fmtTime(m.joinedAt).slice(0, 10)}</td>
                    <td className={`${td} font-mono text-[11px]`}>{rel(m.lastActive)}</td>
                    <td className={`${td} text-right`}>
                      {org.can.manageMembers && !self && m.role !== "owner" ? (
                        <Btn size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); org.removeMember(m.address); }}>Remove</Btn>
                      ) : <span className="font-mono text-[11px] text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <EmptyState icon={Users} title="No members yet" />}
      </Section>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Section title="Activity" meta={focus ? `filtered · ${short(focus)}` : "all members"} actions={focus && <Btn size="sm" variant="ghost" onClick={() => setFocus(null)}>Clear filter</Btn>}>
          {feed.length ? (
            <ul>
              {feed.slice(0, 12).map((a) => (
                <li key={a.id} className="flex items-center gap-4 border-b border-border px-4 py-2.5 last:border-b-0">
                  <span className="w-36 shrink-0 font-mono text-[11px] text-muted-foreground">{fmtTime(a.timestamp).slice(0, 16)}</span>
                  <span className="w-28 shrink-0 font-mono text-[11.5px]">{short(a.address)}</span>
                  <span className="truncate">{a.action}</span>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={Users} title="No activity for this member" />}
        </Section>

        <div className="space-y-6">
          <Section title="Pending invitations" meta={`${org.invitations.length}`}>
            {org.invitations.length ? (
              <ul>
                {org.invitations.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11.5px]">{short(i.address, 8, 6)}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{ROLE_LABEL[i.role]} · {rel(i.sentAt)}{i.message ? ` · ${i.message}` : ""}</p>
                    </div>
                    {org.can.manageMembers && (
                      <button aria-label="Cancel invitation" onClick={() => org.cancelInvite(i.id)} className="text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="px-4 py-6 text-center text-muted-foreground">No pending invitations.</p>}
          </Section>

          <Section title="Role permissions">
            <table className="w-full">
              <thead>
                <tr><th className={th}>Permission</th>{(["owner", "admin", "auditor"] as Role[]).map((r) => <th key={r} className={`${th} text-center`}>{ROLE_LABEL[r]}</th>)}</tr>
              </thead>
              <tbody>
                {([["create", "Create vouchers"], ["revoke", "Revoke vouchers"], ["manageMembers", "Manage members"], ["settings", "Workspace settings"]] as const).map(([k, l]) => (
                  <tr key={k}>
                    <td className={td}>{l}</td>
                    {(["owner", "admin", "auditor"] as Role[]).map((r) => (
                      <td key={r} className={`${td} text-center font-mono text-[11px] ${PERMISSIONS[r][k] ? "" : "text-muted-foreground"}`}>{PERMISSIONS[r][k] ? "yes" : "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      </div>

      <InviteDialog open={open} onClose={() => setOpen(false)} onInvite={org.invite} />
    </div>
  );
}
