"use client";

import { useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { crud, today } from "@/lib/admin/crud";
import { newId } from "@/lib/admin/store";
import type { PromoCodeRec } from "@/lib/admin/types";
import { useAll, usePlans } from "@/lib/content";
import { todayISO } from "@/lib/daily";
import { fmtDay, planLabel } from "@/lib/payments";
import { promoUses } from "@/lib/promo";
import { AdminPage, Badge, Btn, confirmDialog, Drawer, Field, fmtDate, IconBtn, Input, Segmented, TextArea, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { BulkBar, DataTable, ListEmpty, ListToolbar, useEditParam, useList, useSelection, type Column } from "@/components/admin/list";
import { DeleteRecordButton, HistoryButton } from "@/components/admin/parts";

const api = crud("promoCodes");
const randomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

type State = "active" | "scheduled" | "expired" | "used-up" | "disabled";
function stateOf(c: PromoCodeRec, uses: number): State {
  const t = todayISO();
  if (c.status === "disabled") return "disabled";
  if ((c.validUntil && t > c.validUntil) || (c.kind === "access" && c.accessUntil && t > c.accessUntil)) return "expired";
  if (c.maxUses && uses >= c.maxUses) return "used-up";
  if (c.validFrom && t < c.validFrom) return "scheduled";
  return "active";
}
const STATE_LABEL: Record<State, string> = { active: "Active", scheduled: "Not started", expired: "Expired", "used-up": "Limit reached", disabled: "Disabled" };
const STATE_TONE: Record<State, "success" | "warning" | "neutral" | "error"> = { active: "success", scheduled: "warning", expired: "neutral", "used-up": "warning", disabled: "error" };

export default function PromoCodesAdmin() {
  const rows = useAll("promoCodes");
  useAll("redemptions");
  useAll("payments");
  const edit = useEditParam();
  const uses = (c: PromoCodeRec) => promoUses(c);
  const list = useList<PromoCodeRec>({
    id: "promoCodes",
    rows,
    search: (c) => `${c.code} ${c.note}`,
    filters: [
      {
        key: "kind",
        label: "Type",
        options: [
          { value: "percent", label: "Discount (%)" },
          { value: "access", label: "Free Pro dates" },
        ],
        match: (c, v) => c.kind === v,
      },
      { key: "state", label: "State", options: (Object.keys(STATE_LABEL) as State[]).map((s) => ({ value: s, label: STATE_LABEL[s] })), match: (c, v) => stateOf(c, uses(c)) === v },
    ],
    sorts: {
      code: { label: "Code", value: (c) => c.code },
      uses: { label: "Uses", value: (c) => uses(c) },
      updated: { label: "Updated", value: (c) => c.updatedAt },
    },
    defaultSort: { key: "updated", dir: "desc" },
  });
  const sel = useSelection(list.filtered.map((c) => c.id));
  const columns: Column<PromoCodeRec>[] = [
    {
      key: "code",
      label: "Code",
      sort: "code",
      render: (c) => (
        <div>
          <p className="font-mono font-semibold">{c.code}</p>
          {c.note && <p className="text-xs text-muted">{c.note}</p>}
        </div>
      ),
    },
    {
      key: "kind",
      label: "Gives",
      render: (c) => (c.kind === "percent" ? <Badge tone="gold">{c.percent}% off</Badge> : <Badge tone="teal">Free Pro {fmtDate(c.accessFrom)} – {fmtDate(c.accessUntil)}</Badge>),
    },
    { key: "valid", label: "Can be used", render: (c) => <span className="text-sm">{c.validFrom || c.validUntil ? `${c.validFrom ? fmtDate(c.validFrom) : "Now"} – ${c.validUntil ? fmtDate(c.validUntil) : "no end"}` : "Any time"}</span> },
    { key: "uses", label: "Uses", sort: "uses", render: (c) => <span className="tabular-nums">{uses(c)}{c.maxUses ? ` / ${c.maxUses}` : ""}</span> },
    {
      key: "state",
      label: "State",
      render: (c) => {
        const s = stateOf(c, uses(c));
        return <Badge tone={STATE_TONE[s]}>{STATE_LABEL[s]}</Badge>;
      },
    },
  ];
  const editing = edit.id === "new" ? null : rows.find((c) => c.id === edit.id);
  return (
    <AdminPage
      title="Promo Codes"
      description="Two kinds of code: a percentage discount students enter at checkout, or free Pro access for set dates that students redeem on Account › Redeem a Code (or at checkout). Each student can use a code once."
      actions={
        <Btn variant="primary" onClick={() => edit.open("new")}>
          <Plus className="size-4" />
          New promo code
        </Btn>
      }
    >
      <ListToolbar list={list} placeholder="Search code or note" />
      <BulkBar count={sel.selected.size} onClear={sel.clear}>
        <Btn onClick={() => (api.patchMany([...sel.selected], { status: "disabled" }, "Disabled promo code"), toast("Updated"))}>Disable</Btn>
        <Btn onClick={() => (api.patchMany([...sel.selected], { status: "active" }, "Enabled promo code"), toast("Updated"))}>Enable</Btn>
      </BulkBar>
      <DataTable list={list} columns={columns} rowId={(c) => c.id} onRowClick={(c) => edit.open(c.id)} selection={sel} empty={<ListEmpty list={list} noun="promo codes" onCreate={() => edit.open("new")} />} />
      {edit.id && (edit.id === "new" || editing) && <CodeEditor key={edit.id} rec={editing ?? null} rows={rows} onClose={edit.close} />}
    </AdminPage>
  );
}

function CodeEditor({ rec, rows, onClose }: { rec: PromoCodeRec | null; rows: PromoCodeRec[]; onClose: () => void }) {
  const plans = usePlans();
  const redemptions = useAll("redemptions").filter((r) => rec && r.codeId === rec.id);
  const payments = useAll("payments");
  const initial = useMemo<PromoCodeRec>(
    () => rec ?? { id: newId("promo"), code: randomCode(), kind: "percent", percent: 10, accessFrom: todayISO(), accessUntil: todayISO(), validFrom: "", validUntil: "", maxUses: 0, plans: [], note: "", status: "active", updatedAt: today() },
    [rec],
  );
  const [f, setF] = useState(initial);
  const dirty = !sameRecord(f, initial);
  useUnsavedGuard(dirty);
  const used = rec ? promoUses(rec) : 0;
  const clash = rows.some((c) => c.id !== f.id && c.code.toUpperCase() === f.code.trim().toUpperCase());
  const error = !/^[A-Z0-9-]{3,24}$/.test(f.code.trim().toUpperCase())
    ? "Use 3-24 letters, numbers or dashes."
    : clash
      ? "That code already exists."
      : f.kind === "percent" && (f.percent < 1 || f.percent > 99)
        ? "The discount must be between 1% and 99%."
        : f.kind === "access" && (!f.accessFrom || !f.accessUntil || f.accessUntil < f.accessFrom)
          ? "Pick the access start and end dates (end on or after start)."
          : f.validFrom && f.validUntil && f.validUntil < f.validFrom
            ? "“Usable until” must be on or after “Usable from”."
            : "";
  const save = () => {
    if (error) return toast(error, "error");
    const next = { ...f, code: f.code.trim().toUpperCase(), note: f.note.trim() };
    if (rec) api.update(next);
    else api.create(next);
    toast("Promo code saved");
    onClose();
  };
  const close = async () => {
    if (dirty && !(await confirmDialog({ title: "Discard changes?", confirm: "Discard", danger: true }))) return;
    onClose();
  };
  const togglePlan = (id: string) => setF({ ...f, plans: f.plans.includes(id) ? f.plans.filter((x) => x !== id) : [...f.plans, id] });

  return (
    <Drawer
      open
      onClose={close}
      width={600}
      title={rec ? `Promo code ${rec.code}` : "New promo code"}
      footer={
        <>
          {rec && <HistoryButton<PromoCodeRec> historyKey={`promoCodes:${rec.id}`} onRestore={(v) => (api.restore(rec.id, v), onClose())} describe={(v) => `${v.code} · ${v.kind === "percent" ? `${v.percent}%` : "free Pro"}`} />}
          {rec && !used && <DeleteRecordButton noun="promo code" onDelete={() => (api.hardDelete([rec.id]), onClose())} />}
          <span className="flex-1" />
          <Btn onClick={close}>Cancel</Btn>
          <Btn variant="primary" onClick={save}>
            Save
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Code" hint="Students type this (not case sensitive)." error={error.startsWith("Use") || clash ? error : ""}>
          <div className="flex gap-2">
            <Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} className="font-mono" disabled={Boolean(used)} />
            {!used && (
              <IconBtn label="Generate a code" onClick={() => setF({ ...f, code: randomCode() })} className="size-9 border border-line">
                <RefreshCw className="size-4" />
              </IconBtn>
            )}
          </div>
        </Field>
        <Field label="What it gives">
          <Segmented
            value={f.kind}
            onChange={(kind) => setF({ ...f, kind })}
            options={[
              { value: "percent", label: "Discount (%)" },
              { value: "access", label: "Free Pro for set dates" },
            ]}
          />
        </Field>
        {f.kind === "percent" ? (
          <>
            <Field label="Discount (%)" hint="Taken off the plan price at checkout.">
              <Input type="number" min={1} max={99} value={f.percent} onChange={(e) => setF({ ...f, percent: Number(e.target.value) || 0 })} className="w-28" />
            </Field>
            <Field label="Applies to" hint="Leave all unticked for every plan.">
              <div className="flex flex-wrap gap-3">
                {plans.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                    <input type="checkbox" checked={f.plans.includes(p.id)} onChange={() => togglePlan(p.id)} className="size-4 accent-primary" />
                    {planLabel(p)}
                  </label>
                ))}
              </div>
            </Field>
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Pro access from" hint="Redeeming before this date starts access on it.">
              <Input type="date" value={f.accessFrom} onChange={(e) => setF({ ...f, accessFrom: e.target.value })} />
            </Field>
            <Field label="Pro access until">
              <Input type="date" value={f.accessUntil} onChange={(e) => setF({ ...f, accessUntil: e.target.value })} />
            </Field>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Usable from" hint="Empty = now.">
            <Input type="date" value={f.validFrom} onChange={(e) => setF({ ...f, validFrom: e.target.value })} />
          </Field>
          <Field label="Usable until" hint="Empty = no end.">
            <Input type="date" value={f.validUntil} onChange={(e) => setF({ ...f, validUntil: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Total uses allowed" hint="0 = unlimited.">
            <Input type="number" min={0} value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: Math.max(0, Number(e.target.value) || 0) })} />
          </Field>
          <Field label="Status">
            <Segmented
              value={f.status}
              onChange={(status) => setF({ ...f, status })}
              options={[
                { value: "active", label: "Active" },
                { value: "disabled", label: "Disabled" },
              ]}
            />
          </Field>
        </div>
        <Field label="Note (admins only)">
          <TextArea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} rows={2} placeholder="e.g. Instagram campaign, November" />
        </Field>

        {rec && (
          <div className="rounded-md border border-line">
            <p className="border-b border-line bg-background px-3 py-2 text-sm font-semibold text-ink">
              Used {used} time{used === 1 ? "" : "s"}
            </p>
            {redemptions.length ? (
              <ul className="divide-y divide-line text-sm">
                {redemptions.map((r) => {
                  const pay = r.paymentId ? payments.find((p) => p.id === r.paymentId) : undefined;
                  return (
                    <li key={r.id} className="flex items-center gap-2 px-3 py-2">
                      <span className="min-w-0 flex-1 truncate">
                        {r.name || r.email} <span className="text-muted">· {r.email}</span>
                      </span>
                      {pay && <Badge tone={pay.status === "approved" ? "success" : pay.status === "pending" ? "warning" : "error"}>payment {pay.status}</Badge>}
                      <span className="text-xs text-muted">{fmtDay(r.at)}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-3 py-3 text-sm text-muted">Not used yet.</p>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
