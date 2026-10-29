import type { Metadata, Viewport } from "next";
import { Figtree, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shell/Providers";

// Production uses Adobe's proxima-nova. Figtree is the closest free substitute.
const brand = Figtree({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Public-site headlines only -- never the app, never the exam. One weight, so it costs one
// file, and it is what makes a page from an unknown company read as an institution.
//
// Named `--font-newsreader`, not `--font-serif`: Tailwind v4 ships its own `--font-serif`
// theme token, and both land at the same specificity, so the winner would come down to CSS
// source order and the headline would silently fall back to Georgia.
const serif = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["500"],
  style: ["normal"],
});

export const metadata: Metadata = {
  title: { default: "NCLEXBase.com", template: "%s | NCLEXBase.com" },
  description: "NCLEXBase.com: NCLEX preparation for nurses and nursing students. Next Gen case studies, practice questions, readiness exams, and cheat sheets.",
  applicationName: "NCLEXBase.com",
  // Keep the whole site out of search engines and AI answer engines (owner's
  // decision). `robots.ts` and the server's X-Robots-Tag headers say the same.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: { index: false, follow: false, noimageindex: true, "max-snippet": 0, "max-image-preview": "none", "max-video-preview": 0 },
  },
};

export const viewport: Viewport = {
  themeColor: "#0E5A5C",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${brand.variable} ${serif.variable} h-full`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
