import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Lock,
  Clock,
  ShieldCheck,
  Building2,
  Coins,
  FileCheck,
  Fingerprint,
} from "lucide-react";
import { useWallet } from "@/lib/wallet";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Obscura — Prove your numbers without revealing them" },
      {
        name: "description",
        content:
          "Obscura is a confidential audit tool for on-chain organizations. Issue time-limited, revocable access vouchers to auditors — without ever exposing the underlying values.",
      },
      { property: "og:title", content: "Obscura — Prove your numbers without revealing them" },
      {
        property: "og:description",
        content:
          "Scoped, revocable decryption vouchers for encrypted data on Inco. Confidential audits for on-chain organizations.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://obscura-icon.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://obscura-icon.lovable.app/" }],
  }),
  component: LandingPage,
});

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-4 items-center justify-center rounded-[3px] border border-foreground/60">
        <span className="size-1.5 rounded-[1px] bg-foreground" />
      </span>
      <span className="font-display text-[15px] font-medium tracking-tight">Obscura</span>
    </span>
  );
}

function Nav() {
  const w = useWallet();
  return (
    <nav className="sticky top-0 z-20 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-8 px-6">
        <Logo />
        <div className="hidden items-center gap-6 md:flex">
          <a href="#how-it-works" className="text-[13px] text-muted-foreground hover:text-foreground">How it works</a>
          <a href="#use-cases" className="text-[13px] text-muted-foreground hover:text-foreground">Use cases</a>
          <a href="#under-the-hood" className="text-[13px] text-muted-foreground hover:text-foreground">Docs</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-[13px] text-muted-foreground hover:text-foreground">GitHub</a>
        </div>
        <div className="ml-auto">
          <Link
            to="/dashboard"
            onClick={(e) => {
              if (!w.address) {
                e.preventDefault();
                w.connect();
              }
            }}
            className="inline-flex h-9 items-center rounded-sm border border-border-strong px-4 text-[13px] font-medium text-foreground hover:bg-accent"
          >
            Connect wallet
          </Link>
        </div>
      </div>
    </nav>
  );
}

