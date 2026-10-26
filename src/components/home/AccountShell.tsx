"use client";

import clsx from "clsx";
import type { ComponentProps, ReactNode } from "react";
import { useStore } from "@/lib/store";
import { useCopy } from "@/lib/content";
import { PageHeader, UnderlineTabs } from "@/components/ui/primitives";

export function AccountShell({ active, children }: { active: "profile" | "redeem" | "refer"; children: ReactNode }) {
  const email = useStore((s) => s.user.email);
  const hydrated = useStore((s) => s.hydrated);
  const copy = useCopy();
  const day = hydrated ? new Date().toLocaleDateString("en-US", { weekday: "long" }) : "";
  return (
    <>
      <PageHeader
        trail={[{ label: "Account", href: "/nclex/account/profile" }]}
        title={<span suppressHydrationWarning>Happy {day}, {email}!</span>}
        description={copy("account.description")}
      />
      <UnderlineTabs
        tabs={[
          { label: "Profile", href: "/nclex/account/profile" },
          { label: "Redeem a Code", href: "/nclex/account/redeem" },
          { label: "Refer a Friend", href: "/nclex/account/refer" },
        ]}
        active={`/nclex/account/${active}`}
      />
      {children}
    </>
  );
}

export function PanelCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={clsx("mb-4 rounded-lg border border-line bg-white shadow-card", className)}>
      <div className="flex items-center border-b border-line px-6 py-4">
        <h3 className="text-lg leading-6 font-semibold text-ink">{title}</h3>
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

/** Form field: 14/500 label, 18px input, white with a soft teal-gray border. */
export function Field({ label, right, className, ...input }: { label: string; right?: ReactNode } & ComponentProps<"input">) {
  return (
    <label className={clsx("mb-6 block", className)}>
      <div className="mb-2 flex items-start justify-between">
        <h5 className="text-sm leading-[16.8px] font-medium text-muted">{label}</h5>
        {right && <h5 className="text-right text-sm leading-[16.8px] font-medium text-muted">{right}</h5>}
      </div>
      <input
        {...input}
        className={clsx(
          "h-[53px] w-full rounded-lg border px-4 py-3 text-lg leading-[27px] transition-colors duration-100 outline-none",
          input.readOnly
            ? "border-transparent bg-line text-muted"
            : "border-line bg-white text-ink placeholder:text-muted hover:border-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-light)]",
        )}
      />
    </label>
  );
}
