"use client";

import Link from "next/link";
import { useState } from "react";
import { useAll } from "@/lib/content";
import { fmtDay } from "@/lib/payments";
import { checkPromo, redeemAccess } from "@/lib/promo";
import { useStore } from "@/lib/store";
import { AccountShell, Field, PanelCard } from "@/components/home/AccountShell";
import { Button } from "@/components/ui/primitives";

/** Free-access promo codes are redeemed here; discount codes are used at checkout. */
export default function RedeemPage() {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string; checkout?: boolean } | null>(null);
  const email = useStore((s) => s.user.email);
  const history = useAll("redemptions").filter((r) => r.email.toLowerCase() === email.toLowerCase());

  const redeem = () => {
    const r = checkPromo(code, email);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    if (r.promo.kind === "percent") return setMsg({ ok: false, text: `${r.promo.code} is a ${r.promo.percent}% discount code. Use it when you choose a plan.`, checkout: true });
    const { from, until } = redeemAccess(r.promo);
    const today = new Date().toISOString().slice(0, 10);
    setMsg({ ok: true, text: from > today ? `Code accepted. Your free Pro access starts ${fmtDay(from)} and lasts until ${fmtDay(until)}.` : `Code accepted. You have free Pro access until ${fmtDay(until)}.` });
    setCode("");
  };

  return (
    <AccountShell active="redeem">
      <PanelCard title="Redeem a Code">
        <Field label="Code" placeholder="Enter your code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && code && redeem()} />
        <Button disabled={!code.trim()} onClick={redeem}>
          Redeem Code
        </Button>
        {msg && (
          <p className={`mt-3 text-base ${msg.ok ? "text-success" : "text-error"}`}>
            {msg.text}{" "}
            {msg.checkout && (
              <Link href="/nclex/upgrade" className="font-semibold text-primary underline">
                Choose a plan
              </Link>
            )}
          </p>
        )}
        <p className="mt-4 text-sm text-muted">Free-access codes unlock Pro for set dates. Discount codes are entered at checkout when you choose a plan.</p>
      </PanelCard>
      <PanelCard title="Redemption History">
        {history.length ? (
          <ul className="space-y-2">
            {history.map((r) => (
              <li key={r.id} className="text-base text-ink">
                <strong className="font-semibold">{r.code}</strong> · {r.kind === "access" ? `free Pro until ${fmtDay(r.accessUntil!)}` : `${r.percent}% off a payment`} · {fmtDay(r.at)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base leading-6 text-muted">Codes you redeem will appear here.</p>
        )}
      </PanelCard>
    </AccountShell>
  );
}
