"use client";

import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef, useState, type ReactNode } from "react";
import { Check, CheckCircle2, Clock, Copy, FileText, ImageIcon, Landmark, Loader2, Smartphone, UploadCloud, X, XCircle } from "lucide-react";
import { MAX_RECEIPT_MB, deleteStored, storeReceipt } from "@/lib/admin/files";
import type { FileRef, PaymentMethodRec, PaymentRec } from "@/lib/admin/types";
import { useConfig, usePlans } from "@/lib/content";
import { fmtDay, formatPrice, planLabel, submitPayment, useMyPayments, usePaymentMethods } from "@/lib/payments";
import { useStore } from "@/lib/store";
import { Button, ButtonLink, Card, PageHeader } from "@/components/ui/primitives";

export default function CheckoutPage() {
  return (
    <Suspense>
      <Checkout />
    </Suspense>
  );
}

function Checkout() {
  const hydrated = useStore((s) => s.hydrated);
  const plan = useStore((s) => s.user.plan);
  const payments = useMyPayments();
  const latest = payments[0];
  const header = <PageHeader trail={[{ label: "Upgrade", href: "/nclex/upgrade" }, { label: "Payment" }]} title="Complete your payment" />;
  if (!hydrated) return header;
  if (latest?.status === "pending") return <PendingView p={latest} />;
  if (latest?.status === "approved" && plan === "premium") return <ApprovedView p={latest} />;
  return (
    <>
      {header}
      <PaymentForm rejected={latest?.status === "rejected" ? latest : undefined} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

function Step({ n, title, done, children, muted }: { n: number; title: string; done?: boolean; children?: ReactNode; muted?: boolean }) {
  return (
    <Card className={clsx("p-5 sm:p-6", muted && "opacity-60")}>
      <div className="flex items-center gap-3">
        <span className={clsx("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", done ? "bg-success text-white" : "bg-primary text-white")}>{done ? <Check className="size-4" strokeWidth={3} /> : n}</span>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </Card>
  );
}

function PaymentForm({ rejected }: { rejected?: PaymentRec }) {
  const params = useSearchParams();
  const plans = usePlans();
  const methods = usePaymentMethods();
  const { reviewTime } = useConfig().payments;
  const [planId, setPlanId] = useState(() => params.get("plan") ?? rejected?.planId ?? "");
  const [methodId, setMethodId] = useState(() => rejected?.methodId ?? "");
  const [receipt, setReceipt] = useState<FileRef | null>(null);
  const [txn, setTxn] = useState("");
  const [busy, setBusy] = useState(false);
  const plan = plans.find((p) => p.id === planId);
  const method = methods.find((m) => m.id === methodId);

  const submit = () => {
    if (!plan || !method || !receipt) return;
    setBusy(true);
    submitPayment({ plan, method, receipt, transactionId: txn });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-[760px] space-y-4">
      {rejected && (
        <div className="flex gap-3 rounded-lg border border-error/30 bg-error/5 p-4 text-ink">
          <XCircle className="mt-0.5 size-5 shrink-0 text-error" />
          <div>
            <p className="font-semibold">We couldn&apos;t confirm your last payment ({rejected.reference}).</p>
            {rejected.rejectReason && <p className="mt-1 text-muted">Reason: {rejected.rejectReason}</p>}
            <p className="mt-1 text-muted">Please check the details below and upload a new receipt.</p>
          </div>
        </div>
      )}

      <Step n={1} title="Your plan" done={Boolean(plan)}>
        <div className="grid gap-2 sm:grid-cols-3">
          {plans.map((p) => (
            <ChoiceCard key={p.id} selected={p.id === planId} onClick={() => setPlanId(p.id)}>
              <span className="block font-semibold text-ink">{planLabel(p)}</span>
              <span className="mt-1 block text-xl font-bold text-ink">{formatPrice(p.price)}</span>
            </ChoiceCard>
          ))}
        </div>
      </Step>

      <Step n={2} title="Choose how you'll pay" done={Boolean(method)} muted={!plan}>
        {plan &&
          (methods.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {methods.map((m) => (
                <ChoiceCard key={m.id} selected={m.id === methodId} onClick={() => setMethodId(m.id)}>
                  <span className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">{m.kind === "bank" ? <Landmark className="size-5" /> : <Smartphone className="size-5" />}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{m.name}</span>
                      <span className="text-sm text-muted">{m.kind === "bank" ? "Bank transfer" : "Mobile wallet"}</span>
                    </span>
                  </span>
                </ChoiceCard>
              ))}
            </div>
          ) : (
            <p className="text-muted">Payment options are being set up. Please check back soon, or contact us through Help.</p>
          ))}
      </Step>

      <Step n={3} title="Send the payment" done={Boolean(receipt)} muted={!method}>
        {plan && method && <AccountDetails method={method} amount={formatPrice(plan.price)} />}
      </Step>

      <Step n={4} title="Upload your receipt" done={false} muted={!method}>
        {plan && method && (
          <div className="space-y-4">
            <ReceiptDrop value={receipt} onChange={setReceipt} />
            <label className="block">
              <span className="text-sm font-semibold text-ink">Transaction ID (optional)</span>
              <input
                value={txn}
                onChange={(e) => setTxn(e.target.value)}
                placeholder="e.g. FT26299XXXXX"
                className="mt-1 h-[42px] w-full rounded-xl border border-line px-4 text-base text-ink outline-none focus:border-faint"
              />
            </label>
            <Button onClick={submit} disabled={!receipt || busy} className="w-full sm:w-auto">
              {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Submit payment for review
            </Button>
            <p className="text-sm text-muted">We usually confirm payments {reviewTime}. You&apos;ll get an email as soon as your Pro access is active.</p>
          </div>
        )}
      </Step>
    </div>
  );
}

function ChoiceCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx("relative cursor-pointer rounded-xl border-2 p-4 text-left transition-colors", selected ? "border-primary bg-primary-light" : "border-line bg-white hover:border-primary/40")}
    >
      {selected && (
        <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
      {children}
    </button>
  );
}

function CopyRow({ label, value, big }: { label: string; value: string; big?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the value is still visible to copy by hand.
    }
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted">{label}</p>
        <p className={clsx("font-semibold break-all text-ink", big ? "font-mono text-xl tracking-wide" : "text-base")}>{value}</p>
      </div>
      <button type="button" onClick={copy} className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary-light">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function AccountDetails({ method, amount }: { method: PaymentMethodRec; amount: string }) {
  return (
    <div>
      <p className="mb-3 text-ink">
        Send exactly <b>{amount}</b> to the {method.kind === "bank" ? "account" : "wallet"} below, then keep the receipt or a screenshot.
      </p>
      <div className="divide-y divide-line rounded-xl border border-line bg-background">
        <CopyRow label="Amount" value={amount} />
        <CopyRow label={method.kind === "bank" ? "Bank" : "Wallet"} value={method.name} />
        <CopyRow label="Account name" value={method.accountName} />
        <CopyRow label={method.kind === "bank" ? "Account number" : "Phone / wallet number"} value={method.accountNumber} big />
      </div>
      {method.instructions && <p className="mt-3 text-sm whitespace-pre-line text-muted">{method.instructions}</p>}
    </div>
  );
}

function ReceiptDrop({ value, onChange }: { value: FileRef | null; onChange: (f: FileRef | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const take = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      if (value) await deleteStored(value.url);
      onChange(await storeReceipt(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  if (value)
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/40 bg-success/5 p-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary">{value.name.toLowerCase().endsWith(".pdf") ? <FileText className="size-5" /> : <ImageIcon className="size-5" />}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{value.name}</p>
          <p className="text-sm text-muted">{value.sizeKb >= 1024 ? `${(value.sizeKb / 1024).toFixed(1)} MB` : `${value.sizeKb} KB`} · ready to submit</p>
        </div>
        <button
          type="button"
          aria-label="Remove this file"
          onClick={async () => (await deleteStored(value.url), onChange(null))}
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-white hover:text-error"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void take(e.dataTransfer.files[0]);
        }}
        className={clsx("flex w-full cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors", over ? "border-primary bg-primary-light" : "border-line bg-white hover:border-primary/50")}
      >
        {busy ? <Loader2 className="mb-2 size-8 animate-spin text-primary" /> : <UploadCloud className="mb-2 size-8 text-primary" />}
        <span className="font-semibold text-ink">{busy ? "Uploading…" : "Drop your receipt here or tap to choose"}</span>
        <span className="mt-1 text-sm text-muted">One PDF or image (JPG, PNG, WebP), up to {MAX_RECEIPT_MB} MB</span>
      </button>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      <input ref={input} type="file" accept="application/pdf,.pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => (void take(e.target.files?.[0]), (e.target.value = ""))} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* After submitting                                                    */
/* ------------------------------------------------------------------ */

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}

function PendingView({ p }: { p: PaymentRec }) {
  const { reviewTime } = useConfig().payments;
  const setUi = useStore((s) => s.setUi);
  return (
    <div className="mx-auto max-w-[620px] pt-6">
      <Card className="p-6 text-center sm:p-8">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-gold/15 text-gold">
          <Clock className="size-8" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink">Payment received, verification in progress</h1>
        <p className="mt-2 text-base leading-6 text-muted">
          Thank you, {p.userName}. We&apos;ve received your receipt and our team is verifying your payment. Your Pro access will be activated {reviewTime}, and we&apos;ll email you at <b className="text-ink">{p.userEmail}</b> as soon as it&apos;s
          ready.
        </p>
        <dl className="mt-6 divide-y divide-line rounded-xl border border-line px-4 text-left text-[15px]">
          <Detail label="Reference" value={<span className="font-mono">{p.reference}</span>} />
          <Detail label="Plan" value={p.planLabel} />
          <Detail label="Amount" value={formatPrice(p.amount, p.currency)} />
          <Detail label="Paid with" value={p.methodName} />
          <Detail label="Receipt" value={p.receipt.name} />
          <Detail label="Submitted" value={new Date(p.submittedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} />
        </dl>
        <p className="mt-4 text-sm text-muted">No need to upload anything else. Questions? Quote your reference when you contact us.</p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <ButtonLink href="/nclex">Back to studying</ButtonLink>
          <Button variant="secondary" onClick={() => setUi({ contactOpen: true })}>
            Contact support
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ApprovedView({ p }: { p: PaymentRec }) {
  return (
    <div className="mx-auto max-w-[620px] pt-6">
      <Card className="p-6 text-center sm:p-8">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink">You&apos;re NCLEXBase Pro</h1>
        <p className="mt-2 text-base leading-6 text-muted">Your payment was confirmed and everything is unlocked{p.accessUntil ? ` until ${fmtDay(p.accessUntil)}` : ""}.</p>
        <dl className="mt-6 divide-y divide-line rounded-xl border border-line px-4 text-left text-[15px]">
          <Detail label="Plan" value={p.planLabel} />
          <Detail label="Reference" value={<span className="font-mono">{p.reference}</span>} />
          {p.accessUntil && <Detail label="Access until" value={fmtDay(p.accessUntil)} />}
        </dl>
        <ButtonLink href="/nclex" className="mt-6">
          Start studying
        </ButtonLink>
      </Card>
    </div>
  );
}
