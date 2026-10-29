import type { Metadata } from "next";

/*
 * Title and description only. The page itself is a client component -- it reads the site name,
 * the support address and the plan prices from config -- and a client component cannot export
 * metadata, so it lives here instead.
 */
export const metadata: Metadata = {
  title: "Terms of use",
  description: "The agreement between you and NCLEXBase when you use this site.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