function ProductPreview() {
  return (
    <div className="rounded-md border border-border bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="label-caps">Encrypted handles</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-success">
          <span className="size-1.5 rounded-full bg-success" /> Live
        </span>
      </div>
      <div className="space-y-px overflow-hidden rounded-sm border border-border">
        {[
          { h: "0x4f9c…a21e", label: "Payroll · Q3 total", v: "euint256" },
          { h: "0x8b1d…7f03", label: "Treasury reserve", v: "euint256" },
          { h: "0xc2e7…9d44", label: "Vendor payments · Sep", v: "euint256" },
        ].map((r) => (
          <div key={r.h} className="flex items-center gap-3 bg-background px-3 py-2">
            <span className="font-mono text-[11px] text-foreground">{r.h}</span>
            <span className="flex-1 truncate text-[11.5px] text-muted-foreground">{r.label}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{r.v}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-sm border border-border bg-background px-3 py-2">
        <span className="font-mono text-[11px] text-foreground">voucher #0142</span>
        <span className="flex-1 text-[11.5px] text-muted-foreground">auditor 0x7a…91bc · expires in 6d</span>
        <span className="rounded-[3px] border border-success/40 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-success">Active</span>
      </div>
      <div className="mt-3">
        <span className="label-caps">Verifier stack</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {["Time window", "Multi-sig 2/3", "Amount ≤ 50k"].map((v) => (
            <span key={v} className="rounded-[3px] border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-border px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" /> Built on Inco — Base Sepolia
          </span>
          <h1 className="mt-5 font-display text-[44px] font-medium leading-[1.1] tracking-tight">
            Prove your numbers without revealing them.
          </h1>
          <p className="mt-4 max-w-[480px] text-[16px] leading-relaxed text-muted-foreground">
            Obscura is a confidential audit tool for on-chain organizations. Issue time-limited, revocable access vouchers to auditors — without ever exposing the underlying values.
          </p>
          <div className="mt-7 flex gap-3">
            <Link
              to="/dashboard"
              className="inline-flex h-9 items-center rounded-sm bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              Launch app →
            </Link>
            <a
              href="#under-the-hood"
              className="inline-flex h-9 items-center rounded-sm border border-border-strong px-4 text-[13px] font-medium text-foreground hover:bg-accent"
            >
              Read the docs
            </a>
          </div>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}

const WHY = [
  {
    icon: Lock,
    heading: "Encrypted by default",
    text: "Every handle, balance, and value is stored as an euint256 on-chain. Not a commitment, not a hash — an actually encrypted value that only authorized parties can decrypt.",
  },
  {
    icon: Clock,
    heading: "Time-scoped access",
    text: "Vouchers carry an explicit expiry. When the audit window closes, decryption rights vanish automatically. No manual revocation required.",
  },
  {
    icon: ShieldCheck,
    heading: "Programmable rules",
    text: "Stack verifiers on top of any voucher — time windows, geographic restrictions, multi-sig approval, amount thresholds. All enforced before decryption is allowed.",
  },
];

function Why() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-[28px] font-medium tracking-tight">
          Blockchains are transparent. Audits don't have to be.
        </h2>
        <p className="mt-4 max-w-[640px] text-[14px] leading-relaxed text-muted-foreground">
          Every transaction, balance, and payroll amount on a public chain is visible to anyone. This makes real compliance impossible — you can't prove solvency to an auditor without exposing your entire balance sheet to competitors. Obscura uses Inco's confidential compute layer to let you grant scoped, time-limited decryption access to specific auditors, for specific records, without ever revealing the underlying values on-chain.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-0">
          {WHY.map((c, i) => (
            <div key={c.heading} className={i > 0 ? "md:border-l md:border-border md:pl-8" : "md:pr-8"}>
              <c.icon className="size-4 text-muted-foreground" />
              <h3 className="mt-3 text-[14px] font-medium text-foreground">{c.heading}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    heading: "Deposit encrypted records",
    text: "Your organization's financial data, payroll totals, or vendor payments live on-chain as encrypted handles. Obscura reads them directly from your wallet — no uploads, no central server.",
  },
  {
    n: "02",
    heading: "Issue a scoped voucher",
    text: "Choose an auditor, a set of records, an expiry window, and a disclosure mode (full value, range proof, comparison, or aggregate). Stack custom verifiers if needed.",
  },
  {
    n: "03",
    heading: "The auditor decrypts, then loses access",
    text: "The auditor decrypts exactly what you granted, for exactly as long as you granted it. After expiry, or when you revoke, the voucher is dead. Every action is recorded in an immutable audit trail.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-[28px] font-medium tracking-tight">
          Three steps. No cryptography required.
        </h2>
        <div className="mt-10 max-w-[720px] space-y-8">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-6">
              <span className="font-mono text-[28px] leading-none text-[#5A5E75]">{s.n}</span>
              <div>
                <h3 className="text-[15px] font-medium text-foreground">{s.heading}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const USE_CASES = [
  {
    icon: Building2,
    heading: "Payroll audits",
    text: "Prove to a tax authority that total payroll matches your records, without revealing individual salaries.",
  },
  {
    icon: Coins,
    heading: "Treasury attestation",
    text: "Show a foundation or DAO that your reserve balance is above a threshold, without exposing the exact amount.",
  },
  {
    icon: FileCheck,
    heading: "Vendor compliance",
    text: "Let an external auditor verify that all vendor payments are within policy, without seeing who you pay or how much.",
  },
  {
    icon: Fingerprint,
    heading: "Regulatory reporting",
    text: "Satisfy KYC/AML requirements with range proofs and comparison disclosures instead of full data dumps.",
  },
];

function UseCases() {
  return (
    <section id="use-cases" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-[28px] font-medium tracking-tight">
          Built for teams that can't afford to leak.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {USE_CASES.map((c) => (
            <div key={c.heading} className="rounded-md border border-border bg-panel p-5">
              <c.icon className="size-4 text-muted-foreground" />
              <h3 className="mt-3 text-[14px] font-medium text-foreground">{c.heading}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const CODE = `import {euint256, e} from "@inco/lightning/src/Lib.sol";

function deposit(bytes calldata encryptedAmount) external {
    euint256 amount = encryptedAmount.newEuint256(msg.sender);
    balances[msg.sender] = e.add(balances[msg.sender], amount);
}`;

function UnderTheHood() {
  return (
    <section id="under-the-hood" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-[28px] font-medium tracking-tight">
          Powered by Inco Lightning.
        </h2>
        <p className="mt-4 max-w-[640px] text-[14px] leading-relaxed text-muted-foreground">
          Obscura runs on Inco's confidential compute layer. Encrypted values live on-chain as euint256 handles. Decryption happens inside a trusted execution environment, not on a public node. Every state transition is verifiable end-to-end.
        </p>
        <pre className="mt-8 max-w-[720px] overflow-x-auto rounded-md border border-border bg-panel p-5 font-mono text-[12.5px] leading-relaxed text-foreground">
          {CODE}
        </pre>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-8">
      <Logo />
      <span className="text-[12px] text-muted-foreground">Confidential audits on Inco.</span>
      <div className="ml-auto flex items-center gap-5">
        <a href="#how-it-works" className="text-[12px] text-muted-foreground hover:text-foreground">How it works</a>
        <a href="#use-cases" className="text-[12px] text-muted-foreground hover:text-foreground">Use cases</a>
        <Link to="/dashboard" className="text-[12px] text-muted-foreground hover:text-foreground">Launch app</Link>
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <Why />
      <HowItWorks />
      <UseCases />
      <UnderTheHood />
      <Footer />
    </div>
  );
}
