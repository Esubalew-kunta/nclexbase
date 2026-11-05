"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { AccountShell, Field, PanelCard } from "@/components/home/AccountShell";
import { apiMode } from "@/lib/api/client";
import { logout, resendVerification } from "@/lib/api/auth";
import { useChangePassword } from "@/lib/api/useChangePassword";
import { signOutStudent } from "@/lib/demo";

export default function ProfilePage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const [name, setName] = useState(user.name);
  const [open, setOpen] = useState(false);
  return (
    <AccountShell active="profile">
      <PanelCard title="Personal Details">
        <div className="mr-3 mb-4 flex cursor-pointer items-center rounded-lg transition-colors duration-100">
          <span className="flex h-[50px] w-9 items-center justify-center rounded-full p-0.5">
            <span className="flex size-8 items-center justify-center rounded-[32px] bg-primary-light text-xs leading-none font-medium text-primary uppercase">
              {(user.name || user.email).charAt(0)}
            </span>
          </span>
          <span className="ml-2 text-lg leading-[18px] font-semibold text-primary hover:underline">Upload a profile picture</span>
        </div>
        <Field
          label="Name"
          placeholder="What should we call you?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => useStore.setState((s) => ({ user: { ...s.user, name } }))}
        />
        <Field label="Contact Email" right={user.emailVerified === false ? "Not verified" : "Verified"} type="email" defaultValue={user.email} />
        {user.emailVerified === false && <ResendVerification />}
        <Field label="Username" readOnly value={user.email} />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex cursor-pointer items-center rounded-lg pt-4 pb-2 text-lg font-semibold text-primary transition-colors duration-100 hover:text-primary-hover"
        >
          Change Password
        </button>
      </PanelCard>
      {open && <ChangePasswordCard onClose={() => setOpen(false)} />}
      <div className="mx-auto mt-8 w-60">
        <button
          onClick={async () => {
            // Ending the server session matters; the local flag alone would leave the cookie live.
            if (apiMode()) await logout();
            else signOutStudent();
            router.push("/auth/signin");
          }}
          className="flex h-14 w-full cursor-pointer items-center justify-center rounded-lg border border-primary bg-white px-4 py-[19px] text-lg leading-[18px] font-semibold text-primary shadow-[0_2px_0_0_var(--color-line)] transition-colors hover:bg-primary-light active:translate-y-[2px] active:shadow-none"
        >
          Log Out
        </button>
      </div>
    </AccountShell>
  );
}

/**
 * A way to get the verification email again, under the email field. It sits outside the field's
 * label on purpose: a button inside a label becomes the thing the label names.
 */
function ResendVerification() {
  const [state, setState] = useState<{ busy?: boolean; text?: string }>({});

  const send = async () => {
    setState({ busy: true });
    const res = await resendVerification();
    setState({ text: res.ok ? "Sent. Check your inbox and spam folder." : (res.message ?? "We could not send it.") });
  };

  return (
    <div className="-mt-3 mb-4 text-sm">
      <button type="button" onClick={() => void send()} disabled={state.busy} className="cursor-pointer font-semibold text-primary hover:text-primary-hover disabled:opacity-50">
        {state.busy ? "Sending…" : "Send verification email"}
      </button>
      {state.text && (
        <p role="status" className="mt-1 text-muted">
          {state.text}
        </p>
      )}
    </div>
  );
}

/** The form behind "Change Password". Only meaningful with a server to change it on. */
function ChangePasswordCard({ onClose }: { onClose: () => void }) {
  const f = useChangePassword();

  if (!apiMode()) {
    return (
      <PanelCard title="Change Password">
        <p className="text-base text-muted">Passwords are only kept when the site is connected to its server. There is nothing to change here yet.</p>
      </PanelCard>
    );
  }

  return (
    <PanelCard title="Change Password">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void f.submit();
        }}
      >
        <Field label="Current password" type="password" autoComplete="current-password" value={f.current} onChange={(e) => f.setCurrent(e.target.value)} className="mb-4" />
        {f.fields.current_password && <p role="alert" className="-mt-2 mb-4 text-sm text-error">{f.fields.current_password}</p>}
        <Field label="New password" type="password" autoComplete="new-password" value={f.next} onChange={(e) => f.setNext(e.target.value)} className="mb-4" />
        <Field label="Repeat new password" type="password" autoComplete="new-password" value={f.repeat} onChange={(e) => f.setRepeat(e.target.value)} className="mb-4" />
        {(f.hint || f.fields.password) && <p role="alert" className="mb-4 text-sm text-error">{f.fields.password || f.hint}</p>}
        {f.error && <p role="alert" className="mb-4 text-sm text-error">{f.error}</p>}
        {f.done && <p role="status" className="mb-4 text-sm font-medium text-primary">Your password has been changed. Other devices have been signed out.</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!f.ready}
            className="h-12 cursor-pointer rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {f.busy ? "Saving..." : "Save new password"}
          </button>
          <button type="button" onClick={onClose} className="h-12 cursor-pointer rounded-lg px-4 text-base font-semibold text-primary hover:text-primary-hover">
            {f.done ? "Close" : "Cancel"}
          </button>
        </div>
      </form>
    </PanelCard>
  );
}
