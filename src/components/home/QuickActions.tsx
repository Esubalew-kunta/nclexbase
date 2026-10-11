"use client";

import clsx from "clsx";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Icon, type IconName } from "@/components/ui/Icon";
import { BRAND } from "@/lib/brand";
import { useConfig } from "@/lib/content";
import type { QuickActionKey } from "@/lib/admin/config";

interface Action {
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
  href?: string;
  onClick?: () => void;
  locked?: boolean;
  external?: boolean;
}

/** Quick-action cards (3 columns; 2 on tablet/phone). Order, labels and visibility: Admin > Home & Navigation. Hover: scale(1.01). */
export function QuickActions() {
  const setUi = useStore((s) => s.setUi);
  const plan = useStore((s) => s.user.plan);
  const config = useConfig().home.quickActions;
  const base: Record<QuickActionKey, Omit<Action, "title" | "subtitle">> = {
    createTest: { icon: "qaCreateTest", color: BRAND.primary, onClick: () => setUi({ createTestOpen: true }) },
    dailyWarmup: { icon: "shield", color: BRAND.gold, href: plan === "free" ? "/nclex/upgrade" : "/nclex/daily-warmup", locked: plan === "free" },
    performance: { icon: "qaPerformance", color: BRAND.primary, href: "/nclex/performance" },
    readiness: { icon: "qaReadiness", color: BRAND.primary, href: "/nclex/next-gen-readiness-exams" },
    previousTests: { icon: "qaPreviousTests", color: BRAND.primary, href: "/nclex/previous-tests" },
  };
  const actions: Action[] = config
    .filter((c) => c.visible && base[c.key])
    .map((c) => ({ ...base[c.key], title: c.label, subtitle: c.key === "dailyWarmup" && plan === "free" ? "Upgrade to unlock" : c.subtitle }));

  return (
    <div className="mb-8 grid w-full grid-cols-2 gap-2 lg:grid-cols-3">
      {actions.map((a) => {
        const cls = clsx(
          "flex cursor-pointer items-center rounded-lg px-3 py-3 text-left transition-transform duration-100 hover:scale-[1.01] lg:px-4",
          a.locked ? "border border-dashed border-gold/60 bg-white" : "border border-line bg-white shadow-card hover:border-primary/40",
        );
        const inner = (
          <>
            {a.locked ? (
              <span className="flex size-6 items-center justify-center">
                <Icon name="shield" size={18} style={{ color: a.color }} />
              </span>
            ) : (
              <Icon name={a.icon} size={20} style={{ color: a.color }} className="lg:size-6" />
            )}
            <span className="ml-2 flex min-w-0 flex-1 flex-col items-start gap-1 overflow-hidden lg:ml-3">
              <h4 className={clsx("w-full truncate text-base leading-[22.5px] font-semibold lg:text-lg", a.locked ? "text-muted" : "text-ink")}>{a.title}</h4>
              <p className="hidden w-full truncate text-base leading-4 text-muted lg:block">{a.subtitle}</p>
            </span>
            <Icon name="chevronRightThin" size={18} className="text-primary lg:size-6" />
          </>
        );
        if (a.onClick)
          return (
            <button key={a.title} onClick={a.onClick} className={cls}>
              {inner}
            </button>
          );
        if (a.external)
          return (
            <a key={a.title} href={a.href} target="_blank" rel="noreferrer" className={cls}>
              {inner}
            </a>
          );
        return (
          <Link key={a.title} href={a.href!} className={cls}>
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
