"use client";

import { useState } from "react";
import { AccountShell, Field, PanelCard } from "@/components/home/AccountShell";
import { Button } from "@/components/ui/primitives";

export default function RedeemPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <AccountShell active="redeem-code">
      <div className="mb-4 rounded-lg border border-white/5 bg-white/10 px-6 py-4 text-base leading-6 text-white">
        <ul className="list-disc pl-5">
          <li>
            If your institution purchased memberships for your class, enter the code they gave you below to activate your upgraded membership.{" "}
            <strong className="font-bold">This section is not for redeeming promo codes. Promo codes can be used during checkout.</strong> If you need help, click
            the blue button at the bottom-right of your screen to send us a message. We&apos;ll respond ASAP.
          </li>
        </ul>
      </div>
      <PanelCard title="Enter Your Institutional Code">
        <Field label="Your Full Name" placeholder="Enter your full name as it appears on your institution’s records" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Institutional Code" placeholder="Enter code provided by your institution" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button disabled={!name || !code} onClick={() => setMsg("That code wasn't recognized. Check it and try again.")}>
          Redeem Code
        </Button>
        {msg && <p className="mt-3 text-base text-[#c43c35]">{msg}</p>}
      </PanelCard>
      <PanelCard title="Redemption History">
        <p className="text-base leading-6 text-muted">
          If you redeem an institutional code, it will appear here. Don’t have an institutional code? Meet with your advisor or program director and ask them to email
          us at team@bootcamp.com. We&apos;d love to offer our resource to your institution!
        </p>
      </PanelCard>
    </AccountShell>
  );
}
