import clsx from "clsx";
import { SITE_NAME } from "@/lib/brand";

/* eslint-disable @next/next/no-img-element */

/*
 * Official NCLEXBase artwork (public/assets/brand/nclexbase-*.png), taken from the
 * supplied logo files with the background made transparent. Never recolor or stretch
 * these: every <img> sets one dimension and lets the other follow the file's ratio.
 */
const MARK = { gold: "/assets/brand/nclexbase-mark-gold.png", teal: "/assets/brand/nclexbase-mark.png" } as const;
const WORDMARK = "/assets/brand/nclexbase-wordmark.png"; // 868 x 120
const STACKED = "/assets/brand/nclexbase-logo.png"; // 876 x 540

/** The "N" heartbeat symbol on its own (favicons, compact headers). */
export function LogoMark({ size = 36, tone = "gold", className }: { size?: number; tone?: keyof typeof MARK; className?: string }) {
  return <img src={MARK[tone]} alt="" aria-hidden className={clsx("shrink-0 object-contain", className)} style={{ height: size, width: "auto" }} />;
}

/** Horizontal lockup: gold mark + "NCLEXBase" wordmark. For light backgrounds. */
export function Logo({ height = 36, className }: { height?: number; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center", className)}>
      <LogoMark size={height} />
      <img src={WORDMARK} alt={SITE_NAME} className="ml-2 w-auto shrink-0" style={{ height: Math.round(height * 0.55) }} />
    </span>
  );
}

/** The full stacked logo exactly as supplied (mark above wordmark). */
export function LogoStacked({ width = 220, className }: { width?: number; className?: string }) {
  return <img src={STACKED} alt={SITE_NAME} className={clsx("h-auto", className)} style={{ width }} />;
}
