"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Flame, Menu, ShieldCheck, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { SearchBox } from "./SearchBox";
import { SidebarContent } from "./Sidebar";

export function TopBar() {
  const router = useRouter();
  const streak = useStore((s) => s.streak.count);
  const plan = useStore((s) => s.user.plan);
  const initial = useStore((s) => (s.user.name || s.user.email).charAt(0).toLowerCase());
  const setUi = useStore((s) => s.setUi);

  return (
    <div className="flex h-[72px] items-center gap-3">
      <button
        onClick={() => setUi({ mobileNavOpen: true })}
        aria-label="Open menu"
        className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15 lg:hidden"
      >
        <Menu className="size-5" />
      </button>
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="hidden size-[42px] items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15 lg:flex"
      >
        <ChevronLeft className="size-5" />
      </button>
      <div className="hidden lg:block">
        <SearchBox />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span
          title={`${streak}-day study streak`}
          className="hidden h-[42px] items-center gap-1.5 rounded-full bg-white/10 px-4 font-semibold text-white sm:flex"
        >
          <Flame className="size-[18px] fill-[#ff9a3d] text-[#ff7a1a]" />
          {streak}
        </span>
        {plan === "free" && (
          <Link
            href="/nclex/upgrade"
            className="flex h-[42px] items-center gap-2 rounded-full bg-white/10 px-4 font-semibold text-white hover:bg-white/15"
          >
            <ShieldCheck className="size-[18px]" />
            Upgrade
          </Link>
        )}
        <Link
          href="/nclex/account"
          aria-label="Account"
          className="flex size-[38px] items-center justify-center rounded-full bg-[#e8e8f0] text-sm font-semibold text-ink ring-2 ring-white/60"
        >
          {initial}
        </Link>
      </div>
    </div>
  );
}

export function MobileNav() {
  const open = useStore((s) => s.mobileNavOpen);
  const setUi = useStore((s) => s.setUi);
  if (!open) return null;
  const close = () => setUi({ mobileNavOpen: false });
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={close} />
      <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-shell shadow-2xl">
        <button onClick={close} aria-label="Close menu" className="absolute top-4 right-3 z-10 rounded-full p-2 text-white/80 hover:bg-white/10">
          <X className="size-5" />
        </button>
        <SidebarContent onNavigate={close} />
      </div>
    </div>
  );
}
