"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SUBJECTS } from "@/data/catalog";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";
import { NAV, type NavLink } from "./nav";

export const normalize = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);

/* eslint-disable @next/next/no-img-element */

/** Logo + product name (NCLEX only, no product switcher). */
function Brand() {
  return (
    <div className="flex h-[72px] p-4">
      <Link href="/nclex" className="flex items-center">
        <img src="/assets/brand/logo-mark.png" alt="" className="mr-2 size-9" />
        <div className="w-[127px]">
          <img src="/assets/brand/logo-word.png" alt="Bootcamp.com" className="h-5 w-[120px]" />
          <div className="mt-px text-sm leading-[14px] whitespace-nowrap text-faint">NCLEX Bootcamp</div>
        </div>
      </Link>
    </div>
  );
}

function Item({ link, active, onNavigate, indent }: { link: NavLink; active: boolean; onNavigate?: () => void; indent?: boolean }) {
  const setUi = useStore((s) => s.setUi);
  const cls = clsx(
    "group flex h-[42px] cursor-pointer items-center rounded-lg p-3 transition-colors",
    active ? "bg-white/5 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
  );
  const inner = (
    <>
      {!indent && <Icon name={link.icon} size={20} className={active ? "text-white" : "text-current"} />}
      <h4 className={clsx("ml-2.5 min-w-0 flex-1 truncate text-base leading-4", active ? "font-bold text-white" : "font-normal")}>{link.label}</h4>
      {link.external && <Icon name="externalLink" size={16} className="hidden text-white/50 group-hover:block" />}
    </>
  );
  if (link.action === "contact")
    return (
      <div className={cls} onClick={() => setUi({ contactOpen: true })}>
        {inner}
      </div>
    );
  if (link.external)
    return (
      <a href={link.href} target="_blank" rel="noreferrer" className={cls}>
        {inner}
      </a>
    );
  return (
    <Link href={link.href} className={cls} onClick={onNavigate} aria-current={active ? "page" : undefined}>
      {inner}
    </Link>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = normalize(usePathname());
  const plan = useStore((s) => s.user.plan);
  const setUi = useStore((s) => s.setUi);
  const subjectsOpen = useStore((s) => s.sidebarSubjectsOpen);
  const inSubject = SUBJECTS.some((s) => pathname.startsWith(`/nclex/${s.id}`));
  const open = subjectsOpen || inSubject;

  const isActive = (href: string) =>
    href === "/nclex" ? pathname === "/nclex" : href.includes("strategy-course") ? pathname.startsWith("/nclex/next-gen-strategy-course") : pathname.startsWith(href);

  return (
    <div className="relative h-full">
      <div className={clsx("h-full overflow-y-auto [scrollbar-width:none]", plan === "free" ? "pb-[212px]" : "pb-6")}>
        <Brand />
        <button
          onClick={() => {
            onNavigate?.();
            setUi({ createTestOpen: true });
          }}
          className="mx-4 mb-2 inline-flex h-[42px] cursor-pointer items-center rounded-[64px] bg-brand p-4 text-white shadow-[0_2px_0_0_#4a3ac8] transition-[background,box-shadow,transform] duration-[50ms] hover:bg-[#6765ef] active:translate-y-[2px] active:shadow-none"
        >
          <Icon name="plusSquare" size={20} />
          <span className="ml-2 text-base leading-4 font-semibold">Create Test</span>
        </button>

        <nav className="px-4" aria-label="Main">
          {NAV.map((section, si) => (
            <div key={si}>
              {section.title && <div className="px-3 pt-2 text-[10px] leading-[10px] font-semibold text-muted uppercase">{section.title}</div>}
              <div className="py-2">
                {section.subjects && (
                  <div className="mb-1">
                    <div
                      onClick={() => useStore.getState().setSidebarSubjectsOpen(!open)}
                      className="flex h-[42px] cursor-pointer items-center rounded-lg p-3 text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                      aria-expanded={open}
                    >
                      <Icon name="subjects" size={20} />
                      <h4 className="ml-2.5 flex-1 text-base leading-4">Subjects</h4>
                      <svg viewBox="0 0 24 24" className="size-5 text-faint" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={open ? "m19.5 8.25-7.5 7.5-7.5-7.5" : "m8.25 4.5 7.5 7.5-7.5 7.5"} />
                      </svg>
                    </div>
                    {open && (
                      <div className="pl-5">
                        {SUBJECTS.map((s) => (
                          <Item key={s.id} indent link={{ label: s.name, href: `/nclex/${s.id}`, icon: "home" }} active={pathname.startsWith(`/nclex/${s.id}`)} onNavigate={onNavigate} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {section.links.map((link) => (
                  <Item key={link.label} link={link} onNavigate={onNavigate} active={!link.external && !link.action && isActive(link.href)} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-7 py-2 text-xs leading-4 text-white/70">
          <a href="https://bootcamp.com" className="mb-2 block">
            © {new Date().getFullYear()} Bootcamp.com™
          </a>
          <div className="mb-2">
            <a href="https://bootcamp.com/terms">Terms</a> · <a href="https://bootcamp.com/privacy">Privacy</a>
          </div>
        </div>
      </div>

      {plan === "free" && (
        <div className="absolute inset-x-0 bottom-0 bg-shell">
          <div className="m-4 flex flex-col rounded-lg bg-white/5 p-4">
            <p className="mb-4 text-center text-sm leading-[21px] text-white/70">Upgrade your membership to get instant access to all content and features.</p>
            <Link
              href="/nclex/upgrade"
              onClick={onNavigate}
              className="flex h-[42px] items-center justify-center rounded-[64px] bg-brand p-4 text-white shadow-[0_2px_0_0_#4a3ac8] transition-[background,box-shadow,transform] duration-[50ms] hover:bg-[#6765ef] active:translate-y-[2px] active:shadow-none"
            >
              <Icon name="shield" size={16} />
              <span className="ml-2 text-base leading-4 font-semibold">Upgrade</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-shell shadow-[inset_-8px_0_5px_-5px_#12171b] lg:block">
      <SidebarContent />
    </aside>
  );
}
