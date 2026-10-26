"use client";

import { useMemo } from "react";
import { discounted, markReferralPaid, monthsLater, nextAccessStart, recordDiscountUse, referrerStatus, type Discount } from "@/lib/promo";
import { getAll, getConfig, useAll } from "@/lib/content";
import { useStore } from "@/lib/store";
import { newId, useAdminStore } from "@/lib/admin/store";
import type { FileRef, NotificationRec, PaymentMethodRec, PaymentRec, PlanRec, PromoCodeRec } from "@/lib/admin/types";

/*
 * Manual payments: the student sends money to one of the admin's accounts, uploads the
 * receipt, and an admin approves or rejects it (Admin > Payments). In the static build
 * everything lives in this browser; the backend will keep the same records and actually
 * send the queued Telegram alerts and emails.
 */

/** "$59" for USD, otherwise "1,500 ETB". */
export function formatPrice(amount: number, currency = getConfig().payments.currency): string {
  const n = amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return currency.toUpperCase() === "USD" ? `$${n}` : `${n} ${currency}`;
}

export const planLabel = (p: Pick<PlanRec, "months">) => `${p.months} Month${p.months > 1 ? "s" : ""} of Access`;

export const DISCOUNT_LABEL: Record<Discount["source"], (d: Discount) => string> = {
  promo: (d) => `code ${d.code}`,
  referral: () => "invited by a friend",
  reward: (d) => `referral reward (${d.referralIds?.length ?? 0} friends)`,
};

const newReference = () => `PAY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const nowIso = () => new Date().toISOString();
const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The signed-in student's payments, newest first. */
export function useMyPayments(): PaymentRec[] {
  const email = useStore((s) => s.user.email);
  const all = useAll("payments");
  return useMemo(() => all.filter((p) => sameEmail(p.userEmail, email)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)), [all, email]);
}

/** Published payment methods in admin order. */
export function usePaymentMethods(): PaymentMethodRec[] {
  const all = useAll("paymentMethods");
  return useMemo(() => all.filter((m) => m.status === "published" && m.accountNumber.trim()).sort((a, b) => a.order - b.order), [all]);
}

function queue(n: Omit<NotificationRec, "id" | "status" | "createdAt" | "updatedAt">, label: string) {
  const at = nowIso();
  useAdminStore.getState().save("notifications", [{ ...n, id: newId("note"), status: "queued", createdAt: at, updatedAt: at.slice(0, 10) }], { action: "create", label });
}

/** Student submits a receipt. Creates a pending payment and queues the admin's Telegram alert. */
/** `discount` comes from bestDiscount() (lib/promo); `promo` is recorded as used only when it is the one applied. */
export function submitPayment(input: { plan: PlanRec; method: PaymentMethodRec; receipt: FileRef; transactionId: string; discount: Discount | null; promo?: PromoCodeRec | null }): PaymentRec {
  const user = useStore.getState().user;
  const cfg = getConfig().payments;
  const at = nowIso();
  const discount = input.discount ?? undefined;
  const rec: PaymentRec = {
    id: newId("pay"),
    reference: newReference(),
    userEmail: user.email,
    userName: user.name || user.email,
    planId: input.plan.id,
    planLabel: planLabel(input.plan),
    months: input.plan.months,
    amount: discount ? discounted(input.plan.price, discount.percent) : input.plan.price,
    listPrice: input.plan.price,
    discount,
    currency: cfg.currency,
    methodId: input.method.id,
    methodName: input.method.name,
    methodKind: input.method.kind,
    accountNumber: input.method.accountNumber,
    receipt: input.receipt,
    transactionId: input.transactionId.trim(),
    status: "pending",
    submittedAt: at,
    updatedAt: at.slice(0, 10),
  };
  useAdminStore.getState().save("payments", [rec], { action: "create", label: `Payment ${rec.reference} submitted by ${rec.userEmail}` });
  if (input.promo && discount?.source === "promo") recordDiscountUse(input.promo, rec.id);
  queue(
    {
      channel: "telegram",
      to: cfg.telegram.enabled && cfg.telegram.chatId ? cfg.telegram.chatId : "(Telegram not set up)",
      subject: "New payment to review",
      body: [
        `New payment waiting for approval`,
        `Student: ${rec.userName} (${rec.userEmail})`,
        `Plan: ${rec.planLabel} · ${formatPrice(rec.amount, rec.currency)}${discount ? ` (${discount.percent}% off: ${DISCOUNT_LABEL[discount.source](discount)})` : ""}`,
        `Paid with: ${rec.methodName}${rec.transactionId ? ` · Transaction ${rec.transactionId}` : ""}`,
        `Reference: ${rec.reference}`,
        `Review: ${typeof window === "undefined" ? "" : window.location.origin}/admin/payments?edit=${rec.id}`,
      ].join("\n"),
      paymentId: rec.id,
    },
    `Telegram alert queued for payment ${rec.reference}`,
  );
  return rec;
}

/** Admin approves: the student gets Premium until `accessUntil`, and an email is queued. */
export function approvePayment(p: PaymentRec, message = "") {
  const admin = useAdminStore.getState().session?.email ?? "admin";
  // Access stacks on top of any time the student still has left (payments, codes, referral rewards).
  const until = monthsLater(nextAccessStart(p.userEmail), p.months);
  const next: PaymentRec = { ...p, status: "approved", reviewedAt: nowIso(), reviewedBy: admin, rejectReason: undefined, adminMessage: message.trim() || undefined, accessUntil: until };
  useAdminStore.getState().save("payments", [next], { action: "update", label: `Approved payment ${p.reference} (${p.userEmail})`, previous: [p] });
  grantPremium(p.userEmail);
  queue(
    {
      channel: "email",
      to: p.userEmail,
      subject: "Welcome to NCLEXBase Pro",
      body: [
        `Hi ${p.userName},`,
        ``,
        `Your payment (${p.reference}) has been confirmed and your NCLEXBase Pro access is now active.`,
        `Plan: ${p.planLabel}`,
        `Access until: ${fmtDay(until)}`,
        ``,
        `Every question, case study, readiness exam and resource is now unlocked. Sign in and keep going.`,
        ...(message.trim() ? [``, `Message from our team: ${message.trim()}`] : []),
        ``,
        `Good luck with your studies,`,
        `The NCLEXBase team`,
      ].join("\n"),
      paymentId: p.id,
    },
    `Approval email queued for ${p.userEmail}`,
  );
  // The friend now counts toward their referrer's discount on the referrer's next plan.
  const ref = markReferralPaid(p.userEmail, p.id);
  if (ref) {
    const st = referrerStatus(ref.referrerEmail);
    const lines = st.reward
      ? [`You now have ${st.available.length} invited friend${st.available.length === 1 ? "" : "s"} who went Pro, so your next plan is ${st.reward.percent}% off. It's applied automatically at checkout.`]
      : st.next
        ? [`${st.next.more} more friend${st.next.more === 1 ? "" : "s"} who go Pro and you'll get ${st.next.percent}% off your next plan.`]
        : [];
    queue(
      {
        channel: "email",
        to: ref.referrerEmail,
        subject: "A friend you invited joined NCLEXBase Pro",
        body: [`Hi,`, ``, `A friend you invited just joined NCLEXBase Pro. Thank you for sharing!`, ...lines, ``, `The NCLEXBase team`].join("\n"),
        paymentId: p.id,
      },
      `Referral email queued for ${ref.referrerEmail}`,
    );
  }
}

