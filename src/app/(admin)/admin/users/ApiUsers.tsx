"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import {
  bulkUsers, createUser, deleteUser, fetchUsers, givePremium, MAX_PREMIUM_DAYS, removePremium, updateUser,
  type AdminUser, type Outcome,
} from "@/lib/api/adminUsers";
import { useAdminStore } from "@/lib/admin/store";
import { todayISO } from "@/lib/daily";
import { AccessBadge, AdminPage, Badge, Btn, confirmDialog, Dialog, Drawer, Field, fmtDate, Input, Meta, Segmented, toast } from "@/components/admin/ui";
import { BulkBar, DataTable, ListEmpty, ListToolbar, useEditParam, useList, useSelection, type Column } from "@/components/admin/list";

const day = (iso: string | null) => (iso ? fmtDate(iso.slice(0, 10)) : "—");
const daysSince = (iso: string | null) => (iso ? Math.floor((Date.parse(todayISO()) - Date.parse(iso.slice(0, 10))) / 864e5) : Infinity);

/** The date Premium would end if it started now, for the popup's preview. */
const endsOn = (days: number) => fmtDate(new Date(Date.now() + days * 864e5).toISOString().slice(0, 10));

/** Say why a write failed, or that it worked. Returns whether it worked. */
function report(res: Outcome<unknown>, done: string): boolean {
  toast(res.ok ? done : (res.message ?? "That could not be done."), res.ok ? "success" : "error");
  return res.ok;
}

/**
 * Users, when there is a server: the real accounts on the same screen the prototype had. Click
 * anyone, admins included, to open their profile; edit, promote, demote, disable, enable or
 * delete them; and give a Free student Premium for a number of days.
 *
 * The server enforces the safety rules (never yourself, never the last active admin, Premium
 * only for a Free student). The screen hides what it knows will be refused and shows the
 * server's own sentence for anything else.
 */
