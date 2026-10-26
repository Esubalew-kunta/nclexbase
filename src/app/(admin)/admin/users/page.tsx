"use client";

import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { crud } from "@/lib/admin/crud";
import { newId, useAdminStore } from "@/lib/admin/store";
import { DeleteRecordButton } from "@/components/admin/parts";
import type { UserRec } from "@/lib/admin/types";
import { getAll, useAll } from "@/lib/content";
import { useProgress } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { formatPrice } from "@/lib/payments";
import { accessEnd } from "@/lib/promo";
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

  const list = useList<UserRec>({
    id: "users",
    rows,
    search: (u) => `${u.id} ${u.name} ${u.email}`,
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
    const head = ["name", "email", "plan", "status", "joined", "last_active", "answered", "score_pct"];
    const lines = list.filtered.map((u) => [u.name, u.email, u.plan, u.status, u.createdAt, u.lastActive, u.answered, u.scorePct].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","));
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
        <>
          <Btn onClick={exportCsv}>
            <Download className="size-4" />
            Export CSV ({list.filtered.length})
          </Btn>
          <Btn variant="primary" onClick={() => edit.open("new")}>
            <Plus className="size-4" />
            New user
          </Btn>
        </>
      }
    >
      <ListToolbar list={list} placeholder="Search name or email" />
      <BulkBar count={sel.selected.size} onClear={sel.clear}>
        <Btn variant="premium" onClick={() => (api.patchMany([...sel.selected], { plan: "premium" }, "Upgraded to Premium"), toast("Updated"))}>
          Give Premium
        </Btn>
        <Btn onClick={() => (api.patchMany([...sel.selected], { plan: "free" }, "Moved to Free"), toast("Updated"))}>Move to Free</Btn>
        <Btn variant="danger" onClick={() => (api.patchMany([...sel.selected], { status: "disabled" }, "Disabled"), toast("Updated"))}>
          Disable
        </Btn>
        <Btn onClick={() => (api.patchMany([...sel.selected], { status: "active" }, "Re-enabled"), toast("Updated"))}>Enable</Btn>
        <Btn
          variant="danger"
          onClick={async () => {
            if (!(await confirmDialog({ title: `Delete ${sel.selected.size} user${sel.selected.size === 1 ? "" : "s"}?`, body: "Their accounts are removed. This can't be undone.", confirm: "Delete", danger: true }))) return;
            api.hardDelete([...sel.selected]);
            sel.clear();
          }}
        >
          Delete
        </Btn>
      </BulkBar>
      <DataTable list={list} columns={columns} rowId={(u) => u.id} onRowClick={(u) => edit.open(u.id)} selection={sel} empty={<ListEmpty list={list} noun="users" />} />
      {editing && <UserDrawer key={editing.id + editing.updatedAt + editing.plan} rec={editing} onClose={edit.close} />}
      {edit.id === "new" && (
        <UserDrawer
          isNew
          rec={{ id: newId("u"), name: "", email: "", plan: "free", status: "active", createdAt: todayISO(), lastActive: todayISO(), answered: 0, scorePct: 0, updatedAt: todayISO() }}
          onClose={edit.close}
        />
      )}
    </AdminPage>
  );
}

function UserDrawer({ rec, onClose, isNew }: { rec: UserRec; onClose: () => void; isNew?: boolean }) {
  const [f, setF] = useState(rec);
  const save = () => {
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) return toast("Enter a name and a valid email.", "error");
    if (getAll("users").some((u) => u.id !== f.id && u.email.toLowerCase() === f.email.trim().toLowerCase())) return toast("Another user has that email.", "error");
    if (isNew) {
      api.create({ ...f, name: f.name.trim(), email: f.email.trim() });
      toast("User created");
      return onClose();
    }
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
      title={isNew ? "New user" : rec.name}
      footer={
        <>
          {!isNew && !rec.local && <DeleteRecordButton noun="user" onDelete={() => (api.hardDelete([rec.id]), onClose())} />}
          <span className="flex-1" />
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
        {!isNew && <AccessSummary email={rec.email} />}
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

/** Payments, codes and referral rewards for this student, newest first. */
function AccessSummary({ email }: { email: string }) {
  const payments = useAll("payments");
  const redemptions = useAll("redemptions");
  const referrals = useAll("referrals");
  const same = (a: string) => a.trim().toLowerCase() === email.trim().toLowerCase();
  const rows = [
    ...payments.filter((p) => same(p.userEmail)).map((p) => ({ at: p.submittedAt, text: `${p.planLabel} · ${formatPrice(p.amount, p.currency)} · ${p.methodName}`, tag: p.status, href: `/admin/payments?edit=${p.id}` })),
    ...redemptions.filter((r) => same(r.email)).map((r) => ({ at: r.at, text: `Code ${r.code}${r.kind === "access" ? ` · free Pro until ${r.accessUntil}` : ` · ${r.percent}% off`}`, tag: "code", href: `/admin/promo-codes` })),
    ...referrals.filter((r) => same(r.referrerEmail) && r.status === "rewarded").map((r) => ({ at: r.updatedAt, text: `Referral reward · ${r.rewardDays} days until ${r.rewardUntil}`, tag: "referral", href: "/admin/referrals" })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const end = accessEnd(email);
  return (
    <div className="rounded-md border border-line p-3">
      <p className="mb-2 text-sm font-semibold text-ink">Payments &amp; access {end && <span className="font-normal text-muted">· Pro until {fmtDate(end)}</span>}</p>
      {rows.length ? (
        <ul className="space-y-1.5 text-sm">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center gap-2">
              <Badge tone={r.tag === "approved" ? "success" : r.tag === "pending" ? "warning" : r.tag === "rejected" ? "error" : "teal"}>{r.tag}</Badge>
              <Link href={r.href} className="min-w-0 flex-1 truncate text-ink hover:text-primary hover:underline">
                {r.text}
              </Link>
              <span className="text-xs text-muted">{fmtDate(r.at.slice(0, 10))}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No payments or codes yet.</p>
      )}
    </div>
  );
}
