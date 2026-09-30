import type { CSSProperties } from "react";
import { ICONS, type IconName } from "./iconData";

/** Renders one of the live app's SVG icons. Colors follow `currentColor`. */
export function Icon({ name, size = 20, className, style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  const { attrs, inner } = ICONS[name] as { attrs: Record<string, string>; inner: string };
  return (
    <svg
      viewBox={attrs.viewBox}
      width={size}
      height={size}
      fill={attrs.fill ?? "currentColor"}
      stroke={attrs.stroke}
      strokeLinecap={attrs["stroke-linecap"] as "round" | undefined}
      strokeLinejoin={attrs["stroke-linejoin"] as "round" | undefined}
      strokeWidth={attrs["stroke-width"]}
      aria-hidden
      focusable="false"
      className={className}
      style={{ flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

export type { IconName };
