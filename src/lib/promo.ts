"use client";

import { useEffect, useMemo } from "react";
import { addDays, todayISO } from "@/lib/daily";
import { getAll, getConfig, useAll } from "@/lib/content";
import { useStore } from "@/lib/store";
import { newId, useAdminStore } from "@/lib/admin/store";
import type { PromoCodeRec, RedemptionRec, ReferralRec } from "@/lib/admin/types";

/*
 * Pro access from every source (approved payments, free-access promo codes, referral rewards),
 * promo code checks, and referrals. Static build: all of it lives in this browser's admin data.
 */

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const nowIso = () => new Date().toISOString();

/* ------------------------------------------------------------------ */
/* Access windows                                                      */
/* ------------------------------------------------------------------ */

export interface AccessWindow {
  from: string;
  until: string;
  source: "payment" | "promo" | "referral";
}

/** Every period of Pro access granted to this email. */
export function accessWindows(email: string): AccessWindow[] {
  const out: AccessWindow[] = [];
  for (const p of getAll("payments")) if (same(p.userEmail, email) && p.status === "approved" && p.accessUntil) out.push({ from: (p.reviewedAt ?? p.submittedAt).slice(0, 10), until: p.accessUntil, source: "payment" });
  for (const r of getAll("redemptions")) if (same(r.email, email) && r.kind === "access" && r.accessFrom && r.accessUntil) out.push({ from: r.accessFrom, until: r.accessUntil, source: "promo" });
  for (const r of getAll("referrals")) if (same(r.referrerEmail, email) && r.status === "rewarded" && r.rewardFrom && r.rewardUntil) out.push({ from: r.rewardFrom, until: r.rewardUntil, source: "referral" });
  return out;
}

/** Last day of access that is current or upcoming (null when none). */
export function accessEnd(email: string): string | null {
  const today = todayISO();
  const ends = accessWindows(email)
    .filter((w) => w.until >= today)
    .map((w) => w.until)
    .sort();
  return ends.at(-1) ?? null;
}

/** First day a new grant of access should start: today, or the day after current access ends. */
export function nextAccessStart(email: string): string {
  const end = accessEnd(email);
  return end ? addDays(end, 1) : todayISO();
}

export function monthsLater(from: string, months: number): string {
  const [y, m, d] = from.split("-").map(Number);
  return addDays(new Date(Date.UTC(y, m - 1 + months, d)).toISOString().slice(0, 10), -1);
}

/**
 * Keeps the signed-in student's plan in step with their access windows: Premium while any
 * window covers today, Free once they have all ended. Students with no windows are left alone.
 */
export function useAccessSync() {
  const email = useStore((s) => s.user.email);
  const plan = useStore((s) => s.user.plan);
  const hydrated = useStore((s) => s.hydrated);
  const payments = useAll("payments");
  const redemptions = useAll("redemptions");
  const referrals = useAll("referrals");
  useEffect(() => {
    if (!hydrated || !email) return;
    const windows = accessWindows(email);
    if (!windows.length) return;
    const today = todayISO();
    const want = windows.some((w) => w.from <= today && today <= w.until) ? "premium" : "free";
    if (plan !== want) useStore.getState().setPlan(want);
  }, [hydrated, email, plan, payments, redemptions, referrals]);
}

/* ------------------------------------------------------------------ */
/* Promo codes                                                         */
/* ------------------------------------------------------------------ */

/** Uses that count: access redemptions, and discounts whose payment wasn't rejected. */
function liveRedemptions(code: PromoCodeRec): RedemptionRec[] {
  const payments = getAll("payments");
  return getAll("redemptions").filter((r) => r.codeId === code.id && (!r.paymentId || payments.find((p) => p.id === r.paymentId)?.status !== "rejected"));
}

export const promoUses = (code: PromoCodeRec) => liveRedemptions(code).length;

export type PromoCheck = { ok: true; promo: PromoCodeRec } | { ok: false; error: string };

/** Can this student use this code (optionally for this plan)? */
export function checkPromo(input: string, email: string, planId?: string): PromoCheck {
  const code = input.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a code." };
  const promo = getAll("promoCodes").find((c) => c.code.toUpperCase() === code);
  const today = todayISO();
  if (!promo || promo.status !== "active") return { ok: false, error: "That code isn't valid. Check it and try again." };
  if (promo.validFrom && today < promo.validFrom) return { ok: false, error: "This code isn't active yet." };
  if (promo.validUntil && today > promo.validUntil) return { ok: false, error: "This code has expired." };
  if (promo.kind === "access" && promo.accessUntil && today > promo.accessUntil) return { ok: false, error: "This code has expired." };
  const uses = liveRedemptions(promo);
  if (promo.maxUses && uses.length >= promo.maxUses) return { ok: false, error: "This code has reached its limit." };
  if (uses.some((r) => same(r.email, email))) return { ok: false, error: "You've already used this code." };
  if (promo.kind === "percent" && planId && promo.plans.length && !promo.plans.includes(planId)) return { ok: false, error: "This code doesn't apply to the selected plan." };
  return { ok: true, promo };
}

