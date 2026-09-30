"use client";

import clsx from "clsx";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Icon, type IconName } from "@/components/ui/Icon";

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

/** Six quick-action cards (3 columns; 2 on tablet/phone). Hover: scale(1.01). */
export function QuickActions() {
  const setUi = useStore((s) => s.setUi);
  const plan = useStore((s) => s.user.plan);
  const actions: Action[] = [
    { title: "Create Test", subtitle: "Study up to 85 questions at a time", icon: "qaCreateTest", color: "#6255e5", onClick: () => setUi({ createTestOpen: true }) },
    {
      title: "Daily Warmup",
      subtitle: plan === "free" ? "Upgrade to unlock" : "5 questions to warm up",
      icon: "shield",
      color: "rgba(255,255,255,.7)",
      href: plan === "free" ? "/nclex/upgrade" : "/nclex/next-gen-standalone",
      locked: plan === "free",
    },
    { title: "Performance", subtitle: "See if you're ready to pass", icon: "qaPerformance", color: "#6366f1", href: "/nclex/performance" },
    { title: "Readiness Exams", subtitle: "Gauge exam readiness", icon: "qaReadiness", color: "#f43f5e", href: "/nclex/next-gen-readiness-exams" },
    { title: "Previous Tests", subtitle: "Review past test attempts", icon: "qaPreviousTests", color: "#3b82f6", href: "/nclex/previous-tests" },
    { title: "Study Group", subtitle: "Join 200k+ fellow students", icon: "qaStudyGroup", color: "#ba3996", href: "https://www.facebook.com/groups/2169829559872032", external: true },
  ];

  return (
    <div className="mb-8 grid w-full grid-cols-2 gap-2 lg:grid-cols-3">
      {actions.map((a) => {
        const cls = clsx(
          "flex cursor-pointer items-center rounded-lg px-3 py-3 text-left transition-transform duration-100 hover:scale-[1.01] lg:px-4",
          a.locked ? "bg-black/10" : "bg-card shadow-card",
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
              <h4 className={clsx("w-full truncate text-base leading-[22.5px] font-semibold lg:text-lg", a.locked ? "text-white/70" : "text-ink-strong")}>{a.title}</h4>
              <p className={clsx("hidden w-full truncate text-base leading-4 lg:block", a.locked ? "text-white/70" : "text-muted")}>{a.subtitle}</p>
            </span>
            <Icon name="chevronRightThin" size={18} className="text-faint lg:size-6" />
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
