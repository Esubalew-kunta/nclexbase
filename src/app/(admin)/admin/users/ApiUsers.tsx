"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createUser, fetchUsers, type AdminUser, type UserList, type UserRole } from "@/lib/api/adminUsers";
import { AdminPage, Badge, Btn, confirmDialog, Drawer, Field, fmtDate, Input, Segmented, toast } from "@/components/admin/ui";

type RoleFilter = "all" | UserRole;

const date = (iso: string | null) => (iso ? fmtDate(iso.slice(0, 10)) : "—");

/**
 * Users, when there is a server: the real accounts, a filter for admins, and a form that makes
 * a student or an admin. The prototype page next door keeps serving the no-server demo.
 */
export function ApiUsers() {
  const [role, setRole] = useState<RoleFilter>("all");
  const [q, setQ] = useState("");
  const [list, setList] = useState<UserList | null>(null);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setList(await fetchUsers({ role: role === "all" ? undefined : role, q }));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [role, q]);

  // Typing in the search box waits a moment, so a name is one request and not one per letter.
  useEffect(() => {
    const t = setTimeout(() => void load(), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const rows = list?.data ?? [];

  return (
    <AdminPage
      title="Users"
      description="Everyone with an account. Admins can change everything on this site; students can only study."
      actions={
        <Btn variant="primary" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          New user
        </Btn>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Segmented
          value={role}
          onChange={setRole}
          options={[
            { value: "all", label: "Everyone" },
            { value: "admin", label: "Admins" },
            { value: "student", label: "Students" },
          ]}
        />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" aria-label="Search users" className="max-w-xs" />
        {list && (
          <p className="text-sm text-muted" role="status">
            {list.meta.total} {list.meta.total === 1 ? "account" : "accounts"} · {list.meta.admins} {list.meta.admins === 1 ? "admin" : "admins"}
            {list.meta.shown < list.meta.total && ` · showing the newest ${list.meta.shown}`}
          </p>
        )}
      </div>

      {failed && <p role="alert" className="mb-3 rounded-md border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">The users could not be loaded. Reload to try again.</p>}

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-background text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-2 font-semibold">User</th>
              <th className="px-4 py-2 font-semibold">Role</th>
              <th className="px-4 py-2 font-semibold">Status</th>
              <th className="px-4 py-2 font-semibold">Email</th>
              <th className="px-4 py-2 font-semibold">Joined</th>
              <th className="px-4 py-2 font-semibold">Last active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <UserRow key={u.id} u={u} />
            ))}
            {list && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  {q || role !== "all" ? "No account matches these filters." : "No accounts yet."}
                </td>
              </tr>
            )}
            {!list && !failed && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <NewUserDrawer
          onClose={() => setCreating(false)}
          onCreated={(u) => {
            setCreating(false);
            toast(u.role === "admin" ? "Admin account created" : "User created");
            void load();
          }}
        />
      )}
    </AdminPage>
  );
}

function UserRow({ u }: { u: AdminUser }) {
  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium text-ink">{u.name}</p>
        <p className="text-xs text-muted">{u.email}</p>
      </td>
      <td className="px-4 py-3">{u.role === "admin" ? <Badge tone="teal">Admin</Badge> : <Badge tone="neutral">Student</Badge>}</td>
      <td className="px-4 py-3">{u.status === "active" ? <Badge tone="success">Active</Badge> : <Badge tone="error">Disabled</Badge>}</td>
      <td className="px-4 py-3 text-xs text-muted">{u.emailVerified ? "Verified" : "Not verified"}</td>
      <td className="px-4 py-3 text-xs text-muted">{date(u.createdAt)}</td>
      <td className="px-4 py-3 text-xs text-muted">{date(u.lastActive)}</td>
    </tr>
  );
}

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
    if (res.ok && res.user) return onCreated(res.user);
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
