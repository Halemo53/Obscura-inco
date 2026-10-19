import { useEffect, useState } from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import type { DisclosureMode, Handle, VerifierType, VoucherVerifier } from "@/lib/types";
import { EXPIRY_OPTIONS, short } from "@/lib/constants";
import { createVoucher } from "@/lib/inco-mock";
import { getContractAddress, issueOnChain } from "@/lib/voucher-chain";
import { useWallet } from "@/lib/wallet";
import { DISCLOSURE, DISCLOSURE_ORDER } from "@/lib/disclosure";
import { COUNTRIES, TIMEZONES, VERIFIER_META, VERIFIER_ORDER, defaultVerifier, describeVerifier, validateVerifier } from "@/lib/verifiers";
import { cn } from "@/lib/utils";
import { Btn } from "./ui-kit";
import { MultiSelect, Segmented, Toggle, inputCls } from "./controls";

const isAddr = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s);

function Label({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <span className="label-caps">{children}</span>
      {right && <span className="font-mono text-[11px] text-muted-foreground">{right}</span>}
    </div>
  );
}

function DisclosureSelector({ value, onChange }: { value: DisclosureMode; onChange: (m: DisclosureMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Disclosure mode" className="grid grid-cols-1 gap-px border border-input bg-border sm:grid-cols-5">
      {DISCLOSURE_ORDER.map((m) => {
        const d = DISCLOSURE[m];
        const on = value === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(m)}
            className={cn("group relative flex flex-col gap-1.5 border-l-4 px-3 py-2.5 text-left", on ? "border-foreground bg-panel" : "border-transparent bg-background hover:bg-panel")}
          >
            <d.icon className={cn("size-3.5", on ? "text-foreground" : "text-muted-foreground")} />
            <span className="text-[12px] leading-tight">{d.title}</span>
            <span className="text-[11px] leading-snug text-muted-foreground">{d.description}</span>
            <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 hidden w-60 border border-border-strong bg-panel-raised px-2.5 py-2 text-[11.5px] leading-snug text-foreground group-hover:block">
              {d.detail}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AddressList({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (isAddr(draft) && !value.includes(draft)) onChange([...value, draft]);
    setDraft("");
  };
  return (
    <div className="space-y-1.5">
      {value.map((a) => (
        <div key={a} className="flex items-center justify-between border border-border px-2 py-1 font-mono text-[11.5px]">
          {short(a, 10, 6)}
          <button type="button" aria-label="Remove signer" onClick={() => onChange(value.filter((x) => x !== a))} className="text-muted-foreground hover:text-foreground">
            <X className="size-3" />
          </button>
        </div>
      ))}
      <div className="flex gap-1.5">
        <input value={draft} onChange={(e) => setDraft(e.target.value.trim())} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder="0x… signer address" className={cn(inputCls, "font-mono")} />
        <Btn type="button" size="md" onClick={add} disabled={!isAddr(draft)} aria-label="Add signer"><Plus className="size-3.5" /></Btn>
      </div>
    </div>
  );
}

function VerifierConfig({ v, onChange }: { v: VoucherVerifier; onChange: (v: VoucherVerifier) => void }) {
  switch (v.type) {
    case "time":
      return (
        <div className="grid grid-cols-3 gap-2">
          <div><Label>From</Label><input type="time" value={v.from} onChange={(e) => onChange({ ...v, from: e.target.value })} className={cn(inputCls, "font-mono")} /></div>
          <div><Label>To</Label><input type="time" value={v.to} onChange={(e) => onChange({ ...v, to: e.target.value })} className={cn(inputCls, "font-mono")} /></div>
          <div>
            <Label>Timezone</Label>
            <select value={v.timezone} onChange={(e) => onChange({ ...v, timezone: e.target.value })} className={cn(inputCls, "font-mono")}>
              {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
      );
    case "geo":
      return (
        <div>
          <Label>Allowed jurisdictions</Label>
          <MultiSelect placeholder="Select ISO codes" value={v.countries} onChange={(countries) => onChange({ ...v, countries })} options={COUNTRIES.map((c) => ({ value: c.code, label: c.name, prefix: c.flag }))} />
        </div>
      );
    case "role":
      return (
        <div className="grid grid-cols-[1fr_90px_110px] gap-2">
          <div><Label>Credential contract</Label><input value={v.contract} onChange={(e) => onChange({ ...v, contract: e.target.value.trim() })} placeholder="0x…" className={cn(inputCls, "font-mono")} /></div>
          <div><Label>Token ID</Label><input value={v.tokenId} onChange={(e) => onChange({ ...v, tokenId: e.target.value })} className={cn(inputCls, "font-mono")} /></div>
          <div><Label>Min. balance</Label><input type="number" min={1} value={v.minBalance} onChange={(e) => onChange({ ...v, minBalance: Number(e.target.value) })} className={cn(inputCls, "font-mono")} /></div>
        </div>
      );
    case "multisig": {
      const m = Math.max(v.signers.length, 1);
      return (
        <div className="space-y-3">
          <div>
            <Label right={`${v.required}-of-${v.signers.length}`}>Required signatures (N)</Label>
            <input type="range" min={1} max={m} value={Math.min(v.required, m)} onChange={(e) => onChange({ ...v, required: Number(e.target.value) })} className="w-full accent-foreground" />
          </div>
          <div>
            <Label right={`M = ${v.signers.length}`}>Co-signing auditors</Label>
            <AddressList value={v.signers} onChange={(signers) => onChange({ ...v, signers, required: Math.min(v.required, Math.max(signers.length, 1)) })} />
          </div>
        </div>
      );
    }
    case "threshold":
      return (
        <div className="flex items-end gap-2">
          <Segmented value={v.op} onChange={(op) => onChange({ ...v, op })} options={[{ value: "gt", label: "Greater than" }, { value: "lt", label: "Less than" }]} />
          <div className="flex-1"><Label>Threshold</Label><input type="number" value={v.value} onChange={(e) => onChange({ ...v, value: Number(e.target.value) })} className={cn(inputCls, "font-mono")} /></div>
        </div>
      );
  }
}

function VerifierSection({ value, onChange }: { value: VoucherVerifier[]; onChange: (v: VoucherVerifier[]) => void }) {
  const get = (t: VerifierType) => value.find((v) => v.type === t);
  const toggle = (t: VerifierType, on: boolean) =>
    onChange(on ? [...value, defaultVerifier(t)].sort((a, b) => VERIFIER_ORDER.indexOf(a.type) - VERIFIER_ORDER.indexOf(b.type)) : value.filter((v) => v.type !== t));
  const update = (nv: VoucherVerifier) => onChange(value.map((v) => (v.type === nv.type ? nv : v)));

  return (
    <div className="space-y-2">
      {VERIFIER_ORDER.map((t) => {
        const meta = VERIFIER_META[t];
        const v = get(t);
        const err = v && validateVerifier(v);
        return (
          <div key={t} className={cn("border", v ? "border-border-strong bg-panel" : "border-input bg-background")}>
            <div className="flex cursor-pointer items-center gap-3 px-3 py-2.5" onClick={() => toggle(t, !v)}>
              <meta.icon className={cn("size-3.5", v ? "text-foreground" : "text-muted-foreground")} />
              <div className="flex-1">
                <p className="text-[12.5px]">{meta.title}</p>
                <p className="text-[11px] text-muted-foreground">{meta.description}</p>
              </div>
              <Toggle checked={!!v} onChange={(on) => toggle(t, on)} label={meta.title} />
            </div>
            {v && (
              <div className="fade-in space-y-2 border-t border-border px-3 py-3">
                <VerifierConfig v={v} onChange={update} />
                {err && <p className="text-[11.5px] text-destructive">{err}</p>}
              </div>
            )}
          </div>
        );
      })}

      <div className="border border-dashed border-border-strong px-3 py-2.5">
        <p className="label-caps mb-2">Verifier stack</p>
        {value.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {value.map((v, i) => {
              const M = VERIFIER_META[v.type];
              return (
                <span key={v.type} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span className="flex items-center gap-1 font-mono text-[9.5px] text-muted-foreground">
                      AND <ArrowRight className="size-3" />
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 border border-border-strong px-1.5 py-0.5 font-mono text-[10.5px]">
                    <M.icon className="size-3" />
                    {M.short}
                    <span className="text-muted-foreground">{describeVerifier(v)}</span>
                  </span>
                </span>
              );
            })}
            <span className="flex items-center gap-1 font-mono text-[9.5px] text-muted-foreground"><ArrowRight className="size-3" /> decrypt</span>
          </div>
        ) : (
          <p className="text-[11.5px] text-muted-foreground">No verifiers — any request from the auditor within the expiry window is accepted.</p>
        )}
      </div>
    </div>
  );
}

export function VoucherForm({ open, onClose, handles, owner }: { open: boolean; onClose: () => void; handles: Handle[]; owner: string }) {
  const [auditor, setAuditor] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(EXPIRY_OPTIONS[1].ms);
  const [revocable, setRevocable] = useState(true);
  const [disclosure, setDisclosure] = useState<DisclosureMode>("full");
  const [verifiers, setVerifiers] = useState<VoucherVerifier[]>([]);
  const [busy, setBusy] = useState(false);
  const { isDemo } = useWallet();
  const onchain = !isDemo && !!getContractAddress();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAuditor(""); setSelected([]); setDuration(EXPIRY_OPTIONS[1].ms); setRevocable(true); setErr(null); setDisclosure("full"); setVerifiers([]);
    }
  }, [open]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  if (!open) return null;

  const toggle = (h: string) => setSelected((s) => (s.includes(h) ? s.filter((x) => x !== h) : [...s, h]));
  const verifierErr = verifiers.map(validateVerifier).find(Boolean);
  const aggregateErr = disclosure === "aggregate" && selected.length < 2 ? "Aggregate mode needs at least 2 handles." : null;
  const valid = isAddr(auditor) && selected.length > 0 && auditor.toLowerCase() !== owner.toLowerCase() && !verifierErr && !aggregateErr;

  const submit = async () => {
    if (!isAddr(auditor)) return setErr("Enter a valid 20-byte hex address.");
    if (auditor.toLowerCase() === owner.toLowerCase()) return setErr("Auditor cannot be the grantor.");
    if (!selected.length) return setErr("Select at least one handle.");
    if (aggregateErr) return setErr(aggregateErr);
    if (verifierErr) return setErr(verifierErr);
    setBusy(true);
    try {
      const params = { grantor: owner, auditor, handles: selected, durationMs: duration, revocable, disclosure, verifiers };
      const chain = onchain ? await issueOnChain(params) : {};
      await createVoucher({ ...params, ...chain });
      onClose();
    } catch (e: any) {
      setErr(e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fade-in fixed inset-0 z-50 grid place-items-center bg-background/80 p-4" onClick={onClose}>
      <div role="dialog" aria-label="Issue access voucher" className="flex max-h-[92vh] w-full max-w-3xl flex-col border border-border-strong bg-panel" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-[15px] font-medium">Issue access voucher</h2>
          <p className="mt-0.5 text-muted-foreground">Grants scoped, time-limited decryption rights. Values are never revealed to the grantor.</p>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div>
            <Label right={DISCLOSURE[disclosure].badge}>Disclosure mode</Label>
            <DisclosureSelector value={disclosure} onChange={setDisclosure} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-5">
              <div>
                <Label>Auditor address</Label>
                <input id="auditor" value={auditor} onChange={(e) => setAuditor(e.target.value.trim())} placeholder="0x…" spellCheck={false} className={cn(inputCls, "h-9 font-mono")} />
              </div>
              <div>
                <Label>Expiry</Label>
                <div className="grid grid-cols-4 border border-input">
                  {EXPIRY_OPTIONS.map((o, i) => (
                    <button key={o.label} type="button" onClick={() => setDuration(o.ms)} className={cn("h-8 text-[12px]", i > 0 && "border-l border-input", duration === o.ms ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={revocable} onChange={(e) => setRevocable(e.target.checked)} className="mt-0.5 accent-foreground" />
                <span>
                  <span className="block">Allow early revocation</span>
                  <span className="text-muted-foreground">Grantor may cancel this voucher before expiry.</span>
                </span>
              </label>
            </div>
            <div>
              <Label right={`${selected.length} selected`}>Scope — handles</Label>
              <div className="max-h-56 overflow-auto border border-input">
                {handles.map((h) => (
                  <label key={h.handle} className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 last:border-b-0 hover:bg-accent">
                    <input type="checkbox" checked={selected.includes(h.handle)} onChange={() => toggle(h.handle)} className="accent-foreground" />
                    <span className="flex-1">{h.label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{short(h.handle, 8, 4)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label right={`${verifiers.length} active`}>Verifier rules</Label>
            <VerifierSection value={verifiers} onChange={setVerifiers} />
          </div>

          {err && <p className="border border-destructive/40 px-3 py-2 text-destructive">{err}</p>}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
          <span className="font-mono text-[11px] text-muted-foreground">{aggregateErr ?? verifierErr ?? (onchain ? "Issued on Base Sepolia via MetaMask" : "Sample mode — deploy contract in Workspace settings")}</span>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant="solid" onClick={submit} disabled={busy || !valid}>{busy ? (onchain ? "Confirm in wallet…" : "Signing…") : "Issue voucher"}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
