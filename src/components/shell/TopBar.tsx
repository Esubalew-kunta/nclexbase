"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/ui/Logo";
import { SITE_NAME } from "@/lib/brand";
import { SearchBox } from "./SearchBox";
import { SidebarContent } from "./Sidebar";
import { DevResetButton } from "./DevResetButton";
import { ViewSwitch } from "./ViewSwitch";

/* eslint-disable @next/next/no-img-element */

export function UserAvatar({ size = 42 }: { size?: number }) {
  const initial = useStore((s) => (s.user.name || s.user.email).charAt(0));
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border border-line bg-white transition-colors duration-100 hover:border-primary hover:bg-primary-light"
      style={{ width: size, height: size }}
    >
      <span className="flex items-center justify-center rounded-full p-0.5" style={{ width: size - 2, height: size - 2 }}>
        <span className="flex size-9 items-center justify-center rounded-[36px] bg-primary text-[13px] leading-none font-semibold text-white uppercase">
          {initial}
        </span>
      </span>
    </span>
  );
}

/**
 * Wraps the top bar. Once the page scrolls under it, it gets a solid page-colored
 * backdrop and a divider instead of letting content show through behind the buttons.
 */
export function TopBarFrame({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = document.getElementById("app-scroll");
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 0);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="absolute inset-x-0 top-0 z-20">
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-[72px] border-b border-line bg-background/95 backdrop-blur transition-opacity duration-200 ${scrolled ? "opacity-100" : "opacity-0"}`}
      />
      <div className="relative">{children}</div>
    </div>
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
          className="mr-2 flex size-[42px] cursor-pointer items-center justify-center rounded-[64px] border border-line bg-white text-primary hover:bg-primary-light lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
          </svg>
        </button>
        <Link href="/nclex" aria-label={`${SITE_NAME} home`} className="mr-2 flex items-center lg:hidden">
          <LogoMark size={34} />
        </Link>
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="mr-2 hidden size-[42px] cursor-pointer items-center justify-center rounded-[64px] border border-line bg-white text-primary transition-colors hover:bg-primary-light lg:flex"
        >
          <Icon name="back" size={24} style={{ paddingRight: 2 }} />
        </button>
        <div className="hidden lg:block">
          <SearchBox />
        </div>
      </div>

      <div className="flex items-center">
        {/* TEMPORARY: prototype-only controls (see ViewSwitch.tsx and DevResetButton.tsx). */}
        <div className="mr-2">
          <ViewSwitch current="student" />
        </div>
        <DevResetButton />
        <div className="group relative hidden sm:block">
          <p className="flex h-[42px] cursor-pointer items-center rounded-full border border-line bg-white px-4 py-3 text-base leading-4 font-semibold text-ink transition-colors duration-100 hover:bg-primary-light">
            <img src="/assets/brand/flame.png" alt="Streak" className="mr-2 h-4 w-3.5" />
            {streak}
          </p>
          <div className="pointer-events-none absolute top-[52px] left-1/2 z-40 hidden -translate-x-1/2 rounded-lg bg-primary-hover px-3 py-2 text-sm leading-5 font-semibold whitespace-nowrap text-white shadow-lg group-hover:block">
            <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-primary-hover" />
            Come back each day to keep your streak going!
          </div>
        </div>
        {plan === "free" && (
          <Link
            href="/nclex/upgrade"
            className="ml-2 flex h-[42px] items-center justify-center rounded-3xl bg-gold px-4 py-3 text-base leading-4 font-semibold text-ink transition-[filter] duration-100 hover:brightness-95"
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
      <div className="animate-fade-in absolute inset-0 bg-[rgba(9,68,72,0.35)]" onClick={close} />
      <div className="animate-slide-in-left absolute inset-y-0 left-0 w-64 max-w-[85vw] bg-white shadow-2xl">
        <SidebarContent onNavigate={close} />
      </div>
    </div>
  );
}
