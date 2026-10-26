"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, CheckCircle2, Copy, ExternalLink, Landmark, Plus, Smartphone, XCircle } from "lucide-react";
import { crud, today } from "@/lib/admin/crud";
import { isPdfRef, useFileUrl } from "@/lib/admin/files";
import { newId, useAdminStore } from "@/lib/admin/store";
import type { NotificationRec, PaymentMethodRec, PaymentRec, PaymentStatus } from "@/lib/admin/types";
import { getAll, useAll, useConfig } from "@/lib/content";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { approvePayment, fmtDay, formatPrice, rejectPayment } from "@/lib/payments";
import { AdminPage, Badge, Btn, confirmDialog, Dialog, Drawer, Field, fmtDateTime, IconBtn, Input, Meta, Panel, Segmented, Switch, TextArea, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { DataTable, ListEmpty, ListToolbar, useEditParam, useList, type Column } from "@/components/admin/list";
import { DeleteRecordButton, StatusPicker } from "@/components/admin/parts";
import { PdfFrame } from "@/components/ui/files";

type Tab = "payments" | "methods" | "notifications" | "settings";
const TABS: { value: Tab; label: string }[] = [
  { value: "payments", label: "Payments" },
  { value: "methods", label: "Payment methods" },
  { value: "notifications", label: "Notifications" },
  { value: "settings", label: "Settings" },
];

const STATUS_TONE: Record<PaymentStatus, "warning" | "success" | "error"> = { pending: "warning", approved: "success", rejected: "error" };
const STATUS_LABEL: Record<PaymentStatus, string> = { pending: "Pending review", approved: "Approved", rejected: "Rejected" };
const dt = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—");

export default function PaymentsAdmin() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = (params.get("tab") as Tab) || "payments";
  const pending = useAll("payments").filter((p) => p.status === "pending").length;
  const setTab = (t: Tab) => router.replace(t === "payments" ? `${pathname}?status=pending` : `${pathname}?tab=${t}`, { scroll: false });

  return (
    <AdminPage
      title="Payments"
      description="Students pay by bank or wallet transfer and upload the receipt. Check each receipt against your account, then approve to give Premium or reject with a reason (the student can then upload a new one)."
      actions={pending > 0 ? <Badge tone="warning">{pending} waiting for review</Badge> : undefined}
    >
      <div className="mb-4">
        <Segmented value={tab} onChange={setTab} options={TABS} />
      </div>
      {tab === "payments" && <PaymentsTab />}
      {tab === "methods" && <MethodsTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "settings" && <SettingsTab />}
    </AdminPage>
  );
}

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

function PaymentsTab() {
  const rows = useAll("payments");
  const methods = useAll("paymentMethods");
  const edit = useEditParam();
  const list = useList<PaymentRec>({
    id: "payments",
    rows,
    search: (p) => `${p.reference} ${p.userName} ${p.userEmail} ${p.transactionId} ${p.methodName}`,
    filters: [
      { key: "status", label: "Status", options: (["pending", "approved", "rejected"] as const).map((s) => ({ value: s, label: STATUS_LABEL[s] })), match: (p, v) => p.status === v },
      { key: "method", label: "Method", options: methods.map((m) => ({ value: m.id, label: m.name })), match: (p, v) => p.methodId === v },
    ],
    sorts: {
      submitted: { label: "Submitted", value: (p) => p.submittedAt },
      amount: { label: "Amount", value: (p) => p.amount },
      student: { label: "Student", value: (p) => p.userName.toLowerCase() },
    },
    defaultSort: { key: "submitted", dir: "desc" },
  });
  const columns: Column<PaymentRec>[] = [
    {
      key: "student",
      label: "Student",
      sort: "student",
      render: (p) => (
        <div>
          <p className="font-medium">
            <StudentLink name={p.userName} email={p.userEmail} />
          </p>
          <p className="text-xs text-muted">{p.userEmail}</p>
        </div>
      ),
    },
    { key: "plan", label: "Plan", render: (p) => p.planLabel },
    { key: "amount", label: "Amount", sort: "amount", render: (p) => <span className="font-semibold tabular-nums">{formatPrice(p.amount, p.currency)}</span> },
    { key: "method", label: "Method", render: (p) => <span className="text-sm">{p.methodName}</span> },
    { key: "ref", label: "Reference", render: (p) => <span className="font-mono text-xs">{p.reference}</span> },
    { key: "submitted", label: "Submitted", sort: "submitted", render: (p) => <span className="text-xs text-muted">{dt(p.submittedAt)}</span> },
    { key: "status", label: "Status", render: (p) => <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge> },
  ];
  const open = rows.find((p) => p.id === edit.id);
  return (
    <>
      <ListToolbar list={list} placeholder="Search name, email, reference, transaction ID" />
      <DataTable list={list} columns={columns} rowId={(p) => p.id} onRowClick={(p) => edit.open(p.id)} empty={<ListEmpty list={list} noun="payments" />} />
      {open && <ReviewDrawer key={open.id + open.status} p={open} onClose={edit.close} />}
    </>
  );
}

