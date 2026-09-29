import clsx from "clsx";
import Link from "next/link";
import { Baby, Bandage, Brain, BriefcaseMedical, ChevronRight, Cross, FileText, HeartPulse, Milk, Pill, SquarePlay, Stethoscope, Target, CirclePlay, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { SubjectId } from "@/lib/types";
import { ProgressBar } from "./primitives";

/* Subject icons: the live site uses illustrated PNGs; these are tinted glyphs. */
const SUBJECT_ICON: Record<SubjectId, { icon: LucideIcon; color: string; bg: string }> = {
  "adult-health": { icon: HeartPulse, color: "#e0524a", bg: "#fdeceb" },
  "child-health": { icon: Baby, color: "#e2718a", bg: "#fdedf1" },
  fundamentals: { icon: Bandage, color: "#e58a5c", bg: "#fdf1ea" },
  "maternal-and-newborn-health": { icon: Milk, color: "#4b9ee0", bg: "#eaf4fd" },
  "mental-health": { icon: Brain, color: "#4a4a58", bg: "#efeff3" },
  pharmacology: { icon: Pill, color: "#d9577a", bg: "#fceaf0" },
  "management-of-care": { icon: Cross, color: "#e0353a", bg: "#fdeaea" },
};

export function SubjectIcon({ id, size = 28 }: { id: SubjectId; size?: number }) {
  const { icon: Icon, color, bg } = SUBJECT_ICON[id];
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-lg" style={{ width: size, height: size, background: bg }}>
      <Icon style={{ color, width: size * 0.6, height: size * 0.6 }} strokeWidth={2.2} />
    </span>
  );
}

const TYPE_ICON = {
  cases: { icon: BriefcaseMedical, color: "#e0353a" },
  standalone: { icon: Stethoscope, color: "#4b9ee0" },
  readiness: { icon: Target, color: "#e0353a" },
  videos: { icon: SquarePlay, color: "#e0353a" },
  sheets: { icon: FileText, color: "#9a9aa6" },
  course: { icon: CirclePlay, color: "#e0353a" },
} as const;

export function TypeIcon({ kind, size = 28 }: { kind: keyof typeof TYPE_ICON; size?: number }) {
  const { icon: Icon, color } = TYPE_ICON[kind];
  return (
    <span className="inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <Icon style={{ color, width: size * 0.8, height: size * 0.8 }} strokeWidth={2} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Semi-circle gauge used on Performance and the score report          */
/* ------------------------------------------------------------------ */

export function Gauge({
  value,
  target,
  label,
  size = 240,
  caption,
}: {
  value: number;
  target?: number;
  label: string;
  size?: number;
  caption?: ReactNode;
}) {
  const stroke = size * 0.1;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const start = 150; // degrees, 0 = 3 o'clock, clockwise
  const sweep = 240;
  const polar = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const arc = (from: number, to: number) => {
    const [x1, y1] = polar(from);
    const [x2, y2] = polar(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const v = Math.max(0, Math.min(100, value));
  const tickDeg = target != null ? start + (sweep * target) / 100 : null;
  const [tx1, ty1] = tickDeg != null ? polar(tickDeg) : [0, 0];

  return (
    <div className="relative mx-auto" style={{ width: size, height: size * 0.82 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden>
        <defs>
          <linearGradient id="gauge-fill" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0%" stopColor="#2f6fe4" />
            <stop offset="100%" stopColor="#6255e5" />
          </linearGradient>
        </defs>
        <path d={arc(start, start + sweep)} stroke="#ebebef" strokeWidth={stroke} fill="none" strokeLinecap="round" />
        {v > 0 && (
          <path d={arc(start, start + (sweep * v) / 100)} stroke="url(#gauge-fill)" strokeWidth={stroke} fill="none" strokeLinecap="round" />
        )}
        {tickDeg != null && (
          <line
            x1={tx1}
            y1={ty1}
            x2={cx + (r - stroke * 0.9) * Math.cos((tickDeg * Math.PI) / 180)}
            y2={cy + (r - stroke * 0.9) * Math.sin((tickDeg * Math.PI) / 180)}
            stroke="#b7b7c0"
            strokeWidth={2}
          />
        )}
      </svg>
      <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: size * 0.3 }}>
        <span className="text-[15px] font-semibold text-[#2f6fe4]">{caption}</span>
        <span className="bg-gradient-to-r from-[#2f6fe4] to-brand bg-clip-text font-bold leading-none text-transparent" style={{ fontSize: size * 0.24 }}>
          {Math.round(value)}%
        </span>
        <span className="mt-1 text-[17px] text-muted">{label}</span>
      </div>
    </div>
  );
}

export function TargetPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[17px] text-ink shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
      <Target className="size-5 text-[#2f6fe4]" strokeWidth={2.2} />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* List rows                                                           */
/* ------------------------------------------------------------------ */

export function ProgressRow({
  href,
  leading,
  title,
  used,
  total,
  unit = "questions used",
  subtitle,
  action,
  trailing,
  number,
}: {
  href?: string;
  leading?: ReactNode;
  title: string;
  used?: number;
  total?: number;
  unit?: string;
  subtitle?: string;
  action?: ReactNode;
  trailing?: ReactNode;
  number?: number;
}) {
  const body = (
    <>
      {number != null && <span className="w-6 shrink-0 text-center text-base text-faint">{number}</span>}
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-lg font-semibold text-ink-strong">{title}</div>
        {total != null ? (
          <>
            <ProgressBar value={total ? ((used ?? 0) / total) * 100 : 0} className="mt-2.5 max-w-[920px]" />
            <div className="mt-2 text-base text-muted">
              <b className="font-semibold text-ink">{used ?? 0}</b> of {total} {unit}
            </div>
          </>
        ) : (
          subtitle && <div className="mt-1 text-base text-muted">{subtitle}</div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {trailing}
      {href && !action && <ChevronRight className="size-5 shrink-0 text-faint" />}
    </>
  );
  const cls = "bg-card flex items-center gap-4 rounded-lg px-6 py-5 shadow-card transition-transform";
  return href ? (
    <Link href={href} className={clsx(cls, "hover:-translate-y-0.5 hover:scale-[1.005]")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
