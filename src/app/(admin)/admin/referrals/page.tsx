"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";
import type { ReferralRec } from "@/lib/admin/types";
import { useAll, useConfig } from "@/lib/content";
import { fmtDay } from "@/lib/payments";
import { referrerStatus, sortedTiers } from "@/lib/promo";
import { AdminPage, Badge, Btn, Field, IconBtn, Input, Panel, Switch, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { DataTable, ListEmpty, ListToolbar, useList, type Column } from "@/components/admin/list";

export default function ReferralsAdmin() {
  const rows = useAll("referrals");
  const payments = useAll("payments");
  useConfig();
  // Which payment used each paid friend toward a referrer discount (pending or approved).
  const usedOn = useMemo(() => {
    const m = new Map<string, { reference: string; status: string }>();
    for (const p of payments) if (p.status !== "rejected" && p.discount?.source === "reward") for (const id of p.discount.referralIds ?? []) m.set(id, { reference: p.reference, status: p.status });
    return m;
  }, [payments]);
  const stateOf = (r: ReferralRec) => (r.status === "joined" ? "joined" : usedOn.has(r.id) ? "used" : "paid");

  const list = useList<ReferralRec>({
    id: "referrals",
    rows,
    search: (r) => `${r.referrerEmail} ${r.friendEmail} ${r.referrerCode}`,
    filters: [
      {
        key: "status",
        label: "Status",
        options: [
          { value: "joined", label: "Joined, not paid" },
          { value: "paid", label: "Paid, counting toward discount" },
          { value: "used", label: "Used for a discount" },
        ],
        match: (r, v) => stateOf(r) === v,
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
      render: (r) => {
        const s = stateOf(r);
        if (s === "joined") return <Badge tone="neutral">Joined</Badge>;
        if (s === "paid") return <Badge tone="success">Paid · counting</Badge>;
        const u = usedOn.get(r.id)!;
        return (
          <div>
            <Badge tone="teal">Used</Badge>
            <p className="mt-0.5 text-xs text-muted">
              on {u.reference} ({u.status})
            </p>
          </div>
        );
      },
    },
  ];

  // One line per referrer: where they stand and the discount they have now.
  const referrers = useMemo(() => [...new Set(rows.map((r) => r.referrerEmail.toLowerCase()))].map((email) => ({ email, ...referrerStatus(email) })).sort((a, b) => b.available.length - a.available.length), [rows, payments]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AdminPage
      title="Referrals"
      description="Every student has an invite link (Account › Refer a Friend). When friends who joined with it buy Pro, the student earns a discount on their next plan, set by the tiers below. The system works out the discount and applies it at checkout."
    >
      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <Panel title="Top referrers" bodyClassName="p-0">
          {referrers.length ? (
            <table className="w-full text-sm">
              <thead className="bg-background text-left text-xs text-muted uppercase">
                <tr>
                  <th className="px-4 py-2">Referrer</th>
                  <th className="px-3 py-2">Joined</th>
                  <th className="px-3 py-2">Went Pro</th>
                  <th className="px-3 py-2">Counting</th>
                  <th className="px-3 py-2">Next-plan discount</th>
                </tr>
              </thead>
              <tbody>
                {referrers.slice(0, 10).map((r) => (
                  <tr key={r.email} className="border-t border-line">
                    <td className="px-4 py-2">{r.email}</td>
                    <td className="px-3 py-2 tabular-nums">{r.joined}</td>
                    <td className="px-3 py-2 tabular-nums">{r.paid}</td>
                    <td className="px-3 py-2 tabular-nums">{r.available.length}</td>
                    <td className="px-3 py-2">{r.reward ? <Badge tone="success">{r.reward.percent}% off</Badge> : <span className="text-xs text-muted">{r.next ? `${r.next.more} more for ${r.next.percent}%` : "—"}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted">No referrals yet.</p>
          )}
        </Panel>
        <SettingsPanel />
      </div>
      <ListToolbar list={list} placeholder="Search referrer, friend or code" />
      <DataTable list={list} columns={columns} rowId={(r) => r.id} empty={<ListEmpty list={list} noun="referrals" />} />
    </AdminPage>
  );
}

function SettingsPanel() {
  const cfg = useConfig().referrals;
  const [f, setF] = useState(cfg);
  const dirty = !sameRecord(f, cfg);
  useUnsavedGuard(dirty);
  const setTier = (i: number, patch: Partial<(typeof f.tiers)[number]>) => setF({ ...f, tiers: f.tiers.map((t, k) => (k === i ? { ...t, ...patch } : t)) });
  const tiers = sortedTiers(f.tiers);
  const error = (() => {
    if (f.friendPercent < 0 || f.friendPercent > 99) return "The friend's discount must be 0-99%.";
    if (f.tiers.some((t) => t.friends < 1 || t.percent < 1 || t.percent > 99)) return "Each tier needs at least 1 friend and a discount of 1-99%.";
    if (new Set(f.tiers.map((t) => t.friends)).size !== f.tiers.length) return "Two tiers have the same number of friends.";
    if (tiers.some((t, i) => i > 0 && t.percent <= tiers[i - 1].percent)) return "More friends should give a bigger discount.";
    return "";
  })();
  const save = () => {
    if (error) return toast(error, "error");
    useAdminStore.getState().setConfig({ referrals: { ...f, tiers } }, "Updated referral settings");
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
      <div className="space-y-4">
        <Switch checked={f.enabled} onChange={(enabled) => setF({ ...f, enabled })} label="Referrals on" description="Off hides the invite link and stops new discounts." />
        <div>
          <p className="mb-1 text-sm font-medium text-ink">Referrer&apos;s discount on their next plan</p>
          <p className="mb-2 text-xs text-muted">Friends who joined with their link and bought Pro. The highest tier reached applies; it uses up that many friends, and extra friends carry over.</p>
          <div className="space-y-2">
            {f.tiers.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-sm whitespace-nowrap text-ink">
                <div className="w-20 shrink-0">
                  <Input type="number" min={1} value={t.friends} onChange={(e) => setTier(i, { friends: Number(e.target.value) || 0 })} className="h-9" aria-label="Number of friends" disabled={!f.enabled} />
                </div>
                <span>friends go Pro →</span>
                <div className="w-20 shrink-0">
                  <Input type="number" min={1} max={99} value={t.percent} onChange={(e) => setTier(i, { percent: Number(e.target.value) || 0 })} className="h-9" aria-label="Discount percent" disabled={!f.enabled} />
                </div>
                <span className="flex-1">% off</span>
                <IconBtn label="Remove tier" onClick={() => setF({ ...f, tiers: f.tiers.filter((_, k) => k !== i) })} className="hover:text-error" disabled={!f.enabled}>
                  <Trash2 className="size-4" />
                </IconBtn>
              </div>
            ))}
          </div>
          <Btn
            variant="ghost"
            className="mt-2 h-8"
            disabled={!f.enabled}
            onClick={() => {
              const last = tiers.at(-1);
              setF({ ...f, tiers: [...f.tiers, { friends: (last?.friends ?? 0) + 2, percent: Math.min(99, (last?.percent ?? 0) + 10) }] });
            }}
          >
            <Plus className="size-3.5" />
            Add tier
          </Btn>
        </div>
        <Field label="Invited friend's discount (%)" hint="On the friend's first plan. 0 = none.">
          <div className="w-24">
            <Input type="number" min={0} max={99} value={f.friendPercent} onChange={(e) => setF({ ...f, friendPercent: Number(e.target.value) || 0 })} disabled={!f.enabled} />
          </div>
        </Field>
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    </Panel>
  );
}
