"use client";

import { useState } from "react";
import { Check, Copy, Gift, Users } from "lucide-react";
import { useAll, useConfig } from "@/lib/content";
import { fmtDay } from "@/lib/payments";
import { useMyReferralCode } from "@/lib/promo";
import { useStore } from "@/lib/store";
import { AccountShell, PanelCard } from "@/components/home/AccountShell";

/** "j***@gmail.com": friends' emails are only partly shown. */
const mask = (email: string) => {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}***@${domain ?? ""}`;
};

export default function ReferPage() {
  const cfg = useConfig().referrals;
  const email = useStore((s) => s.user.email);
  const hydrated = useStore((s) => s.hydrated);
  const code = useMyReferralCode();
  const referrals = useAll("referrals").filter((r) => r.referrerEmail.toLowerCase() === email.toLowerCase());
  const [copied, setCopied] = useState(false);
  const link = hydrated ? `${window.location.origin}/auth/join?ref=${code}` : "";
  const rewarded = referrals.filter((r) => r.status === "rewarded");
  const days = rewarded.reduce((n, r) => n + (r.rewardDays ?? 0), 0);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the link is visible to copy by hand.
    }
  };

  if (!cfg.enabled)
    return (
      <AccountShell active="refer">
        <PanelCard title="Refer a Friend">
          <p className="text-base text-muted">Referrals aren&apos;t available right now. Check back soon.</p>
        </PanelCard>
      </AccountShell>
    );

  return (
    <AccountShell active="refer">
      <PanelCard title="Refer a Friend">
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-lg bg-primary-light p-4">
            <Gift className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-base text-ink">
              Your friend gets <b>{cfg.friendPercent}% off</b> their first plan.
            </p>
          </div>
          <div className="flex gap-3 rounded-lg bg-gold/10 p-4">
            <Gift className="mt-0.5 size-5 shrink-0 text-gold" />
            <p className="text-base text-ink">
              You get <b>{cfg.rewardDays} days of free Pro</b> when their payment is confirmed.
            </p>
          </div>
        </div>
        <p className="mb-2 text-sm font-medium text-muted">Your invite link</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input readOnly value={link} aria-label="Your invite link" onFocus={(e) => e.target.select()} className="h-[48px] min-w-0 flex-1 rounded-lg border border-line bg-background px-4 font-mono text-sm text-ink outline-none" />
          <button type="button" onClick={copy} className="flex h-[48px] cursor-pointer items-center justify-center gap-2 rounded-[64px] bg-primary px-5 font-semibold text-white shadow-press hover:bg-primary-hover">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          Your code: <span className="font-mono font-semibold text-ink">{code}</span>. Friends must create their account with your link.
        </p>
      </PanelCard>

      <PanelCard title="Your Referrals">
        <div className="mb-4 flex flex-wrap gap-6">
          <Stat label="Friends joined" value={referrals.length} />
          <Stat label="Became Pro" value={rewarded.length} />
          <Stat label="Free days earned" value={days} />
        </div>
        {referrals.length ? (
          <ul className="divide-y divide-line">
            {referrals.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2 text-base">
                <Users className="size-4 text-muted" />
                <span className="flex-1 text-ink">{mask(r.friendEmail)}</span>
                <span className="text-sm text-muted">{r.status === "rewarded" ? `+${r.rewardDays} days (until ${fmtDay(r.rewardUntil!)})` : `Joined ${fmtDay(r.joinedAt)}`}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base text-muted">No friends have joined with your link yet.</p>
        )}
      </PanelCard>
    </AccountShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-2xl font-bold text-ink tabular-nums">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
