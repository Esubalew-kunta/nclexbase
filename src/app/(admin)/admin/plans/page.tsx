"use client";

import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Plus, Star, Trash2 } from "lucide-react";
import { crud, today } from "@/lib/admin/crud";
import { newId } from "@/lib/admin/store";
import type { PlanRec, Status } from "@/lib/admin/types";
import { useAll } from "@/lib/content";
import { AdminPage, Badge, Btn, confirmDialog, Drawer, Field, IconBtn, Input, Panel, StatusBadge, Switch, TextArea, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { ConfigPanel, useConfigSection } from "@/components/admin/config";
import { HistoryButton, StatusPicker } from "@/components/admin/parts";

const api = crud("plans");

export default function PlansAdmin() {
  const plans = useAll("plans").slice().sort((a, b) => a.order - b.order);
  const [open, setOpen] = useState<string | null>(null);
  const upgrade = useConfigSection("upgrade", "Upgrade page");
  const free = useConfigSection("freeTier", "free tier");
  const u = upgrade.draft;
  const live = plans.filter((p) => p.status === "published");
  const editing = open === "new" ? null : plans.find((p) => p.id === open);
  const move = (i: number, d: number) => {
    const ids = plans.map((p) => p.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    api.reorder(ids);
  };

  return (
    <AdminPage
      title="Plans & Access"
      description="Membership plans and prices on the Upgrade page, the feature list, and what free members get. Content-level free/premium is set on each item."
      actions={
        <Link href="/nclex/upgrade" target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-primary hover:bg-primary-light">
          <ExternalLink className="size-4" />
          View Upgrade page
        </Link>
      }
    >
      <div className="space-y-4">
        <Panel
          title="Plans"
          description={`${live.length} published. Exactly one plan should be “Most Recommended”.`}
          actions={
            <Btn variant="primary" onClick={() => setOpen("new")}>
              <Plus className="size-4" />
              New plan
            </Btn>
          }
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((p, i) => (
              <div key={p.id} className={clsx("flex flex-col rounded-lg border p-4", p.featured ? "border-gold ring-1 ring-gold" : "border-line", p.status !== "published" && "opacity-70")}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-semibold text-ink">
                    {p.months} month{p.months === 1 ? "" : "s"}
                  </h3>
                  {p.featured && (
                    <Badge tone="gold">
                      <Star className="mr-1 size-3" />
                      Recommended
                    </Badge>
                  )}
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-2xl font-bold text-ink">
                  ${p.price} {p.was > p.price && <span className="text-base font-normal text-muted line-through">${p.was}</span>}
                </p>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted">{p.blurb}</p>
                <div className="mt-3 flex items-center gap-1">
                  <Btn onClick={() => setOpen(p.id)}>Edit</Btn>
                  <span className="flex-1" />
                  <IconBtn label="Move left" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp className="size-4 -rotate-90" />
                  </IconBtn>
                  <IconBtn label="Move right" disabled={i === plans.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown className="size-4 -rotate-90" />
                  </IconBtn>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <ConfigPanel section={upgrade} title="Upgrade page text" description="Headline, subheading and the “What's included” list under every plan.">
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Headline">
                <Input value={u.headline} onChange={(e) => upgrade.setDraft({ ...u, headline: e.target.value })} />
              </Field>
              <Field label="Subheading">
                <Input value={u.subhead} onChange={(e) => upgrade.setDraft({ ...u, subhead: e.target.value })} />
              </Field>
            </div>
            <Field label="What's included">
              <div className="space-y-1.5">
                {u.included.map((x, i) => (
                  <div key={i} className="flex gap-1.5">
                    <Input value={x} className="h-8" onChange={(e) => upgrade.setDraft({ ...u, included: u.included.map((y, k) => (k === i ? e.target.value : y)) })} />
                    <IconBtn
                      label="Move up"
                      disabled={i === 0}
                      onClick={() => {
                        const a = [...u.included];
                        [a[i - 1], a[i]] = [a[i], a[i - 1]];
                        upgrade.setDraft({ ...u, included: a });
                      }}
                    >
                      <ArrowUp className="size-4" />
                    </IconBtn>
                    <IconBtn label="Remove" onClick={() => upgrade.setDraft({ ...u, included: u.included.filter((_, k) => k !== i) })} className="hover:text-error">
                      <Trash2 className="size-4" />
                    </IconBtn>
                  </div>
                ))}
                <Btn variant="ghost" className="h-8" onClick={() => upgrade.setDraft({ ...u, included: [...u.included, ""] })}>
                  <Plus className="size-3.5" />
                  Add line
                </Btn>
              </div>
            </Field>
          </div>
        </ConfigPanel>

        <ConfigPanel section={free} title="Free tier" description="Free members practice from this many questions before Create Test asks them to upgrade.">
          <Field label="Free question allowance" hint="Shown on the Standalone page and used by Create Test.">
            <Input type="number" min={0} value={free.draft.freeQuestions} onChange={(e) => free.setDraft({ freeQuestions: Math.max(0, Number(e.target.value) || 0) })} className="w-32" />
          </Field>
        </ConfigPanel>
      </div>
      {open && (open === "new" || editing) && <PlanEditor key={open} rec={editing ?? null} plans={plans} onClose={() => setOpen(null)} />}
    </AdminPage>
  );
}

function PlanEditor({ rec, plans, onClose }: { rec: PlanRec | null; plans: PlanRec[]; onClose: () => void }) {
  const initial = useMemo<PlanRec>(() => rec ?? { id: newId("plan"), months: 1, price: 0, was: 0, blurb: "", guarantee: false, featured: false, status: "draft", order: plans.length, updatedAt: today() }, [rec]); // eslint-disable-line react-hooks/exhaustive-deps
  const [f, setF] = useState(initial);
  const dirty = !sameRecord(f, initial);
  useUnsavedGuard(dirty);
  const error = f.months < 1 ? "At least 1 month." : f.price <= 0 ? "Set a price above $0." : f.was && f.was < f.price ? "The “was” price should be higher than the price (or 0 for none)." : !f.blurb.trim() ? "Add a short description." : "";

  const save = (status?: Status) => {
    if (error) return toast(error, "error");
    const next = { ...f, blurb: f.blurb.trim(), status: status ?? f.status };
    // Only one featured plan.
    if (next.featured) {
      const others = plans.filter((p) => p.featured && p.id !== next.id).map((p) => p.id);
      if (others.length) api.patchMany(others, { featured: false }, "Removed “Most Recommended”");
    }
    if (rec) api.update(next, next.status !== rec.status ? (next.status === "published" ? "publish" : next.status === "draft" ? "unpublish" : "archive") : "update");
    else api.create(next);
    toast("Plan saved");
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
      title={rec ? `Plan: ${rec.months} month${rec.months === 1 ? "" : "s"}` : "New plan"}
      footer={
        <>
          {rec && <HistoryButton<PlanRec> historyKey={`plans:${rec.id}`} onRestore={(v) => (api.restore(rec.id, v), onClose())} describe={(v) => `$${v.price} · ${v.months} mo`} />}
          <span className="flex-1" />
          <Btn onClick={close}>Cancel</Btn>
          <Btn onClick={() => save("draft")}>Save draft</Btn>
          <Btn variant="primary" onClick={() => save("published")}>
            {rec?.status === "published" ? "Save & keep published" : "Publish"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Months of access">
            <Input type="number" min={1} value={f.months} onChange={(e) => setF({ ...f, months: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Price (USD)">
            <Input type="number" min={0} value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Was (USD)" hint="0 = no discount shown">
            <Input type="number" min={0} value={f.was} onChange={(e) => setF({ ...f, was: Number(e.target.value) || 0 })} />
          </Field>
        </div>
        {f.was > f.price && f.price > 0 && (
          <p className="text-sm text-success">
            Students see: Save ${f.was - f.price} · {Math.round((1 - f.price / f.was) * 100)}% OFF · or 4 payments of ${(f.price / 4).toFixed(2)}
          </p>
        )}
        <Field label="Description">
          <TextArea value={f.blurb} onChange={(e) => setF({ ...f, blurb: e.target.value })} rows={2} className="min-h-0" />
        </Field>
        <Switch checked={f.guarantee} onChange={(v) => setF({ ...f, guarantee: v })} label="Includes the Pass Guarantee" />
        <Switch checked={f.featured} onChange={(v) => setF({ ...f, featured: v })} label="Most Recommended" description="Highlighted in gold. Turning this on removes it from the other plan." />
        <Field label="Status">
          <StatusPicker value={f.status} onChange={(v) => setF({ ...f, status: v })} />
        </Field>
        {error && <p className="text-sm text-error">{error}</p>}
        <p className="text-xs text-muted">Price changes are written to the audit log. Real checkout needs the payments backend.</p>
      </div>
    </Drawer>
  );
}
