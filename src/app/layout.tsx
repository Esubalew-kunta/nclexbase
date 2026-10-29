import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shell/Providers";

// Production uses Adobe's proxima-nova. Figtree is the closest free substitute.
const brand = Figtree({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="en" className={`${brand.variable} h-full`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
