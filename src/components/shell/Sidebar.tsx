"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SUBJECTS } from "@/data/catalog";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";
import { NAV, PRODUCTS, type NavLink } from "./nav";

export const normalize = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);

/* eslint-disable @next/next/no-img-element */

/** Logo + "NCLEX Bootcamp ⌄" product switcher. */
function Brand({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>("⚕️ Nursing");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative flex h-[72px] p-4">
      <div className="group flex cursor-pointer items-center" onClick={() => setOpen((o) => !o)}>
        <img src="/assets/brand/logo-mark.png" alt="" className="mr-2 size-9" />
        <div className="w-[127px]">
          <img src="/assets/brand/logo-word.png" alt="Bootcamp.com" className="h-5 w-[120px]" />
          <div className="mt-px flex items-center text-sm leading-[14px] whitespace-nowrap text-faint">
            NCLEX Bootcamp
            <svg
              viewBox="0 0 24 24"
              className={clsx("ml-1 size-3.5 transition-opacity", open ? "rotate-180 opacity-100" : "opacity-0 group-hover:opacity-100")}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </div>

      {open && (
        <div className="animate-fade-in absolute top-[72px] right-[15px] left-[15px] z-10 overflow-hidden rounded-lg bg-white shadow-[0_16px_30px_rgba(0,0,0,0.24)]">
          {PRODUCTS.map((p, i) => {
            const expanded = section === p.label;
            return (
              <div key={p.label} className={clsx("flex flex-col", i < PRODUCTS.length - 1 && "border-b border-[#ededf0]")}>
                <h3
                  onClick={() => setSection(expanded ? null : p.label)}
                  className="flex cursor-pointer items-center justify-between p-4 text-base leading-5 font-semibold text-ink-strong hover:bg-[#f6f6f6]"
                >
                  <span>{p.label}</span>
                  <svg viewBox="0 0 24 24" className={clsx("size-6 text-faint transition-transform", !expanded && "-rotate-90")} fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </h3>
                {expanded && (
                  <div className="bg-[#fafafa]">
                    {p.items.map((item) => (
                      <a
                        key={item.name}
                        href={item.current ? undefined : item.href}
                        onClick={() => item.current && (setOpen(false), onNavigate?.())}
                        className={clsx("block cursor-pointer border-t border-[#ededf0] p-4 hover:bg-[#f6f6f6]", item.current && "opacity-[0.48]")}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-base leading-[19px] font-bold text-ink-strong">{item.name}</h4>
                            <p className={clsx("text-sm leading-[21px] font-bold", item.current ? "text-brand" : "text-muted")}>
                              {item.current ? "Currently Studying" : "Membership Required"}
                            </p>
                          </div>
                          <Icon name="shield" size={16} className="text-muted" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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
        <Brand onNavigate={onNavigate} />
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
                {si === NAV.length - 1 && (
                  <div className="flex h-[42px] items-center gap-0 rounded-lg p-3">
                    <img src="/assets/brand/app-store.png" alt="Download on the App Store" className="h-8 w-[95px] cursor-pointer" />
                    <img src="/assets/brand/google-play.png" alt="Get it on Google Play" className="ml-1 h-8 w-[95px] cursor-pointer" />
                  </div>
                )}
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
