import Link from "next/link";

// Static hosts serve this file at "/". A meta refresh redirects without relying on JS.
export default function Index() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/nclex/" />
      <main className="bg-app-gradient flex min-h-dvh items-center justify-center">
        <Link href="/nclex" className="rounded-full bg-white px-5 py-2 font-semibold text-brand">
          Open NCLEX Bootcamp
        </Link>
      </main>
    </>
  );
}