function Receipt({ p }: { p: PaymentRec }) {
  const { href, missing } = useFileUrl(p.receipt.url);
  if (missing) return <p className="rounded-md border border-dashed border-line p-6 text-center text-sm text-muted">The receipt file is not available in this browser.</p>;
  return (
    <div className="overflow-hidden rounded-md border border-line bg-background">
      {isPdfRef(p.receipt) ? (
        <PdfFrame file={p.receipt} title={p.receipt.name} className="h-[420px]" />
      ) : href ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={href} alt={`Receipt ${p.reference}`} className="max-h-[520px] w-full object-contain" />
      ) : (
        <div className="h-60 animate-pulse" />
      )}
      <div className="flex items-center justify-between gap-2 border-t border-line bg-white px-3 py-2 text-xs text-muted">
        <span className="truncate">{p.receipt.name}</span>
        {href && (
          <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            <ExternalLink className="size-3.5" />
            Open full size
          </a>
        )}
      </div>
    </div>
  );
}

/** The student's page in Admin > Users: the student on this browser, or a matching user record. */
function useProfileHref(email: string): string | null {
  const local = useStore((s) => s.user.email);
  useAll("users");
  const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  if (same(local, email)) return "/admin/users?edit=local-student";
  const u = getAll("users").find((x) => same(x.email, email));
  return u ? `/admin/users?edit=${encodeURIComponent(u.id)}` : null;
}

function StudentLink({ name, email }: { name: string; email: string }) {
  const href = useProfileHref(email);
  if (!href) return <>{name}</>;
  return (
    <Link href={href} onClick={(e) => e.stopPropagation()} className="font-medium text-primary hover:underline" title="Open this student's profile">
      {name}
    </Link>
  );
}

const REJECT_REASONS = ["The receipt is unclear or unreadable.", "The amount doesn't match the plan price.", "We couldn't find this transfer in our account.", "The receipt appears to be for a different payment."];

