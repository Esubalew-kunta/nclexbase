"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { crud, today } from "@/lib/admin/crud";
import { newId } from "@/lib/admin/store";
import type { AnnouncementRec, Status } from "@/lib/admin/types";
import { useAll } from "@/lib/content";
import { todayISO } from "@/lib/daily";
import { AdminPage, Badge, Btn, confirmDialog, Drawer, Field, fmtDate, Input, Segmented, Select, StatusBadge, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { BulkBar, DataTable, ListEmpty, ListToolbar, statusFilter, useEditParam, useList, useSelection, type Column } from "@/components/admin/list";
import { DeleteRecordButton, HistoryButton, StatusBulkActions, StatusPicker } from "@/components/admin/parts";

const api = crud("announcements");

/** Where an announcement is in its life: live now, scheduled, ended, or not published. */
function phase(a: AnnouncementRec): "live" | "scheduled" | "ended" | "off" {
  if (a.status !== "published") return "off";
  const t = todayISO();
  if (a.start && t < a.start) return "scheduled";
  if (a.end && t > a.end) return "ended";
  return "live";
}

export default function AnnouncementsAdmin() {
  const rows = useAll("announcements");
  const edit = useEditParam();
  const list = useList<AnnouncementRec>({
    id: "announcements",
    rows,
    search: (a) => `${a.message} ${a.linkLabel} ${a.linkHref}`,
    filters: [
      statusFilter(),
      {
        key: "phase",
        label: "Showing",
        options: [
          { value: "live", label: "Live now" },
          { value: "scheduled", label: "Scheduled" },
          { value: "ended", label: "Ended" },
        ],
        match: (a, v) => phase(a) === v,
      },
      {
        key: "audience",
        label: "Audience",
        options: [
          { value: "all", label: "Everyone" },
          { value: "free", label: "Free members" },
          { value: "premium", label: "Premium members" },
        ],
        match: (a, v) => a.audience === v,
      },
    ],
    sorts: { order: { label: "Order", value: (a) => a.order }, start: { label: "Starts", value: (a) => a.start || "0" }, updated: { label: "Updated", value: (a) => a.updatedAt } },
    defaultSort: { key: "order", dir: "asc" },
  });
  const sel = useSelection(list.filtered.map((a) => a.id));
  const columns: Column<AnnouncementRec>[] = [
    {
      key: "message",
      label: "Message",
      sort: "order",
      render: (a) => (
        <div className="flex max-w-xl items-start gap-2">
          <Megaphone className={clsx("mt-0.5 size-4 shrink-0", a.tone === "premium" ? "text-gold" : "text-primary")} />
          <span className="text-sm">{a.message}</span>
        </div>
      ),
    },
    { key: "audience", label: "Audience", render: (a) => <span className="text-sm text-muted">{a.audience === "all" ? "Everyone" : a.audience === "free" ? "Free" : "Premium"}</span> },
    { key: "window", label: "Dates", sort: "start", render: (a) => <span className="text-xs text-muted">{a.start || a.end ? `${a.start ? fmtDate(a.start) : "now"} – ${a.end ? fmtDate(a.end) : "no end"}` : "Always"}</span> },
    {
      key: "phase",
      label: "Showing",
      render: (a) => {
        const p = phase(a);
        return <Badge tone={p === "live" ? "success" : p === "scheduled" ? "teal" : "neutral"}>{p === "off" ? "No" : p[0].toUpperCase() + p.slice(1)}</Badge>;
      },
    },
    { key: "status", label: "Status", render: (a) => <StatusBadge status={a.status} /> },
  ];
  const editing = edit.id === "new" ? null : rows.find((a) => a.id === edit.id);
  return (
    <AdminPage
      title="Announcements"
      description="Notices at the top of every student page. Several can run at once, each for an audience and a date window. Students can dismiss one; editing its text shows it again."
      actions={
        <Btn variant="primary" onClick={() => edit.open("new")}>
          <Plus className="size-4" />
          New announcement
        </Btn>
      }
    >
      <ListToolbar list={list} placeholder="Search announcements" />
      <BulkBar count={sel.selected.size} onClear={sel.clear}>
        <StatusBulkActions ids={[...sel.selected]} rows={rows} onStatus={(ids, s) => (api.setStatus(ids, s), toast(`${ids.length} updated`))} onDelete={(ids) => (api.hardDelete(ids), sel.clear())} />
      </BulkBar>
      <DataTable list={list} columns={columns} rowId={(a) => a.id} onRowClick={(a) => edit.open(a.id)} selection={sel} empty={<ListEmpty list={list} noun="announcements" onCreate={() => edit.open("new")} />} />
      {edit.id && (edit.id === "new" || editing) && <AnnouncementEditor key={edit.id} rec={editing ?? null} order={rows.length} onClose={edit.close} />}
    </AdminPage>
  );
}

function AnnouncementEditor({ rec, order, onClose }: { rec: AnnouncementRec | null; order: number; onClose: () => void }) {
  const initial = useMemo<AnnouncementRec>(
    () => rec ?? { id: newId("ann"), message: "", linkLabel: "", linkHref: "", audience: "all", tone: "info", start: "", end: "", status: "draft", order, updatedAt: today() },
    [rec], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [f, setF] = useState(initial);
  const dirty = !sameRecord(f, initial);
  useUnsavedGuard(dirty);
  const error = !f.message.trim() ? "Write the message." : f.start && f.end && f.end < f.start ? "The end date is before the start date." : (f.linkLabel && !f.linkHref) || (!f.linkLabel && f.linkHref) ? "Fill in both link text and address, or neither." : "";
  const save = (status?: Status) => {
    if (error) return toast(error, "error");
    const next = { ...f, message: f.message.trim(), status: status ?? f.status };
    if (rec) api.update(next, next.status !== rec.status ? (next.status === "published" ? "publish" : next.status === "draft" ? "unpublish" : "archive") : "update");
    else api.create(next);
    toast("Announcement saved");
    onClose();
  };
  const close = async () => {
    if (dirty && !(await confirmDialog({ title: "Discard changes?", confirm: "Discard", danger: true }))) return;
    onClose();
  };
  const premium = f.tone === "premium";
  return (
    <Drawer
      open
      onClose={close}
      title={rec ? "Edit announcement" : "New announcement"}
      footer={
        <>
          {rec && <HistoryButton<AnnouncementRec> historyKey={`announcements:${rec.id}`} onRestore={(v) => (api.restore(rec.id, v), onClose())} describe={(v) => v.message.slice(0, 40)} />}
          {rec && <DeleteRecordButton status={rec.status} noun="announcement" onDelete={() => (api.hardDelete([rec.id]), onClose())} />}
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
        <Field label="Message" required>
          <Input value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} maxLength={180} autoFocus />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Link text (optional)">
            <Input value={f.linkLabel} onChange={(e) => setF({ ...f, linkLabel: e.target.value })} />
          </Field>
          <Field label="Link (optional)" hint="/nclex/… or https://…">
            <Input value={f.linkHref} onChange={(e) => setF({ ...f, linkHref: e.target.value })} />
          </Field>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Who sees it">
            <Select value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value as AnnouncementRec["audience"] })}>
              <option value="all">Everyone</option>
              <option value="free">Free members only</option>
              <option value="premium">Premium members only</option>
            </Select>
          </Field>
          <Field label="Style">
            <Segmented
              value={f.tone}
              onChange={(v) => setF({ ...f, tone: v })}
              options={[
                { value: "info", label: "Info (teal)" },
                { value: "premium", label: "Premium (gold)" },
              ]}
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Starts" hint="Empty = right away">
            <Input type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />
          </Field>
          <Field label="Ends" hint="Empty = no end">
            <Input type="date" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />
          </Field>
          <Field label="Status">
            <StatusPicker value={f.status} onChange={(v) => setF({ ...f, status: v })} />
          </Field>
          <Field label="Order">
            <Input type="number" value={f.order} onChange={(e) => setF({ ...f, order: Number(e.target.value) || 0 })} className="w-20" />
          </Field>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-muted uppercase">Preview</p>
          <div className={clsx("flex items-center gap-3 rounded-lg border px-4 py-3 text-base text-ink", premium ? "border-gold/60 bg-gold/10" : "border-primary/25 bg-primary-light")}>
            <Megaphone className={clsx("size-5 shrink-0", premium ? "text-gold" : "text-primary")} />
            <p>
              {f.message || <span className="text-muted">Your message</span>}
              {f.linkLabel && <span className="ml-2 font-semibold text-primary underline">{f.linkLabel}</span>}
            </p>
          </div>
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    </Drawer>
  );
}
