"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

/** Prototype session gate: signed-out visitors go to /auth/signin (demo one-click sign-in lives there). */
export function StudentGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useStore((s) => s.hydrated);
  const signedIn = useStore((s) => s.user.signedIn);
  const out = hydrated && !signedIn;
  useEffect(() => {
    if (out) router.replace(`/auth/signin?next=${encodeURIComponent(pathname)}`);
  }, [out, pathname, router]);
  return out ? null : <>{children}</>;
}
