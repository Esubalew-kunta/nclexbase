import Link from "next/link";
import { LogoStacked } from "@/components/ui/Logo";

// Static hosts serve this file at "/". A meta refresh redirects without relying on JS.
export default function Index() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/nclex/" />
      <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-4">
        <LogoStacked width={260} />
        <Link href="/nclex" className="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-hover">
          Open NCLEXBase
        </Link>
      </main>
    </>
  );
}
