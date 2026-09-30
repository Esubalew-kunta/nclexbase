"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";
import { SearchBox } from "./SearchBox";
import { SidebarContent } from "./Sidebar";
import { DevResetButton } from "./DevResetButton";

/* eslint-disable @next/next/no-img-element */

export function UserAvatar({ size = 42 }: { size?: number }) {
  const initial = useStore((s) => (s.user.name || s.user.email).charAt(0));
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border border-white/5 bg-white/10 transition-colors duration-100 hover:bg-white/20"
      style={{ width: size, height: size }}
    >
      <span className="flex items-center justify-center rounded-full p-0.5" style={{ width: size - 2, height: size - 2 }}>
        <span className="flex size-9 items-center justify-center rounded-[36px] bg-[#e0e6eb] text-[13px] leading-none font-medium text-[#2d3a46] uppercase">
          {initial}
        </span>
      </span>
    </span>
  );
}

export function TopBar() {
  const router = useRouter();
  const streak = useStore((s) => s.streak.count);
  const plan = useStore((s) => s.user.plan);
  const setUi = useStore((s) => s.setUi);

  return (
    <div className="mx-0 flex h-[72px] items-center justify-between px-4 sm:mx-4 sm:px-8">
      <div className="flex items-center">
        <button
          onClick={() => setUi({ mobileNavOpen: true })}
          aria-label="Open menu"
          className="mr-2 flex size-[42px] cursor-pointer items-center justify-center rounded-[64px] bg-white/10 text-white hover:bg-white/30 lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
          </svg>
        </button>
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="mr-2 hidden size-[42px] cursor-pointer items-center justify-center rounded-[64px] bg-white/10 text-white transition-colors hover:bg-white/30 lg:flex"
        >
          <Icon name="back" size={24} style={{ paddingRight: 2 }} />
        </button>
        <div className="hidden lg:block">
          <SearchBox />
        </div>
      </div>

      <div className="flex items-center">
        {/* TEMPORARY: prototype-only reset button (see DevResetButton.tsx). */}
        <DevResetButton />
        <div className="group relative hidden sm:block">
          <p className="flex h-[42px] cursor-pointer items-center rounded-full bg-white/10 px-4 py-3 text-base leading-4 font-semibold text-white/90 transition-colors duration-100 hover:bg-white/20">
            <img src="/assets/brand/flame.png" alt="Streak" className="mr-2 h-4 w-3.5" />
            {streak}
          </p>
          <div className="pointer-events-none absolute top-[52px] left-1/2 z-40 hidden -translate-x-1/2 rounded-lg bg-shell px-3 py-2 text-sm leading-5 font-semibold whitespace-nowrap text-white shadow-lg group-hover:block">
            <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-shell" />
            Come back each day to keep your streak going!
          </div>
        </div>
        {plan === "free" && (
          <Link
            href="/nclex/upgrade"
            className="ml-2 flex h-[42px] items-center justify-center rounded-3xl border border-white/5 bg-white/10 px-4 py-3 text-base leading-4 font-semibold text-white transition-colors duration-100 hover:bg-white/30"
          >
            <span className="mr-2 flex">
              <Icon name="shield" size={16} />
            </span>
            Upgrade
          </Link>
        )}
        <Link href="/nclex/account" aria-label="Account" className="ml-2">
          <UserAvatar />
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
      <div className="animate-fade-in absolute inset-0 bg-[rgba(21,26,30,0.4)]" onClick={close} />
      <div className="animate-slide-in-left absolute inset-y-0 left-0 w-64 max-w-[85vw] bg-shell shadow-2xl">
        <SidebarContent onNavigate={close} />
      </div>
    </div>
  );
}