/** Admin rejects: the student sees the reason and can upload a new receipt. */
export function rejectPayment(p: PaymentRec, reason: string, message = "") {
  const admin = useAdminStore.getState().session?.email ?? "admin";
  const next: PaymentRec = { ...p, status: "rejected", reviewedAt: nowIso(), reviewedBy: admin, rejectReason: reason.trim(), adminMessage: message.trim() || undefined };
  useAdminStore.getState().save("payments", [next], { action: "update", label: `Rejected payment ${p.reference} (${p.userEmail})`, previous: [p] });
  queue(
    {
      channel: "email",
      to: p.userEmail,
      subject: "We couldn't confirm your payment",
      body: [
        `Hi ${p.userName},`,
        ``,
        `We reviewed your payment (${p.reference}) for ${p.planLabel} but couldn't confirm it.`,
        `Reason: ${reason.trim()}`,
        ...(message.trim() ? [``, `Message from our team: ${message.trim()}`] : []),
        ``,
        `Please sign in and upload a new receipt from the Upgrade page. If you think this is a mistake, reply to this email.`,
        ``,
        `The NCLEXBase team`,
      ].join("\n"),
      paymentId: p.id,
    },
    `Rejection email queued for ${p.userEmail}`,
  );
}

/** Premium for the student on this browser, and for a matching record in Admin > Users. */
function grantPremium(email: string) {
  const s = useStore.getState();
  if (sameEmail(s.user.email, email)) s.setPlan("premium");
  const users = getAll("users").filter((u) => sameEmail(u.email, email) && u.plan !== "premium");
  if (users.length) useAdminStore.getState().save("users", users.map((u) => ({ ...u, plan: "premium" as const })), { action: "update", label: `Gave Premium to ${email} (payment approved)`, previous: users });
}


export const fmtDay = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
