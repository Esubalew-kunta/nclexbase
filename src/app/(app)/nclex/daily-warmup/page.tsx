"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { questionForDate, todayISO } from "@/lib/daily";
import { useStore } from "@/lib/store";
import { Button, Card, PageHeader, Toggle } from "@/components/ui/primitives";
import { EmailPreview } from "@/components/daily/EmailPreview";

export default function DailyWarmupPage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const plan = useStore((s) => s.user.plan);
  const userEmail = useStore((s) => s.user.email);
  const warmup = useStore((s) => s.warmup);
  const setWarmup = useStore((s) => s.setWarmup);
  const [draft, setDraft] = useState<string | null>(null);
  const email = draft ?? (warmup.email || userEmail);
  const setEmail = (v: string) => setDraft(v);
  const [sent, setSent] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (hydrated && plan === "free") router.replace("/nclex/upgrade");
  }, [hydrated, plan, router]);

  const { date, item } = questionForDate(todayISO());
  const link = `${typeof window === "undefined" ? "" : window.location.origin}/nclex/question-of-the-day?d=${date}`;
  if (!hydrated || plan === "free") return null;

  return (
    <>
      <PageHeader
        trail={[{ label: "Daily Warmup" }]}
        title="Daily Warmup"
        description="Get one NCLEX® question in your inbox every day. Click the link in the email to answer it and read the rationale."
      />
      <Card className="mb-4 p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h4 className="text-lg leading-[22.5px] font-semibold text-ink">Email me a question every day</h4>
            <p className="text-base leading-6 text-muted">One multiple-choice question, plus a link to see the answer.</p>
          </div>
          <Toggle
            checked={warmup.enabled}
            onChange={(v) => {
              setWarmup({ enabled: v, email });
              setSaved(true);
            }}
          />
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSaved(false);
            }}
            aria-label="Email address"
            placeholder="you@example.com"
            className="h-[42px] flex-1 rounded-xl border border-[#ededf0] px-4 text-base text-ink-strong outline-none focus:border-faint"
          />
          <Button
            onClick={() => {
              setWarmup({ email });
              setSaved(true);
            }}
          >
            Save Email
          </Button>
          <Button variant="outline" onClick={() => setSent(true)}>
            Send me today&apos;s email
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted">
          {saved ? "Saved. " : ""}
          {warmup.enabled ? `You'll get a question at ${warmup.email || email} every day.` : "Daily emails are off."}
          {sent && " Delivery is simulated in this prototype; this is the email that would be sent."}
        </p>
      </Card>
      <h2 className="mb-3 text-2xl leading-[30px] font-bold text-white">Today&apos;s email</h2>
      <EmailPreview item={item} date={date} link={link} />
    </>
  );
}
