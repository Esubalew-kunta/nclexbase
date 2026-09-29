"use client";

import clsx from "clsx";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, FlaskConical } from "lucide-react";
import { useStore } from "@/lib/store";
import { EXPERIMENTS } from "@/lib/features";
import { Avatar, Button, Card, PageHeader, Toggle } from "@/components/ui/primitives";

export default function AccountPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const hydrated = useStore((s) => s.hydrated);
  const setPlan = useStore((s) => s.setPlan);
  const resetProgress = useStore((s) => s.resetProgress);
  const flags = useStore((s) => s.flags);
  const setFlag = useStore((s) => s.setFlag);
  const [tab, setTab] = useState<"profile" | "redeem">("profile");
  const [name, setName] = useState(user.name);
  const day = hydrated ? new Date().toLocaleDateString("en-US", { weekday: "long" }) : "";

  return (
    <>
      <PageHeader
        trail={[{ label: "Account" }]}
        title={`Happy ${day}, ${user.email}!`}
        description="Thanks for being part of the Bootcamp.com family. Edit your profile, manage your memberships, view payment history, and more on this page."
      />
      <div className="mb-6 flex gap-2">
        {(["profile", "redeem"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx("h-10 rounded-full px-5 font-semibold", tab === t ? "bg-white text-brand" : "bg-white/10 text-white hover:bg-white/15")}
          >
            {t === "profile" ? "Profile" : "Redeem Institutional Code"}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <Card className="max-w-3xl p-6">
          <h2 className="text-lg font-semibold text-ink-strong">Personal Details</h2>
          <div className="mt-5 flex items-center gap-4">
            <Avatar initials={(user.name || user.email).charAt(0).toLowerCase()} color="#e8e8f0" size={64} ring={false} light />
            <button className="text-base font-semibold text-brand hover:underline">Upload a profile picture</button>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => useStore.setState((s) => ({ user: { ...s.user, name } }))}
                className="h-12 w-full rounded-lg border border-line px-4 outline-none focus:border-brand"
              />
            </Field>
            <Field label="Contact Email">
              <div className="flex h-12 items-center gap-2 rounded-lg border border-line bg-[#fafafb] px-4 text-muted">
                <span className="flex-1 truncate">{user.email}</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-good">
                  <BadgeCheck className="size-4" /> Verified
                </span>
              </div>
            </Field>
            <Field label="Username">
              <input value={user.email.split("@")[0]} readOnly className="h-12 w-full rounded-lg border border-line bg-[#fafafb] px-4 text-muted" />
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="white">Change Password</Button>
            <Button variant="locked" onClick={() => router.push("/auth/signin")}>
              Log Out
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="max-w-3xl p-6">
          <h2 className="text-lg font-semibold text-ink-strong">Redeem Institutional Code</h2>
          <p className="mt-1 text-muted">Enter the code provided by your school to activate your membership.</p>
          <div className="mt-4 flex gap-2">
            <input placeholder="Enter code" className="h-12 flex-1 rounded-lg border border-line px-4 outline-none focus:border-brand" />
            <Button>Redeem</Button>
          </div>
        </Card>
      )}

      {/* Not part of the live product: controls for demoing the prototype. */}
      <Card className="mt-8 max-w-3xl border-2 border-dashed border-brand/40 p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-strong">
          <FlaskConical className="size-5 text-brand" /> Prototype Controls
        </h2>
        <p className="mt-1 text-sm text-muted">Only in this static clone. Use these to demo different states to stakeholders.</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="font-semibold text-ink">Membership</span>
          {(["free", "premium"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={clsx("h-9 rounded-full px-4 text-sm font-semibold capitalize", user.plan === p ? "bg-brand text-white" : "bg-[#f1f1f3] text-ink")}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="font-semibold text-ink">Experiments (proposed features)</div>
          <div className="mt-3 space-y-3">
            {EXPERIMENTS.map((x) => (
              <div key={x.key} className="flex items-start justify-between gap-4 rounded-lg border border-line p-3">
                <div>
                  <div className="font-semibold text-ink-strong">{x.name}</div>
                  <div className="text-sm text-muted">{x.description}</div>
                </div>
                <Toggle checked={Boolean(flags[x.key])} onChange={(v) => setFlag(x.key, v)} />
              </div>
            ))}
            {!EXPERIMENTS.length && <p className="text-sm text-muted">No experiments registered yet.</p>}
          </div>
        </div>

        <div className="mt-6">
          <Button variant="locked" onClick={() => confirm("Reset all tests, tags, and bookmarks on this device?") && resetProgress()}>
            Reset all progress
          </Button>
        </div>
      </Card>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
