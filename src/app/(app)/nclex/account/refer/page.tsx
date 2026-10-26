"use client";

import clsx from "clsx";
import { useState } from "react";
import { Check, Copy, Gift, Users } from "lucide-react";
import { useAll, useConfig } from "@/lib/content";
import { fmtDay } from "@/lib/payments";
import { referrerStatus, sortedTiers, useMyReferralCode } from "@/lib/promo";
import { useStore } from "@/lib/store";
import { AccountShell, PanelCard } from "@/components/home/AccountShell";
import { ButtonLink } from "@/components/ui/primitives";

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
  useAll("payments");
  const status = referrerStatus(email);
  const available = new Set(status.available.map((r) => r.id));
  const tiers = sortedTiers(cfg.tiers);
  const [copied, setCopied] = useState(false);
  const link = hydrated ? `${window.location.origin}/auth/join?ref=${code}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the link is visible to copy by hand.
    }
  };

  if (!cfg.enabled || !tiers.length)
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
        <p className="mb-4 text-base text-ink">
          Invite friends with your link. When they buy Pro, you get a discount on your next plan. The more friends who go Pro, the bigger the discount.
          {cfg.friendPercent > 0 && ` Your friends also get ${cfg.friendPercent}% off their first plan.`}
        </p>
        <div className="mb-5 flex flex-wrap gap-2">
          {tiers.map((t) => {
            const reached = status.available.length >= t.friends;
            return (
              <div key={t.friends} className={clsx("rounded-lg border px-4 py-3", reached ? "border-success/40 bg-success/5" : "border-line bg-background")}>
                <p className="text-sm text-muted">
                  {t.friends} friend{t.friends === 1 ? "" : "s"} go Pro
                </p>
                <p className="text-xl font-bold text-ink">{t.percent}% off</p>
              </div>
            );
          })}
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

      <PanelCard title="Your Reward">
        <div className="mb-4 flex flex-wrap gap-6">
          <Stat label="Friends joined" value={status.joined} />
          <Stat label="Went Pro" value={status.paid} />
          <Stat label="Counting toward your discount" value={status.available.length} />
        </div>
        {status.reward ? (
          <div className="flex flex-col gap-3 rounded-lg bg-success/10 p-4 sm:flex-row sm:items-center">
            <Gift className="size-6 shrink-0 text-success" />
            <p className="flex-1 text-base text-ink">
              Your next plan is <b>{status.reward.percent}% off</b>. It&apos;s applied automatically at checkout.
              {status.next && ` Reach ${status.next.friends} friends for ${status.next.percent}% off instead.`}
            </p>
            <ButtonLink href="/nclex/upgrade">Use it now</ButtonLink>
          </div>
        ) : (
          status.next && (
            <p className="rounded-lg bg-primary-light p-4 text-base text-ink">
              {status.next.more} more friend{status.next.more === 1 ? "" : "s"} who go{status.next.more === 1 ? "es" : ""} Pro and your next plan is <b>{status.next.percent}% off</b>.
            </p>
          )
        )}
        <p className="mt-3 text-sm text-muted">Using a discount uses up that tier&apos;s number of friends; any extra friends keep counting toward your next discount.</p>
      </PanelCard>

      <PanelCard title="Your Referrals">
        {referrals.length ? (
          <ul className="divide-y divide-line">
            {referrals.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2 text-base">
                <Users className="size-4 text-muted" />
                <span className="flex-1 text-ink">{mask(r.friendEmail)}</span>
                <span className="text-sm text-muted">
                  {r.status === "joined" ? `Joined ${fmtDay(r.joinedAt)}` : available.has(r.id) ? `Went Pro ${fmtDay(r.paidAt ?? r.updatedAt)}` : "Went Pro · used for a discount"}
                </span>
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
