"use client";

import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, UnderlineTabs } from "@/components/ui/primitives";

export function AccountShell({ active, children }: { active: "profile" | "redeem-code"; children: ReactNode }) {
  const email = useStore((s) => s.user.email);
  const hydrated = useStore((s) => s.hydrated);
  const day = hydrated ? new Date().toLocaleDateString("en-US", { weekday: "long" }) : "";
  return (
    <>
      <PageHeader
        trail={[{ label: "Account", href: "/nclex/account/profile" }]}
        title={<span suppressHydrationWarning>Happy {day}, {email}!</span>}
        description="Thanks for being part of the Bootcamp.com family. Edit your profile, manage your memberships, view payment history, and more on this page."
      />
      <UnderlineTabs
        tabs={[
          { label: "Profile", href: "/nclex/account/profile" },
          { label: "Redeem Institutional Code", href: "/nclex/account/redeem-code" },
        ]}
        active={`/nclex/account/${active}`}
      />
      {children}
    </>
  );
}

export function PanelCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={clsx("mb-4 rounded-lg bg-white shadow-card", className)}>
      <div className="flex items-center px-6 py-4 shadow-[0_1px_0_rgba(0,0,0,0.1)]">
        <h3 className="text-lg leading-6 font-semibold text-ink-strong">{title}</h3>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

/** Live form field: 14/500 label, 18px input on #f6f6f6 with #ededf0 border. */
export function Field({ label, right, className, ...input }: { label: string; right?: ReactNode } & ComponentProps<"input">) {
  return (
    <label className={clsx("mb-6 block", className)}>
      <div className="mb-2 flex items-start justify-between">
        <h5 className="text-sm leading-[16.8px] font-medium text-muted">{label}</h5>
        {right && <h5 className="text-right text-sm leading-[16.8px] font-medium text-faint">{right}</h5>}
      </div>
      <input
        {...input}
        className={clsx(
          "h-[53px] w-full rounded-lg border px-4 py-3 text-lg leading-[27px] transition-colors duration-100 outline-none",
          input.readOnly
            ? "border-transparent bg-[#ededf0] text-muted"
            : "border-[#ededf0] bg-[#f6f6f6] text-ink-strong placeholder:text-muted hover:border-faint focus:border-[#6366f1] focus:bg-[#e0e7ff]",
        )}
      />
    </label>
  );
}