export function ApiUsers() {
  const me = useAdminStore((s) => s.session?.email?.toLowerCase());
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  const [failed, setFailed] = useState(false);
  const edit = useEditParam();
  // One popup serves the profile and the bulk bar: who it is for, and what to do with the days.
  const [daysFor, setDaysFor] = useState<{ label: string; run: (days: number) => Promise<void> } | null>(null);

  const load = useCallback(async () => {
    try {
      setRows((await fetchUsers()).data);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  // The first load, from the effect's own callback; `load` is for refreshing after a change.
  useEffect(() => {
    let live = true;
    fetchUsers()
      .then((r) => live && (setRows(r.data), setFailed(false)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const isMe = useCallback((u: AdminUser) => u.email.toLowerCase() === me, [me]);

  const list = useList<AdminUser>({
    id: "users",
    rows: rows ?? [],
    search: (u) => `${u.id} ${u.name} ${u.email}`,
    filters: [
      {
        key: "role",
        label: "Role",
        options: [
          { value: "admin", label: "Admins" },
          { value: "student", label: "Students" },
        ],
        match: (u, v) => u.role === v,
      },
      {
        key: "plan",
        label: "Plan",
        options: [
          { value: "free", label: "Free" },
          { value: "premium", label: "Premium" },
        ],
        // Admins have no plan, so neither value matches them.
        match: (u, v) => u.role === "student" && (v === "premium" ? u.premiumUntil !== null : u.premiumUntil === null),
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
      created: { label: "Joined", value: (u) => u.createdAt ?? "" },
      last: { label: "Last active", value: (u) => u.lastActive ?? "" },
    },
    defaultSort: { key: "created", dir: "desc" },
  });
  const sel = useSelection(list.filtered.map((u) => u.id));

  const exportCsv = () => {
    const head = ["name", "email", "role", "plan", "premium_until", "status", "joined", "last_active"];
    const lines = list.filtered.map((u) =>
      [u.name, u.email, u.role, u.role === "admin" ? "full access" : u.premiumUntil ? "premium" : "free", u.premiumUntil?.slice(0, 10) ?? "", u.status, u.createdAt?.slice(0, 10) ?? "", u.lastActive?.slice(0, 10) ?? ""]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(","),
    );
    const url = URL.createObjectURL(new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `nclexbase-users-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** A bulk action, and a plain-words summary of what it did and what it had to skip. */
  const bulk = async (action: "enable" | "disable" | "delete" | "premium" | "free", days?: number) => {
    const res = await bulkUsers(action, [...sel.selected], days);
    if (!res.ok || !res.data) return void toast(res.message ?? "That could not be done.", "error");
    const { done, skipped } = res.data;
    toast(`${done} updated${skipped.length ? `, ${skipped.length} skipped: ${skipped[0].reason}` : ""}`, skipped.length && !done ? "error" : "success");
    sel.clear();
    await load();
  };

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      label: "User",
      sort: "name",
      render: (u) => (
        <div>
          <p className="flex items-center gap-1.5 font-medium">
            {u.name}
            {isMe(u) && <Badge tone="teal">You</Badge>}
          </p>
          <p className="text-xs text-muted">{u.email}</p>
        </div>
      ),
    },
    { key: "role", label: "Role", render: (u) => (u.role === "admin" ? <Badge tone="teal">Admin</Badge> : <Badge tone="neutral">Student</Badge>) },
    {
      key: "plan",
      label: "Plan",
      render: (u) =>
        u.role === "admin" ? (
          <span className="text-xs text-muted">Full access</span>
        ) : (
          <span className="flex items-center gap-1.5">
            <AccessBadge access={u.premiumUntil ? "premium" : "free"} />
            {u.premiumUntil && <span className="text-xs text-muted">until {day(u.premiumUntil)}</span>}
          </span>
        ),
    },
    { key: "status", label: "Status", render: (u) => (u.status === "active" ? <Badge tone="success">Active</Badge> : <Badge tone="error">Disabled</Badge>) },
    { key: "created", label: "Joined", sort: "created", render: (u) => <span className="text-xs text-muted">{day(u.createdAt)}</span> },
    { key: "last", label: "Last active", sort: "last", render: (u) => <span className="text-xs text-muted">{day(u.lastActive)}</span> },
  ];

  const editing = useMemo(() => (rows ?? []).find((u) => u.id === edit.id), [rows, edit.id]);

  return (
    <AdminPage
      title="Users"
      description="Everyone with an account. Click a person to see their profile, change their details, or disable them. Admins can change everything on this site; students can only study."
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
      {failed && <p role="alert" className="mb-3 rounded-md border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">The users could not be loaded. Reload to try again.</p>}
      <ListToolbar list={list} placeholder="Search name or email" />
      <BulkBar count={sel.selected.size} onClear={sel.clear}>
        <Btn variant="premium" onClick={() => setDaysFor({ label: `${sel.selected.size} selected ${sel.selected.size === 1 ? "account" : "accounts"}`, run: (d) => bulk("premium", d) })}>
          Give Premium
        </Btn>
        <Btn onClick={() => void bulk("free")}>Move to Free</Btn>
        <Btn
          variant="danger"
          onClick={async () => {
            if (!(await confirmDialog({ title: `Disable ${sel.selected.size} ${sel.selected.size === 1 ? "account" : "accounts"}?`, body: "They are signed out right away and cannot sign in until you enable them again.", confirm: "Disable", danger: true }))) return;
            await bulk("disable");
          }}
        >
          Disable
        </Btn>
        <Btn onClick={() => void bulk("enable")}>Enable</Btn>
        <Btn
          variant="danger"
          onClick={async () => {
            if (!(await confirmDialog({ title: `Delete ${sel.selected.size} ${sel.selected.size === 1 ? "account" : "accounts"}?`, body: "The accounts are removed for good and signed out. This can't be undone.", confirm: "Delete", danger: true }))) return;
            await bulk("delete");
          }}
        >
          Delete
        </Btn>
      </BulkBar>
      <DataTable
        list={list}
        columns={columns}
        rowId={(u) => u.id}
        onRowClick={(u) => edit.open(u.id)}
        selection={sel}
        empty={rows === null && !failed ? <p className="px-6 py-14 text-center text-muted">Loading…</p> : <ListEmpty list={list} noun="users" />}
        scroll
      />

      {editing && (
        <ProfileDrawer
          key={`${editing.id}|${editing.name}|${editing.email}|${editing.role}|${editing.status}|${editing.premiumUntil}`}
          rec={editing}
          self={isMe(editing)}
          onClose={edit.close}
          onChanged={load}
          askDays={(label, run) => setDaysFor({ label, run })}
        />
      )}
      {edit.id === "new" && (
        <NewUserDrawer
          onClose={edit.close}
          onCreated={(u) => {
            edit.close();
            toast(u.role === "admin" ? "Admin account created" : "User created", "success");
            void load();
          }}
        />
      )}
      <DaysDialog ask={daysFor} onClose={() => setDaysFor(null)} />
    </AdminPage>
  );
}

/* ------------------------------------------------------------------ */
/* Premium for a number of days                                        */
/* ------------------------------------------------------------------ */

function DaysDialog({ ask, onClose }: { ask: { label: string; run: (days: number) => Promise<void> } | null; onClose: () => void }) {
  return ask ? <DaysDialogBody key={ask.label} ask={ask} onClose={onClose} /> : null;
}

function DaysDialogBody({ ask, onClose }: { ask: { label: string; run: (days: number) => Promise<void> }; onClose: () => void }) {
  const [text, setText] = useState("30");
  const [busy, setBusy] = useState(false);
  const days = Number(text);
  const valid = /^\d+$/.test(text) && days >= 1 && days <= MAX_PREMIUM_DAYS;

  async function confirm() {
    if (!valid || busy) return;
    setBusy(true);
    await ask.run(days);
    setBusy(false);
    onClose();
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Give Premium"
      width={440}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" disabled={!valid || busy} onClick={() => void confirm()}>
            {busy ? "Saving…" : "Give Premium"}
          </Btn>
        </>
      }
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void confirm();
        }}
      >
        <p className="text-sm text-ink">
          For how many days should <b>{ask.label}</b> have Premium? It ends by itself after that, and goes back to Free.
        </p>
        <Field label="Days" error={text && !valid ? `Enter a whole number from 1 to ${MAX_PREMIUM_DAYS}.` : undefined}>
          <Input type="number" min={1} max={MAX_PREMIUM_DAYS} step={1} value={text} onChange={(e) => setText(e.target.value)} autoFocus inputMode="numeric" />
        </Field>
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90, 180, 365].map((d) => (
            <Btn key={d} variant={days === d ? "primary" : "secondary"} onClick={() => setText(String(d))}>
              {d} days
            </Btn>
          ))}
        </div>
        {valid && <p className="text-sm text-muted" role="status">Premium until <b className="text-ink">{endsOn(days)}</b>.</p>}
        <p className="text-xs text-muted">Only Free students get this. Anyone who already has Premium is left exactly as they are.</p>
      </form>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

function ProfileDrawer({
  rec, self, onClose, onChanged, askDays,
}: {
  rec: AdminUser;
  self: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
  askDays: (label: string, run: (days: number) => Promise<void>) => void;
}) {
  const [name, setName] = useState(rec.name);
  const [email, setEmail] = useState(rec.email);
  const [role, setRole] = useState(rec.role);
  const [status, setStatus] = useState(rec.status);
  const [busy, setBusy] = useState(false);

  const isPremium = rec.premiumUntil !== null;
  const changed = name.trim() !== rec.name || email.trim().toLowerCase() !== rec.email || role !== rec.role || status !== rec.status;

  async function save() {
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) return void toast("Enter a name and a valid email.", "error");

    // The serious changes are asked about first, in the words of what will happen.
    if (role !== rec.role) {
      const ok = await confirmDialog(
        role === "admin"
          ? { title: `Make ${rec.name} an admin?`, body: "They will be able to change everything on this site: content, users and settings.", confirm: "Make admin", danger: true }
          : { title: `Remove admin rights from ${rec.name}?`, body: "They become a normal student and lose access to this admin area right away.", confirm: "Make student", danger: true },
      );
      if (!ok) return;
    }
    if (status !== rec.status && status === "disabled") {
      const ok = await confirmDialog({ title: `Disable ${rec.name}?`, body: "They are signed out right away and cannot sign in until you enable them again.", confirm: "Disable", danger: true });
      if (!ok) return;
    }

    const changes: Parameters<typeof updateUser>[1] = {};
    if (name.trim() !== rec.name) changes.name = name.trim();
    if (email.trim().toLowerCase() !== rec.email) changes.email = email.trim();
    if (role !== rec.role) changes.role = role;
    if (status !== rec.status) changes.status = status;

    setBusy(true);
    const res = await updateUser(rec.id, changes);
    setBusy(false);
    if (!report(res, "User saved")) return;
    await onChanged();
    onClose();
  }

  async function remove() {
    const ok = await confirmDialog({ title: `Delete ${rec.name}?`, body: "Their account is removed for good and they are signed out. This can't be undone.", confirm: "Delete", danger: true });
    if (!ok) return;
    setBusy(true);
    const res = await deleteUser(rec.id);
    setBusy(false);
    if (!report(res, "User deleted")) return;
    await onChanged();
    onClose();
  }

  /** Free to Premium asks for days; Premium to Free asks to be sure; the same plan does nothing. */
  async function choosePlan(next: "free" | "premium") {
    if (next === "premium" && !isPremium) {
      askDays(rec.name, async (days) => {
        const res = await givePremium(rec.id, days);
        if (report(res, `Premium until ${endsOn(days)}`)) await onChanged();
      });
    } else if (next === "free" && isPremium) {
      const ok = await confirmDialog({ title: `Move ${rec.name} to Free?`, body: `Their Premium (until ${day(rec.premiumUntil)}) ends now.`, confirm: "Move to Free" });
      if (!ok) return;
      const res = await removePremium(rec.id);
      if (report(res, "Moved to Free")) await onChanged();
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={rec.name}
      footer={
        <>
          {!self && (
            <Btn variant="danger" disabled={busy} onClick={() => void remove()}>
              Delete user
            </Btn>
          )}
          <span className="flex-1" />
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" disabled={busy || !changed} onClick={() => void save()}>
            {busy ? "Saving…" : "Save"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        {self && <p className="rounded-md border border-primary/25 bg-primary-light px-3 py-2 text-sm text-ink">This is your own account. You can change your name and email here. Your role and status are locked so you cannot lock yourself out.</p>}
        <dl className="grid grid-cols-2 gap-3 rounded-md border border-line p-3 sm:grid-cols-4">
          <Meta label="Joined">{day(rec.createdAt)}</Meta>
          <Meta label="Last active">{day(rec.lastActive)}</Meta>
          <Meta label="Email">{rec.emailVerified ? "Verified" : "Not verified"}</Meta>
          <Meta label="Plan">{rec.role === "admin" ? "Full access" : isPremium ? `Premium until ${day(rec.premiumUntil)}` : "Free"}</Meta>
        </dl>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email" hint={email.trim().toLowerCase() !== rec.email ? "A new address is marked not verified." : undefined}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          {!self && (
            <Field label="Role">
              <Segmented
                value={role}
                onChange={setRole}
                options={[
                  { value: "student", label: "Student" },
                  { value: "admin", label: "Admin" },
                ]}
              />
            </Field>
          )}
          {rec.role === "student" && (
            <Field label="Plan" hint="Applies right away.">
              <Segmented
                value={isPremium ? "premium" : "free"}
                onChange={(v) => void choosePlan(v)}
                options={[
                  { value: "free", label: "Free" },
                  { value: "premium", label: "Premium" },
                ]}
              />
            </Field>
          )}
          {!self && (
            <Field label="Account">
              <Segmented
                value={status}
                onChange={setStatus}
                options={[
                  { value: "active", label: "Active" },
                  { value: "disabled", label: "Disabled" },
                ]}
              />
            </Field>
          )}
        </div>
        {rec.role === "student" && (
          <div className="rounded-md border border-line p-3">
            <p className="mb-1 text-sm font-semibold text-ink">Payments &amp; access</p>
            <p className="text-sm text-muted">{isPremium ? `Premium until ${day(rec.premiumUntil)}, given by an admin.` : "No payments or codes yet."}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Btn disabled title="Needs email, which is not set up yet.">
            Send password reset
          </Btn>
        </div>
      </div>
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* New user                                                            */
/* ------------------------------------------------------------------ */

function NewUserDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (u: AdminUser) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // A student unless the box is ticked: the harmless choice is the default one.
  const [admin, setAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const minLength = admin ? 12 : 8;
  const ready = Boolean(name.trim() && /^\S+@\S+\.\S+$/.test(email) && password.length >= minLength) && !busy;

  async function save() {
    if (!ready) return;
    if (admin) {
      const ok = await confirmDialog({
        title: "Create an admin account?",
        body: `${email.trim()} will be able to change everything on this site: content, users and settings. Only do this for someone you trust.`,
        confirm: "Create admin",
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(true);
    setErrors({});
    setMessage("");
    const res = await createUser({ name: name.trim(), email: email.trim(), password, role: admin ? "admin" : "student" });
    setBusy(false);
    if (res.ok && res.data) return onCreated(res.data);
    const first: Record<string, string> = {};
    for (const [k, v] of Object.entries(res.errors ?? {})) first[k] = v[0];
    setErrors(first);
    setMessage(Object.keys(first).length ? "" : (res.message ?? "The account could not be created."));
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="New user"
      footer={
        <>
          <span className="flex-1" />
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" disabled={!ready} onClick={() => void save()}>
            {busy ? "Creating…" : admin ? "Create admin" : "Create user"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" error={errors.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </Field>
        <Field
          label="Password"
          error={errors.password}
          hint={admin ? "At least 12 characters, with letters and numbers. Give it to them yourself and ask them to change it." : "At least 8 characters. Give it to them yourself and ask them to change it."}
        >
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3">
          <input type="checkbox" checked={admin} onChange={(e) => setAdmin(e.target.checked)} className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary" />
          <span>
            <span className="block text-sm font-medium text-ink">Make this person an admin</span>
            <span className="block text-xs text-muted">Admins can change everything: content, users and settings. Leave it unticked for a normal student account.</span>
          </span>
        </label>
        {errors.role && <p role="alert" className="text-xs text-error">{errors.role}</p>}
        {message && <p role="alert" className="text-sm text-error">{message}</p>}
      </div>
    </Drawer>
  );
}
