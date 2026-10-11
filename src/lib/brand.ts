/**
 * NCLEXBase.com brand colors for places that need raw values (SVG attributes, inline
 * styles, chart series). Mirrors the tokens in app/globals.css; use Tailwind classes
 * (`bg-primary`, `text-muted`, ...) everywhere else.
 */
export const BRAND = {
  primary: "#0E5A5C",
  primaryHover: "#094448",
  primaryLight: "#E8F2F2",
  gold: "#C9A34E",
  background: "#F8FAFA",
  surface: "#FFFFFF",
  examInk: "#000000",
  ink: "#111111",
  muted: "#647779",
  faint: "#9AABAC",
  line: "#D9E3E3",
  success: "#2E7D5B",
  warning: "#D89B2B",
  error: "#B42318",
  info: "#2F6F73",
} as const;

export const SITE_NAME = "NCLEXBase.com";
export const PRODUCT_NAME = "NCLEXBase";

/** Styles for the printable HTML downloads (study guide, study schedule): cheatsheet-style teal header with a gold strip. */
export const PRINT_CSS = [
  `body{font-family:Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:${BRAND.examInk}}`,
  `.brand{display:flex;align-items:center;justify-content:space-between;gap:16px;background:${BRAND.primary};color:#fff;padding:14px 20px;border-bottom:4px solid ${BRAND.gold};border-radius:6px 6px 0 0;margin-bottom:20px}`,
  `.brand h1{margin:0;font-size:24px}.brand span{color:${BRAND.gold};font-weight:700;font-size:12px;letter-spacing:.05em;text-transform:uppercase}`,
  `h2{margin-top:32px;color:${BRAND.primary};border-bottom:2px solid ${BRAND.line};padding-bottom:6px}`,
  `h3{margin:16px 0 4px;font-size:15px;color:${BRAND.muted};text-transform:uppercase}li{margin:2px 0}`,
  `@media print{.brand{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`,
].join("");
