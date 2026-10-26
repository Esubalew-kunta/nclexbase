"use client";

import { useState } from "react";
import { useAdminStore } from "@/lib/admin/store";
import type { ReferralRec } from "@/lib/admin/types";
import { useAll, useConfig } from "@/lib/content";
import { fmtDay } from "@/lib/payments";
import { AdminPage, Badge, Btn, Field, Input, Panel, Switch, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { DataTable, ListEmpty, ListToolbar, useList, type Column } from "@/components/admin/list";

export default function ReferralsAdmin() {
  const rows = useAll("referrals");
  const codes = useAll("referralCodes");
  const list = useList<ReferralRec>({
    id: "referrals",
    rows,
    search: (r) => `${r.referrerEmail} ${r.friendEmail} ${r.referrerCode}`,
    filters: [
      {
        key: "status",
        label: "Status",
        options: [
          { value: "joined", label: "Joined (not paid yet)" },
          { value: "rewarded", label: "Paid · referrer rewarded" },
        ],
        match: (r, v) => r.status === v,
      },
    ],
    sorts: {
      joined: { label: "Joined", value: (r) => r.joinedAt },
      referrer: { label: "Referrer", value: (r) => r.referrerEmail },
    },
    defaultSort: { key: "joined", dir: "desc" },
  });
  const columns: Column<ReferralRec>[] = [
    {
      key: "referrer",
      label: "Referrer",
      sort: "referrer",
      render: (r) => (
        <div>
          <p className="text-sm">{r.referrerEmail}</p>
          <p className="font-mono text-xs text-muted">{r.referrerCode}</p>
        </div>
      ),
    },
    { key: "friend", label: "Friend", render: (r) => <span className="text-sm">{r.friendEmail}</span> },
    { key: "joined", label: "Joined", sort: "joined", render: (r) => <span className="text-xs text-muted">{fmtDay(r.joinedAt)}</span> },
    {
      key: "status",
      label: "Status",
      render: (r) =>
        r.status === "rewarded" ? (
          <div>
            <Badge tone="success">Rewarded</Badge>
            <p className="mt-0.5 text-xs text-muted">
              +{r.rewardDays} days, until {fmtDay(r.rewardUntil!)}
            </p>
          </div>
        ) : (
          <Badge tone="warning">Joined</Badge>
        ),
    },
  ];
  const rewarded = rows.filter((r) => r.status === "rewarded").length;
  return (
    <AdminPage
      title="Referrals"
      description="Every student has an invite link (Account › Refer a Friend). A friend who joins with it gets a discount on their first plan; when that payment is approved, the referrer gets free Pro days."
    >
      <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Students sharing" value={codes.length} />
          <Stat label="Friends joined" value={rows.length} />
          <Stat label="Became Pro" value={rewarded} />
        </div>
        <SettingsPanel />
      </div>
      <ListToolbar list={list} placeholder="Search referrer, friend or code" />
      <DataTable list={list} columns={columns} rowId={(r) => r.id} empty={<ListEmpty list={list} noun="referrals" />} />
    </AdminPage>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink tabular-nums">{value}</p>
    </div>
  );
}

function SettingsPanel() {
  const cfg = useConfig().referrals;
  const [f, setF] = useState(cfg);
  const dirty = !sameRecord(f, cfg);
  useUnsavedGuard(dirty);
  const save = () => {
    if (f.friendPercent < 0 || f.friendPercent > 99) return toast("The friend's discount must be 0-99%.", "error");
    if (f.rewardDays < 0 || f.rewardDays > 365) return toast("Reward days must be 0-365.", "error");
    useAdminStore.getState().setConfig({ referrals: f }, "Updated referral settings");
    toast("Referral settings saved");
  };
  return (
    <Panel
      title="Rewards"
      actions={
        <Btn variant="primary" onClick={save} disabled={!dirty}>
          Save
        </Btn>
      }
    >
      <div className="space-y-3">
        <Switch checked={f.enabled} onChange={(enabled) => setF({ ...f, enabled })} label="Referrals on" description="Off hides Refer a Friend's link and stops new discounts and rewards." />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Friend's discount (%)" hint="First payment only.">
            <Input type="number" min={0} max={99} value={f.friendPercent} onChange={(e) => setF({ ...f, friendPercent: Number(e.target.value) || 0 })} disabled={!f.enabled} />
          </Field>
          <Field label="Referrer reward (days)" hint="Free Pro per friend who pays.">
            <Input type="number" min={0} max={365} value={f.rewardDays} onChange={(e) => setF({ ...f, rewardDays: Number(e.target.value) || 0 })} disabled={!f.enabled} />
          </Field>
        </div>
      </div>
    </Panel>
  );
}
