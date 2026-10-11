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
