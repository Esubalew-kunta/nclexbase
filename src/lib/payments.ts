"use client";

import { useMemo } from "react";
import { addDays, todayISO } from "@/lib/daily";
import { getAll, getConfig, useAll } from "@/lib/content";
import { useStore } from "@/lib/store";
import { newId, useAdminStore } from "@/lib/admin/store";
import type { FileRef, NotificationRec, PaymentMethodRec, PaymentRec, PlanRec } from "@/lib/admin/types";

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
export function submitPayment(input: { plan: PlanRec; method: PaymentMethodRec; receipt: FileRef; transactionId: string }): PaymentRec {
  const user = useStore.getState().user;
  const cfg = getConfig().payments;
  const at = nowIso();
  const rec: PaymentRec = {
    id: newId("pay"),
    reference: newReference(),
    userEmail: user.email,
    userName: user.name || user.email,
    planId: input.plan.id,
    planLabel: planLabel(input.plan),
    months: input.plan.months,
    amount: input.plan.price,
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
  queue(
    {
      channel: "telegram",
      to: cfg.telegram.enabled && cfg.telegram.chatId ? cfg.telegram.chatId : "(Telegram not set up)",
      subject: "New payment to review",
      body: [
        `New payment waiting for approval`,
        `Student: ${rec.userName} (${rec.userEmail})`,
        `Plan: ${rec.planLabel} · ${formatPrice(rec.amount, rec.currency)}`,
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
export function approvePayment(p: PaymentRec) {
  const admin = useAdminStore.getState().session?.email ?? "admin";
  const start = [todayISO(), ...getAll("payments").filter((x) => x.id !== p.id && x.status === "approved" && sameEmail(x.userEmail, p.userEmail) && x.accessUntil).map((x) => x.accessUntil!)].sort().at(-1)!;
  // Access stacks on top of any time the student still has left.
  const from = start > todayISO() ? addDays(start, 1) : todayISO();
  const until = monthsLater(from, p.months);
  const next: PaymentRec = { ...p, status: "approved", reviewedAt: nowIso(), reviewedBy: admin, rejectReason: undefined, accessUntil: until };
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
        ``,
        `Good luck with your studies,`,
        `The NCLEXBase team`,
      ].join("\n"),
      paymentId: p.id,
    },
    `Approval email queued for ${p.userEmail}`,
  );
}

/** Admin rejects: the student sees the reason and can upload a new receipt. */
export function rejectPayment(p: PaymentRec, reason: string) {
  const admin = useAdminStore.getState().session?.email ?? "admin";
  const next: PaymentRec = { ...p, status: "rejected", reviewedAt: nowIso(), reviewedBy: admin, rejectReason: reason.trim() };
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

function monthsLater(from: string, months: number): string {
  const [y, m, d] = from.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  return addDays(dt.toISOString().slice(0, 10), -1);
}

export const fmtDay = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
