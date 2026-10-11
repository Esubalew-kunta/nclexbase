"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/admin/store";
import { getAll, useConfig } from "@/lib/content";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/daily";
import { AccountShell, Field, PanelCard } from "@/components/home/AccountShell";
import { Button } from "@/components/ui/primitives";

export default function RedeemPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const user = useStore((s) => s.user);
  const supportEmail = useConfig().branding.supportEmail;

  // Codes are managed in Admin > Institution Codes. Static build: checked against this browser's admin data.
  const redeem = () => {
    const rec = getAll("codes").find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
    if (!rec || rec.status !== "active") return setMsg({ ok: false, text: "That code wasn't recognized. Check it and try again." });
    if (rec.expiresAt && rec.expiresAt < todayISO()) return setMsg({ ok: false, text: "This code has expired. Ask your program director for a new one." });
    if (rec.used >= rec.seats) return setMsg({ ok: false, text: "All seats for this code are taken. Ask your program director to add more." });
    useAdminStore.getState().save("codes", [{ ...rec, used: rec.used + 1 }], { action: "update", label: `Code ${rec.code} redeemed by ${user.email}` });
    useStore.setState((s) => ({ user: { ...s.user, name: s.user.name || name, plan: "premium", redeemed: { code: rec.code, institution: rec.institution, at: todayISO() } } }));
    setMsg({ ok: true, text: `Code accepted. Your membership from ${rec.institution} is now active.` });
    setCode("");
  };

  return (
    <AccountShell active="redeem-code">
      <div className="mb-4 rounded-lg border border-l-4 border-line border-l-primary bg-primary-light px-6 py-4 text-base leading-6 text-ink">
        <ul className="list-disc pl-5">
          <li>
            If your institution purchased memberships for your class, enter the code they gave you below to activate your upgraded membership.{" "}
            <strong className="font-bold">This section is not for redeeming promo codes. Promo codes can be used during checkout.</strong> If you need help, click
            the chat button at the bottom-right of your screen to send us a message. We&apos;ll respond ASAP.
          </li>
        </ul>
      </div>
      <PanelCard title="Enter Your Institutional Code">
        <Field label="Your Full Name" placeholder="Enter your full name as it appears on your institution’s records" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Institutional Code" placeholder="Enter code provided by your institution" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button disabled={!name || !code} onClick={redeem}>
          Redeem Code
        </Button>
        {msg && <p className={`mt-3 text-base ${msg.ok ? "text-success" : "text-error"}`}>{msg.text}</p>}
      </PanelCard>
      <PanelCard title="Redemption History">
        {user.redeemed ? (
          <p className="text-base leading-6 text-ink">
            <strong className="font-semibold">{user.redeemed.institution}</strong> · code {user.redeemed.code} · redeemed {user.redeemed.at}
          </p>
        ) : (
          <p className="text-base leading-6 text-muted">
            If you redeem an institutional code, it will appear here. Don’t have an institutional code? Meet with your advisor or program director and ask them to email
            us at {supportEmail}. We&apos;d love to offer our resource to your institution!
          </p>
        )}
      </PanelCard>
    </AccountShell>
  );
}