function ReviewDrawer({ p, onClose }: { p: PaymentRec; onClose: () => void }) {
  const [deciding, setDeciding] = useState<"approve" | "reject" | null>(null);
  return (
    <Drawer
      open
      onClose={onClose}
      width={640}
      title={
        <span className="flex items-center gap-2">
          Payment <span className="font-mono">{p.reference}</span>
          <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
        </span>
      }
      footer={
        p.status === "pending" ? (
          <>
            <Btn variant="danger" onClick={() => setDeciding("reject")}>
              <XCircle className="size-4" />
              Reject
            </Btn>
            <Btn variant="primary" onClick={() => setDeciding("approve")}>
              <CheckCircle2 className="size-4" />
              Approve
            </Btn>
          </>
        ) : (
          <Btn onClick={onClose}>Close</Btn>
        )
      }
    >
      <div className="space-y-4">
        <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
          <Meta label="Student">
            <StudentLink name={p.userName} email={p.userEmail} />
            <span className="block text-xs text-muted">{p.userEmail}</span>
          </Meta>
          <Meta label="Plan">{p.planLabel}</Meta>
          <Meta label="Amount to find">
            <span className="text-lg font-bold">{formatPrice(p.amount, p.currency)}</span>
            {p.discount && (
              <span className="block text-xs text-muted">
                {p.discount.percent}% off {p.listPrice !== undefined ? formatPrice(p.listPrice, p.currency) : ""} · {p.discount.source === "promo" ? `code ${p.discount.code}` : "referral"}
              </span>
            )}
          </Meta>
          <Meta label="Paid with">
            {p.methodName}
            <span className="block text-xs text-muted">to {p.accountNumber}</span>
          </Meta>
          <Meta label="Transaction ID">{p.transactionId || <span className="text-muted">Not given</span>}</Meta>
          <Meta label="Submitted">{dt(p.submittedAt)}</Meta>
        </div>
        <Receipt p={p} />
        {p.status !== "pending" && (
          <div className={clsx("rounded-md border px-3 py-2 text-sm", p.status === "approved" ? "border-success/30 bg-success/5" : "border-error/30 bg-error/5")}>
            {p.status === "approved" ? "Approved" : "Rejected"} by {p.reviewedBy} on {dt(p.reviewedAt)}.
            {p.accessUntil && ` Premium until ${fmtDay(p.accessUntil)}.`}
            {p.rejectReason && <span className="block text-muted">Reason: {p.rejectReason}</span>}
            {p.adminMessage && <span className="block text-muted">Message sent: {p.adminMessage}</span>}
          </div>
        )}
      </div>
      {deciding && (
        <DecisionDialog
          p={p}
          kind={deciding}
          onClose={() => setDeciding(null)}
          onDone={() => {
            setDeciding(null);
            toast(deciding === "approve" ? `Approved. ${p.userName} is now Premium.` : `Rejected. ${p.userName} can upload a new receipt.`);
          }}
        />
      )}
    </Drawer>
  );
}

/** Approve or reject, with an optional message to the student (shown on their payment page and in the email). */
function DecisionDialog({ p, kind, onClose, onDone }: { p: PaymentRec; kind: "approve" | "reject"; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [message, setMessage] = useState("");
  const approve = kind === "approve";
  const run = () => {
    if (approve) approvePayment(p, message);
    else rejectPayment(p, reason, message);
    onDone();
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title={`${approve ? "Approve" : "Reject"} ${p.reference}`}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant={approve ? "primary" : "danger"} disabled={!approve && !reason.trim()} onClick={run}>
            {approve ? "Approve payment" : "Reject payment"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        {approve ? (
          <p className="text-sm text-muted">
            {p.userName} gets Premium for {p.months} month{p.months === 1 ? "" : "s"} and an email confirming it.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">The student sees the reason and can upload a new receipt.</p>
            <div className="flex flex-wrap gap-1.5">
              {REJECT_REASONS.map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)} className={clsx("cursor-pointer rounded-full border px-2.5 py-1 text-xs", reason === r ? "border-primary bg-primary-light text-primary" : "border-line text-ink hover:border-faint")}>
                  {r}
                </button>
              ))}
            </div>
            <Field label="Reason" required>
              <TextArea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
            </Field>
          </>
        )}
        <Field label="Message to the student (optional)" hint="Shown on their payment page and added to the email.">
          <TextArea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder={approve ? "e.g. Thanks for choosing NCLEXBase. Good luck on your exam!" : "e.g. Please upload the full receipt showing the transaction number."} />
        </Field>
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Payment methods                                                     */
/* ------------------------------------------------------------------ */

const methodsApi = crud("paymentMethods");

