"use client";

import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import type { SubjectId } from "@/lib/types";
import { Icon } from "./Icon";
import { ProgressBar, UsageBar, UsageText } from "./primitives";

/* eslint-disable @next/next/no-img-element */

export function SubjectIcon({ id, size = 32 }: { id: SubjectId; size?: number }) {
  return <img src={`/assets/subjects/${id}.png`} alt="" className="shrink-0" style={{ width: size, height: size }} />;
}

const TYPE_IMG = {
  cases: "case-studies",
  standalone: "standalone",
  readiness: "readiness",
  videos: "crash-course",
  sheets: "cheat-sheets",
  course: "ngn-course",
} as const;

export function TypeIcon({ kind, size = 32 }: { kind: keyof typeof TYPE_IMG; size?: number }) {
  return <img src={`/assets/types/${TYPE_IMG[kind]}.png`} alt="" className="shrink-0" style={{ width: size, height: size }} />;
}

export interface Usage {
  used: number;
  total: number;
  mastered?: number;
  reviewing?: number;
  learning?: number;
}

/** Usage bar + "N of M questions used" block. */
export function UsageBlock({ usage, className }: { usage: Usage; className?: string }) {
  return (
    <div className={clsx("flex flex-col", className)}>
      <UsageBar total={usage.total} mastered={usage.mastered} reviewing={usage.reviewing} learning={usage.learning} className="mb-2" />
      <UsageText used={usage.used} total={usage.total} />
    </div>
  );
}

export function LessonsBlock({ done, total, className }: { done: number; total: number; className?: string }) {
  return (
    <div className={clsx("flex flex-col", className)}>
      <ProgressBar value={total ? (done / total) * 100 : 0} className="mb-2" />
      <UsageText used={done} total={total} unit="lessons completed" />
    </div>
  );
}

/** White gradient card row used on Home (icon, title, bars/subtitle, chevron). Hover: scale(1.01). */
export function HomeRow({
  href,
  icon,
  title,
  children,
  subtitle,
  trailing,
  external,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  subtitle?: string;
  trailing?: ReactNode;
  external?: boolean;
}) {
  const cls =
    "bg-card mb-2 flex items-center rounded-lg px-4 py-3 shadow-card transition-transform duration-100 last:mb-0 hover:scale-[1.01]";
  const body = (
    <>
      {icon}
      <div className="min-w-0 flex-1 pl-4">
        <h4 className={clsx("text-lg leading-[22.5px] font-semibold text-ink-strong", (children || subtitle) && "mb-2")}>{title}</h4>
        {subtitle && <p className="text-base leading-4 text-muted">{subtitle}</p>}
        {children && <div className="mr-6">{children}</div>}
      </div>
      {trailing}
      <span className="flex size-6 shrink-0 items-center justify-center">
        <Icon name="chevronRightThin" size={24} className="text-faint" />
      </span>
    </>
  );
  return external ? (
    <a href={href} className={cls} target="_blank" rel="noreferrer">
      {body}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {body}
    </Link>
  );
}

/**
 * Numbered list row (Case Studies, Standalone systems, Readiness Exams, Crash Courses).
 * White card, 16px 24px padding, gray index, title, usage bar, action on the right.
 */
