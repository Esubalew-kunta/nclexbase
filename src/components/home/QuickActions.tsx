"use client";

import clsx from "clsx";
import Link from "next/link";
import { BookOpen, ChartNoAxesColumn, ChevronRight, ShieldCheck, SquarePlus, Target, Users, type LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";

interface Action {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  href?: string;
  onClick?: () => void;
  locked?: boolean;
  external?: boolean;
}

export function QuickActions() {
  const setUi = useStore((s) => s.setUi);
  const plan = useStore((s) => s.user.plan);
  const actions: Action[] = [
    { title: "Create Test", subtitle: "Study up to 85 questions at a time", icon: SquarePlus, color: "#6255e5", onClick: () => setUi({ createTestOpen: true }) },
    { title: "Daily Warmup", subtitle: plan === "free" ? "Upgrade to unlock" : "5 questions to start your day", icon: ShieldCheck, color: "#6255e5", href: plan === "free" ? "/nclex/upgrade" : "/nclex/next-gen-standalone", locked: plan === "free" },
    { title: "Performance", subtitle: "See if you're ready to pass", icon: ChartNoAxesColumn, color: "#6255e5", href: "/nclex/performance" },
    { title: "Readiness Exams", subtitle: "Gauge exam readiness", icon: Target, color: "#e0353a", href: "/nclex/next-gen-readiness-exams" },
    { title: "Previous Tests", subtitle: "Review past test attempts", icon: BookOpen, color: "#2f6fe4", href: "/nclex/previous-tests" },
    { title: "Study Group", subtitle: "Join 200k+ fellow students", icon: Users, color: "#c0399a", href: "https://www.facebook.com/groups/", external: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
      {actions.map((a) => {
        const Icon = a.icon;
        const cls = clsx(
          "group flex min-h-[56px] items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-transform hover:-translate-y-0.5 sm:min-h-[66px]",
          a.locked ? "bg-white/10 text-white" : "bg-card shadow-card",
        );
        const inner = (
          <>
            <Icon className="size-5 shrink-0" style={{ color: a.locked ? "rgba(255,255,255,.75)" : a.color }} strokeWidth={2.4} />
            <span className="min-w-0 flex-1">
              <span className={clsx("block truncate text-base font-semibold sm:text-lg", a.locked ? "text-white/80" : "text-ink-strong")}>{a.title}</span>
              <span className={clsx("hidden truncate text-base sm:block", a.locked ? "text-white/70" : "text-muted")}>{a.subtitle}</span>
            </span>
            <ChevronRight className={clsx("size-4 shrink-0", a.locked ? "text-white/60" : "text-faint")} />
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