function MethodsTab() {
  const rows = useAll("paymentMethods").slice().sort((a, b) => a.order - b.order);
  const edit = useEditParam("method");
  const editing = edit.id === "new" ? null : rows.find((m) => m.id === edit.id);
  const move = (i: number, d: number) => {
    const ids = rows.map((m) => m.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    methodsApi.reorder(ids);
  };
  return (
    <Panel
      title="Payment methods"
      description="The accounts students can pay into. Only published methods with an account number are shown, in this order."
      actions={
        <Btn variant="primary" onClick={() => edit.open("new")}>
          <Plus className="size-4" />
          New method
        </Btn>
      }
      bodyClassName="p-0"
    >
      <ul className="divide-y divide-line">
        {rows.map((m, i) => (
          <li key={m.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">{m.kind === "bank" ? <Landmark className="size-4" /> : <Smartphone className="size-4" />}</span>
            <button type="button" onClick={() => edit.open(m.id)} className="min-w-0 flex-1 cursor-pointer text-left">
              <p className="font-medium text-ink">{m.name}</p>
              <p className="text-xs text-muted">{m.accountNumber ? `${m.accountName} · ${m.accountNumber}` : "No account details yet"}</p>
            </button>
            <Badge tone={m.status === "published" && m.accountNumber ? "success" : "neutral"}>{m.status === "published" ? (m.accountNumber ? "Shown to students" : "Missing details") : m.status === "draft" ? "Draft" : "Archived"}</Badge>
            <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
              <ArrowUp className="size-4" />
            </IconBtn>
            <IconBtn label="Move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
              <ArrowDown className="size-4" />
            </IconBtn>
          </li>
        ))}
        {!rows.length && <li className="px-4 py-8 text-center text-sm text-muted">No payment methods yet.</li>}
      </ul>
      {edit.id && (edit.id === "new" || editing) && <MethodEditor key={edit.id} rec={editing ?? null} count={rows.length} onClose={edit.close} />}
    </Panel>
  );
}

function MethodEditor({ rec, count, onClose }: { rec: PaymentMethodRec | null; count: number; onClose: () => void }) {
  const initial = useMemo<PaymentMethodRec>(() => rec ?? { id: newId("pm"), name: "", kind: "bank", accountName: "", accountNumber: "", instructions: "", status: "draft", order: count, updatedAt: today() }, [rec, count]);
  const [f, setF] = useState(initial);
  const dirty = !sameRecord(f, initial);
  useUnsavedGuard(dirty);
  const save = () => {
    if (!f.name.trim()) return toast("Give the method a name.", "error");
    if (f.status === "published" && (!f.accountName.trim() || !f.accountNumber.trim())) return toast("Add the account name and number before publishing.", "error");
    const next = { ...f, name: f.name.trim(), accountName: f.accountName.trim(), accountNumber: f.accountNumber.trim() };
    if (rec) methodsApi.update(next);
    else methodsApi.create(next);
    toast("Payment method saved");
    onClose();
  };
  const close = async () => {
    if (dirty && !(await confirmDialog({ title: "Discard changes?", confirm: "Discard", danger: true }))) return;
    onClose();
  };
  return (
    <Drawer
      open
      onClose={close}
      title={rec ? rec.name || "Payment method" : "New payment method"}
      footer={
        <>
          {rec && <DeleteRecordButton status={rec.status} noun="payment method" onDelete={() => (methodsApi.hardDelete([rec.id]), onClose())} />}
          <span className="flex-1" />
          <Btn onClick={close}>Cancel</Btn>
          <Btn variant="primary" onClick={save}>
            Save
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Type">
          <Segmented
            value={f.kind}
            onChange={(kind) => setF({ ...f, kind })}
            options={[
              { value: "bank", label: "Bank transfer" },
              { value: "wallet", label: "Mobile wallet" },
            ]}
          />
        </Field>
        <Field label="Name" required hint="What students pick, e.g. “Commercial Bank of Ethiopia (CBE)” or “telebirr”.">
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Account holder name" required>
          <Input value={f.accountName} onChange={(e) => setF({ ...f, accountName: e.target.value })} placeholder="Name on the account" />
        </Field>
        <Field label={f.kind === "bank" ? "Account number" : "Phone / wallet number"} required>
          <Input value={f.accountNumber} onChange={(e) => setF({ ...f, accountNumber: e.target.value })} className="font-mono" />
        </Field>
        <Field label="Instructions (optional)" hint="Shown under the account details.">
          <TextArea value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} rows={3} />
        </Field>
        <Field label="Status" hint="Published methods with an account number are shown to students.">
          <StatusPicker value={f.status} onChange={(status) => setF({ ...f, status })} />
        </Field>
      </div>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* Notifications log                                                   */
/* ------------------------------------------------------------------ */

function NotificationsTab() {
  const rows = useAll("notifications")
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const [channel, setChannel] = useState<"all" | NotificationRec["channel"]>("all");
  const shown = rows.filter((n) => channel === "all" || n.channel === channel);
  const copy = async (n: NotificationRec) => {
    try {
      await navigator.clipboard.writeText(n.body);
      toast("Copied");
    } catch {
      toast("Couldn't copy.", "error");
    }
  };
  return (
    <Panel
      title="Notifications"
      description="Telegram alerts to admins (new payments) and emails to students (approved / rejected). They are queued here: sending needs the backend, so for now copy and send them by hand if you need to."
      actions={
        <Segmented
          value={channel}
          onChange={setChannel}
          options={[
            { value: "all", label: "All" },
            { value: "telegram", label: "Telegram" },
            { value: "email", label: "Email" },
          ]}
        />
      }
      bodyClassName="p-0"
    >
      <ul className="divide-y divide-line">
        {shown.map((n) => (
          <li key={n.id} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={n.channel === "telegram" ? "teal" : "gold"}>{n.channel === "telegram" ? "Telegram" : "Email"}</Badge>
              <span className="text-sm font-semibold text-ink">{n.subject}</span>
              <span className="text-xs text-muted">to {n.to}</span>
              <span className="flex-1" />
              <Badge tone={n.status === "sent" ? "success" : "neutral"}>{n.status === "sent" ? "Sent" : "Queued"}</Badge>
              <span className="text-xs text-muted">{fmtDateTime(n.createdAt)}</span>
              <IconBtn label="Copy message" onClick={() => copy(n)}>
                <Copy className="size-4" />
              </IconBtn>
            </div>
            <pre className="mt-2 rounded-md bg-background p-3 font-sans text-sm whitespace-pre-wrap text-ink">{n.body}</pre>
          </li>
        ))}
        {!shown.length && <li className="px-4 py-8 text-center text-sm text-muted">Nothing yet. Alerts appear here when students submit payments.</li>}
      </ul>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function SettingsTab() {
  const cfg = useConfig().payments;
  const [f, setF] = useState(cfg);
  const dirty = !sameRecord(f, cfg);
  useUnsavedGuard(dirty);
  const save = () => {
    if (!f.currency.trim()) return toast("Set a currency.", "error");
    useAdminStore.getState().setConfig({ payments: { ...f, currency: f.currency.trim().toUpperCase() } }, "Updated payment settings");
    toast("Payment settings saved");
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Prices and messages">
        <div className="space-y-4">
          <Field label="Currency" hint="Shown with every price, e.g. ETB. Set plan prices in Plans & Access.">
            <Input value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} className="w-32 uppercase" />
          </Field>
          <Field label="Review time" hint="Completes “Your Pro access will be activated …” after a student submits.">
            <Input value={f.reviewTime} onChange={(e) => setF({ ...f, reviewTime: e.target.value })} />
          </Field>
        </div>
      </Panel>
      <Panel title="Telegram alerts" description="Get a Telegram message when a new payment is waiting.">
        <div className="space-y-4">
          <Switch checked={f.telegram.enabled} onChange={(enabled) => setF({ ...f, telegram: { ...f.telegram, enabled } })} label="Alert admins on Telegram" />
          <Field label="Chat ID" hint="The Telegram chat or group that receives alerts (from your bot, e.g. via @userinfobot).">
            <Input value={f.telegram.chatId} onChange={(e) => setF({ ...f, telegram: { ...f.telegram, chatId: e.target.value } })} disabled={!f.telegram.enabled} className="font-mono" />
          </Field>
          <p className="rounded-md border border-line bg-background px-3 py-2 text-xs text-muted">
            The bot token must stay on the server, so messages are actually sent once the backend exists. Until then each alert waits in the Notifications tab.
          </p>
        </div>
      </Panel>
      <div className="lg:col-span-2">
        <Btn variant="primary" onClick={save} disabled={!dirty}>
          Save settings
        </Btn>
      </div>
    </div>
  );
}
