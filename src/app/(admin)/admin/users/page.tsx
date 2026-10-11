"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { crud } from "@/lib/admin/crud";
import { useAdminStore } from "@/lib/admin/store";
import type { UserRec } from "@/lib/admin/types";
import { useAll } from "@/lib/content";
import { useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/daily";
import { AccessBadge, AdminPage, Badge, Btn, confirmDialog, Drawer, Field, fmtDate, Input, Meta, Segmented, toast } from "@/components/admin/ui";
import { BulkBar, DataTable, ListEmpty, ListToolbar, useEditParam, useList, useSelection, type Column } from "@/components/admin/list";

const api = crud("users");
const LOCAL = "local-student";
const daysSince = (iso: string) => Math.floor((Date.parse(todayISO()) - Date.parse(iso)) / 864e5);

export default function UsersAdmin() {
  const mock = useAll("users");
  const student = useStore((s) => s.user);
  const sessions = useStore((s) => s.sessions);
  const progress = useProgress();
  const edit = useEditParam();

  // The student signed in on this browser is real data; everyone else is mock until the backend exists.
  const local: UserRec = useMemo(
    () => ({
      id: LOCAL,
      name: student.name || "Student on this browser",
      email: student.email,
      plan: student.plan,
      status: "active",
      institution: student.redeemed?.institution ?? "",
      createdAt: sessions[0]?.createdAt?.slice(0, 10) ?? todayISO(),
      lastActive: todayISO(),
      answered: progress.used.size,
      scorePct: progress.max ? Math.round((progress.earned / progress.max) * 100) : 0,
      local: true,
      updatedAt: todayISO(),
    }),
    [student, sessions, progress],
  );
  const rows = useMemo(() => [local, ...mock], [local, mock]);
  const institutions = [...new Set(rows.map((r) => r.institution).filter(Boolean))].sort();

  const list = useList<UserRec>({
    id: "users",
    rows,
    search: (u) => `${u.id} ${u.name} ${u.email} ${u.institution}`,
    filters: [
      {
        key: "plan",
        label: "Plan",
        options: [
          { value: "free", label: "Free" },
          { value: "premium", label: "Premium" },
        ],
        match: (u, v) => u.plan === v,
      },
      {
        key: "status",
        label: "Status",
        options: [
          { value: "active", label: "Active" },
          { value: "disabled", label: "Disabled" },
        ],
        match: (u, v) => u.status === v,
      },
      { key: "institution", label: "Institution", options: [{ value: "__none", label: "No institution" }, ...institutions.map((i) => ({ value: i, label: i }))], match: (u, v) => (v === "__none" ? !u.institution : u.institution === v) },
      {
        key: "activity",
        label: "Last active",
        options: [
          { value: "7", label: "In the last 7 days" },
          { value: "30", label: "In the last 30 days" },
          { value: "inactive", label: "Inactive 30+ days" },
        ],
        match: (u, v) => (v === "inactive" ? daysSince(u.lastActive) > 30 : daysSince(u.lastActive) <= Number(v)),
      },
    ],
    sorts: {
      name: { label: "Name", value: (u) => u.name },
      created: { label: "Joined", value: (u) => u.createdAt },
      last: { label: "Last active", value: (u) => u.lastActive },
      answered: { label: "Answered", value: (u) => u.answered },
      score: { label: "Score", value: (u) => u.scorePct },
    },
    defaultSort: { key: "last", dir: "desc" },
  });
  const sel = useSelection(list.filtered.filter((u) => !u.local).map((u) => u.id));

  const exportCsv = () => {
    const head = ["name", "email", "plan", "status", "institution", "joined", "last_active", "answered", "score_pct"];
    const lines = list.filtered.map((u) => [u.name, u.email, u.plan, u.status, u.institution, u.createdAt, u.lastActive, u.answered, u.scorePct].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","));
    const url = URL.createObjectURL(new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `nclexbase-users-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<UserRec>[] = [
    {
      key: "name",
      label: "User",
      sort: "name",
      render: (u) => (
        <div>
          <p className="flex items-center gap-1.5 font-medium">
            {u.name}
            {u.local && <Badge tone="teal">This browser</Badge>}
          </p>
          <p className="text-xs text-muted">{u.email}</p>
        </div>
      ),
    },
    { key: "plan", label: "Plan", render: (u) => <AccessBadge access={u.plan} /> },
    { key: "status", label: "Status", render: (u) => (u.status === "active" ? <Badge tone="success">Active</Badge> : <Badge tone="error">Disabled</Badge>) },
    { key: "inst", label: "Institution", render: (u) => <span className="text-sm text-muted">{u.institution || "—"}</span> },
    { key: "answered", label: "Answered", sort: "answered", render: (u) => <span className="tabular-nums">{u.answered}</span> },
    { key: "score", label: "Score", sort: "score", render: (u) => <span className="tabular-nums">{u.answered ? `${u.scorePct}%` : "—"}</span> },
    { key: "created", label: "Joined", sort: "created", render: (u) => <span className="text-xs text-muted">{fmtDate(u.createdAt)}</span> },
    { key: "last", label: "Last active", sort: "last", render: (u) => <span className="text-xs text-muted">{fmtDate(u.lastActive)}</span> },
  ];
  const editing = rows.find((u) => u.id === edit.id);

  return (
    <AdminPage
      title="Users"
      description="Student accounts. Only the student on this browser is real until the backend exists; the others are sample accounts so search, filters and actions can be tried."
      actions={
        <Btn onClick={exportCsv}>
          <Download className="size-4" />
          Export CSV ({list.filtered.length})
        </Btn>
      }
    >
      <ListToolbar list={list} placeholder="Search name, email, institution" />
      <BulkBar count={sel.selected.size} onClear={sel.clear}>
        <Btn variant="premium" onClick={() => (api.patchMany([...sel.selected], { plan: "premium" }, "Upgraded to Premium"), toast("Updated"))}>
          Give Premium
        </Btn>
        <Btn onClick={() => (api.patchMany([...sel.selected], { plan: "free" }, "Moved to Free"), toast("Updated"))}>Move to Free</Btn>
        <Btn variant="danger" onClick={() => (api.patchMany([...sel.selected], { status: "disabled" }, "Disabled"), toast("Updated"))}>
          Disable
        </Btn>
        <Btn onClick={() => (api.patchMany([...sel.selected], { status: "active" }, "Re-enabled"), toast("Updated"))}>Enable</Btn>
      </BulkBar>
      <DataTable list={list} columns={columns} rowId={(u) => u.id} onRowClick={(u) => edit.open(u.id)} selection={sel} empty={<ListEmpty list={list} noun="users" />} />
      {editing && <UserDrawer key={editing.id + editing.updatedAt + editing.plan} rec={editing} onClose={edit.close} />}
    </AdminPage>
  );
}

function UserDrawer({ rec, onClose }: { rec: UserRec; onClose: () => void }) {
  const [f, setF] = useState(rec);
  const save = () => {
    if (rec.local) {
      useStore.setState((s) => ({ user: { ...s.user, name: f.name === "Student on this browser" ? s.user.name : f.name, email: f.email, plan: f.plan } }));
      logLocal(`Updated the student on this browser (${f.email})`);
    } else api.update(f);
    toast("User saved");
    onClose();
  };
  return (
    <Drawer
      open
      onClose={onClose}
      title={rec.name}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={save}>
            Save
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        {rec.local && <p className="rounded-md border border-primary/25 bg-primary-light px-3 py-2 text-sm text-ink">This is the real student account in this browser. Changing the plan here changes what they can open right away.</p>}
        <dl className="grid grid-cols-2 gap-3 rounded-md border border-line p-3 sm:grid-cols-4">
          <Meta label="Answered">{rec.answered}</Meta>
          <Meta label="Score">{rec.answered ? `${rec.scorePct}%` : "—"}</Meta>
          <Meta label="Joined">{fmtDate(rec.createdAt)}</Meta>
          <Meta label="Last active">{fmtDate(rec.lastActive)}</Meta>
        </dl>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Field>
        </div>
        {!rec.local && (
          <Field label="Institution">
            <Input value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} />
          </Field>
        )}
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Plan">
            <Segmented
              value={f.plan}
              onChange={(v) => setF({ ...f, plan: v })}
              options={[
                { value: "free", label: "Free" },
                { value: "premium", label: "Premium" },
              ]}
            />
          </Field>
          {!rec.local && (
            <Field label="Account">
              <Segmented
                value={f.status}
                onChange={(v) => setF({ ...f, status: v })}
                options={[
                  { value: "active", label: "Active" },
                  { value: "disabled", label: "Disabled" },
                ]}
              />
            </Field>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Btn onClick={() => toast(`Password reset email would be sent to ${f.email} (needs the backend).`, "info")}>Send password reset</Btn>
          {rec.local && (
            <Btn
              variant="danger"
              onClick={async () => {
                if (!(await confirmDialog({ title: "Reset this student's progress?", body: "Deletes their tests, tags and bookmarks in this browser. Schedule and settings stay.", confirm: "Reset progress", danger: true }))) return;
                useStore.getState().resetProgress();
                logLocal("Reset the progress of the student on this browser");
                toast("Progress reset");
                onClose();
              }}
            >
              Reset progress
            </Btn>
          )}
        </div>
      </div>
    </Drawer>
  );
}

/** Audit entry for actions on the local student (not a collection record). */
function logLocal(label: string) {
  useAdminStore.getState().log({ action: "update", entity: "users", entityId: LOCAL, label });
}
