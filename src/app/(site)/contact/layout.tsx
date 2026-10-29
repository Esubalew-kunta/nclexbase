import type { Metadata } from "next";

/*
 * Title and description only. The page itself is a client component -- it reads the site name,
 * the support address and the plan prices from config -- and a client component cannot export
 * metadata, so it lives here instead.
 */
export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach NCLEXBase about a plan, a payment or a question.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