/** Free-access code: records the use and gives Pro for the code's dates. */
export function redeemAccess(promo: PromoCodeRec): { from: string; until: string } {
  const user = useStore.getState().user;
  const from = promo.accessFrom && promo.accessFrom > todayISO() ? promo.accessFrom : todayISO();
  const at = nowIso();
  const rec: RedemptionRec = { id: newId("red"), codeId: promo.id, code: promo.code, kind: "access", email: user.email, name: user.name, accessFrom: from, accessUntil: promo.accessUntil, at, updatedAt: at.slice(0, 10) };
  useAdminStore.getState().save("redemptions", [rec], { action: "create", label: `${user.email} redeemed ${promo.code}` });
  if (from <= todayISO()) useStore.getState().setPlan("premium");
  return { from, until: promo.accessUntil };
}

/** Discount code used with a payment (counted against the code while the payment isn't rejected). */
export function recordDiscountUse(promo: PromoCodeRec, paymentId: string) {
  const user = useStore.getState().user;
  const at = nowIso();
  const rec: RedemptionRec = { id: newId("red"), codeId: promo.id, code: promo.code, kind: "percent", email: user.email, name: user.name, paymentId, percent: promo.percent, at, updatedAt: at.slice(0, 10) };
  useAdminStore.getState().save("redemptions", [rec], { action: "create", label: `${user.email} used ${promo.code} at checkout` });
}

export const discounted = (price: number, percent: number) => Math.round(price * (100 - percent)) / 100;

/* ------------------------------------------------------------------ */
/* Referrals                                                           */
/* ------------------------------------------------------------------ */

function hash(s: string) {
  let h = 2166136261;
  for (const c of s.toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(36).toUpperCase();
}

/** The student's own referral code, registered so join links can find them. */
export function useMyReferralCode(): string {
  const user = useStore((s) => s.user);
  // Writing before both stores have loaded would overwrite the saved admin data.
  const hydrated = useStore((s) => s.hydrated);
  const codes = useAll("referralCodes");
  const code = useMemo(() => `R${hash(user.email).slice(0, 6).padStart(6, "0")}`, [user.email]);
  useEffect(() => {
    if (!hydrated || !user.email || codes.some((c) => c.id === code)) return;
    const at = nowIso();
    useAdminStore.getState().save("referralCodes", [{ id: code, email: user.email, name: user.name, createdAt: at, updatedAt: at.slice(0, 10) }], { action: "create", label: `Referral code ${code} for ${user.email}` });
  }, [hydrated, code, codes, user.email, user.name]);
  return code;
}

/** On sign-up with ?ref=CODE: remember the code and record the referral (never your own code). */
export function recordReferralJoin(code: string, friendEmail: string): boolean {
  const cfg = getConfig().referrals;
  const owner = getAll("referralCodes").find((c) => c.id === code.trim().toUpperCase());
  if (!cfg.enabled || !owner || same(owner.email, friendEmail)) return false;
  if (getAll("referrals").some((r) => same(r.friendEmail, friendEmail))) return false;
  const at = nowIso();
  const rec: ReferralRec = { id: newId("ref"), referrerEmail: owner.email, referrerCode: owner.id, friendEmail, joinedAt: at, status: "joined", updatedAt: at.slice(0, 10) };
  useAdminStore.getState().save("referrals", [rec], { action: "create", label: `${friendEmail} joined with ${owner.email}'s referral link` });
  useStore.setState((s) => ({ user: { ...s.user, referredBy: owner.id } }));
  return true;
}

/** The referral discount this student can use now (first payment only), or null. */
export function referralDiscount(email: string, referredBy: string | undefined): { code: string; percent: number } | null {
  const cfg = getConfig().referrals;
  if (!cfg.enabled || !referredBy || cfg.friendPercent <= 0) return null;
  const ref = getAll("referrals").find((r) => same(r.friendEmail, email));
  if (!ref || ref.status !== "joined") return null;
  if (getAll("payments").some((p) => same(p.userEmail, email) && p.status === "approved")) return null;
  return { code: referredBy, percent: cfg.friendPercent };
}

/** Called when a payment is approved: reward the friend's referrer once. Returns the referral, if any. */
export function rewardReferrer(friendEmail: string, paymentId: string): ReferralRec | null {
  const cfg = getConfig().referrals;
  const ref = getAll("referrals").find((r) => same(r.friendEmail, friendEmail) && r.status === "joined");
  if (!cfg.enabled || !ref || cfg.rewardDays <= 0) return null;
  const from = nextAccessStart(ref.referrerEmail);
  const until = addDays(from, cfg.rewardDays - 1);
  const next: ReferralRec = { ...ref, status: "rewarded", paymentId, rewardDays: cfg.rewardDays, rewardFrom: from, rewardUntil: until };
  useAdminStore.getState().save("referrals", [next], { action: "update", label: `${ref.referrerEmail} earned ${cfg.rewardDays} Pro days (referral)`, previous: [ref] });
  const users = getAll("users").filter((u) => same(u.email, ref.referrerEmail) && u.plan !== "premium");
  if (users.length) useAdminStore.getState().save("users", users.map((u) => ({ ...u, plan: "premium" as const })), { action: "update", label: `Gave Premium to ${ref.referrerEmail} (referral reward)`, previous: users });
  return next;
}
