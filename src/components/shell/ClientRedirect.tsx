"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Static-export friendly redirect (server redirects aren't available in `output: export`). */
export function ClientRedirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => router.replace(to), [router, to]);
  return null;
}