export function NumberedRow({
  number,
  leading,
  title,
  children,
  action,
  onClick,
  href,
  className,
  footer,
}: {
  number?: number;
  leading?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  footer?: ReactNode;
}) {
  const inner = (
    <div className={clsx("flex px-6 py-4", action ? "items-center" : "items-start")}>
      {(number != null || leading) && (
        <div className="flex flex-col items-center justify-between self-stretch">
          {leading ?? <h4 className="text-lg leading-[22.5px] font-semibold text-faint">{number}</h4>}
        </div>
      )}
      <div className="flex min-w-0 flex-1 items-center">
        <div className="flex min-w-0 flex-1 flex-col justify-center px-4">
          <h4 className={clsx("text-lg leading-[22.5px] font-semibold text-ink-strong", children ? "mb-2" : "")}>{title}</h4>
          {children}
        </div>
        {action && <div className="flex shrink-0 items-center justify-center gap-2 text-faint">{action}</div>}
      </div>
    </div>
  );
  const cls = clsx("mb-2 block rounded-lg bg-white shadow-card transition-transform duration-100 hover:scale-[1.01]", (onClick || href) && "cursor-pointer", className);
  if (href)
    return (
      <Link href={href} className={cls}>
        {inner}
        {footer}
      </Link>
    );
  return (
    <div className={cls} onClick={onClick}>
      {inner}
      {footer}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Semi-circle gauge (Performance + score report)                      */
/* ------------------------------------------------------------------ */

/**
 * Same geometry as the live SVG: arc r=60 centered at (70,70), 10px stroke,
 * round caps drawn as circles, target tick from r=55 to r=65 and a target
 * (or check) icon at r=72. Percent + label are SVG text like the original.
 */
export function Gauge({
  value,
  target,
  label,
  color = "#5b8efc",
  met,
  height = 199,
}: {
  value: number;
  target?: number;
  label: string;
  color?: string;
  met?: boolean;
  height?: number;
}) {
  const f = Math.max(0, Math.min(100, value)) / 100;
  const pt = (frac: number, r: number) => {
    const a = Math.PI * (1 - frac);
    return [70 + r * Math.cos(a), 70 - r * Math.sin(a)] as const;
  };
  const [ex, ey] = pt(f, 60);
  const tf = target != null ? target / 100 : null;
  const tickColor = met ? "#66AC5C" : "#C8C9CE";
  return (
    <svg width="100%" height={height} viewBox="5 -6.16 131 81.16" preserveAspectRatio="none" aria-label={`${Math.round(value)}% ${label}`}>
      <path d="M 10 70 A 60 60 0 0 1 130 70" stroke="#e5e7ef" strokeWidth="10" fill="none" />
      <circle cx="10" cy="70" r="5" fill={f > 0 ? color : "#e5e7ef"} />
      <circle cx="130" cy="70" r="5" fill={f >= 1 ? color : "#e5e7ef"} />
      {f > 0 && <path d={`M 10 70 A 60 60 0 0 1 ${ex} ${ey}`} stroke={color} strokeWidth="10" fill="none" />}
      {tf != null && (
        <>
          <line x1={pt(tf, 55)[0]} y1={pt(tf, 55)[1]} x2={pt(tf, 65)[0]} y2={pt(tf, 65)[1]} stroke={tickColor} strokeWidth="1" strokeLinecap="round" />
          <g transform={`translate(${pt(tf, 72)[0] - 5}, ${pt(tf, 72)[1] - 5}) scale(0.42)`} fill={tickColor}>
            {met ? (
              <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm4.31 5.56L10.5 13.4 7.7 10.6a1 1 0 0 0-1.4 1.42l3.5 3.5a1 1 0 0 0 1.4 0l6.5-6.5a1 1 0 0 0-1.4-1.46Z" />
            ) : (
              <path d="M12 2c1.2 0 2.36.21 3.42.6l-1.19 1.2a8.51 8.51 0 1 0 5.97 5.97l1.2-1.2A10 10 0 1 1 12 2Zm0 4c.52 0 1.02.07 1.5.19v1.57a4.5 4.5 0 1 0 2.74 2.74h1.57A6.01 6.01 0 1 1 12 6Zm2 6a2 2 0 1 1-1.22-1.84l1.72-1.72V5.25c0-.2.08-.39.22-.53l2.5-2.5a.75.75 0 0 1 1.28.53V5.5h2.75a.75.75 0 0 1 .53 1.28l-2.5 2.5a.75.75 0 0 1-.53.22h-3.19l-1.72 1.72c.1.24.16.5.16.78Z" />
            )}
          </g>
        </>
      )}
      <text x="70" y="62" textAnchor="middle" fontSize="32" fontWeight="700" fill={color} fontFamily="var(--font-brand), sans-serif">
        {Math.round(value)}%
      </text>
      <text x="70" y="74" textAnchor="middle" fontSize="8" fill="#7a7e9f" fontFamily="var(--font-brand), sans-serif">
        {label}
      </text>
    </svg>
  );
}

/** Target pill: white (or green when met), radius 256px, 32px icon, 18px text. */
export function TargetPill({ children, color = "#3b82f6", met }: { children: ReactNode; color?: string; met?: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-[256px] border p-1 shadow-[0_1px_4px_rgba(0,0,0,0.1)]",
        met ? "border-[#66ac5c] bg-[#66ac5c] text-white" : "border-[#ededf0] bg-white text-ink-strong",
      )}
    >
      {met ? <Icon name="targetCheck" size={32} className="text-white" /> : <Icon name="target" size={32} style={{ color }} />}
      <p className="mr-2 text-lg leading-[18px]">{children}</p>
    </span>
  );
}
