"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight, GraduationCap, ShieldCheck, SquarePlus } from "lucide-react";
import { SUBJECTS } from "@/data/catalog";
import { useStore } from "@/lib/store";
import { NAV, type NavLink } from "./nav";

export function Logo() {
  return (
    <Link href="/nclex" className="flex items-center gap-3 text-white">
      <svg viewBox="0 0 36 36" className="size-9 shrink-0" aria-hidden>
        <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="18" cy="18" r="11" fill="currentColor" />
        <path d="M18 11.5l1.9 4.2 4.6.4-3.5 3 1.1 4.5-4.1-2.4-4.1 2.4 1.1-4.5-3.5-3 4.6-.4z" fill="#151a1e" />
      </svg>
      <span className="leading-tight">
        <span className="block text-lg font-bold">Bootcamp.com</span>
        <span className="block text-sm text-white/80">NCLEX Bootcamp</span>
      </span>
    </Link>
  );
}

export const normalize = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);

function Item({ link, active, onNavigate }: { link: NavLink; active: boolean; onNavigate?: () => void }) {
  const Icon = link.icon;
  const cls = clsx(
    "flex h-[42px] items-center gap-3 rounded-lg px-3 text-base transition-colors",
    active ? "bg-shell-2 font-bold text-white" : "text-white/80 hover:bg-shell-2/60 hover:text-white",
  );
  const inner = (
    <>
      <Icon className="size-[18px] shrink-0" strokeWidth={active ? 2.5 : 2} />
      <span className="truncate">{link.label}</span>
    </>
  );
  return link.external ? (
    <a href={link.href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={link.href} className={cls} onClick={onNavigate} aria-current={active ? "page" : undefined}>
      {inner}
    </Link>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = normalize(usePathname());
  const plan = useStore((s) => s.user.plan);
  const setUi = useStore((s) => s.setUi);
  const inSubject = SUBJECTS.some((s) => pathname.startsWith(`/nclex/${s.id}`));
  const [subjectsOpen, setSubjectsOpen] = useState(inSubject);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 [scrollbar-width:thin] [scrollbar-color:#2a3035_transparent]">
        <Logo />
        <button
          onClick={() => {
            onNavigate?.();
            setUi({ createTestOpen: true });
          }}
          className="mt-4 inline-flex h-11 items-center gap-2.5 rounded-full bg-brand pr-4 pl-4 text-base font-semibold text-white shadow-press hover:bg-[#6a5eef] active:translate-y-px active:shadow-none"
        >
          <SquarePlus className="size-5" strokeWidth={2.2} />
          Create Test
        </button>

        <nav className="mt-4" aria-label="Main">
          {NAV.map((section, si) => (
            <div key={si} className={clsx(section.title && "mt-3")}>
              {section.title && (
                <div className="px-3 pt-1 pb-2 text-[10px] font-semibold tracking-wide text-white/60 uppercase">{section.title}</div>
              )}
              {section.subjects && (
                <>
                  <button
                    onClick={() => setSubjectsOpen((o) => !o)}
                    aria-expanded={subjectsOpen}
                    className="flex h-[42px] w-full items-center gap-3 rounded-lg px-3 text-base text-white/80 hover:bg-shell-2/60 hover:text-white"
                  >
                    <GraduationCap className="size-[18px]" />
                    <span className="flex-1 text-left">Subjects</span>
                    {subjectsOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </button>
                  {subjectsOpen && (
                    <div className="mb-1">
                      {SUBJECTS.map((s) => {
                        const href = `/nclex/${s.id}`;
                        const active = pathname.startsWith(href);
                        return (
                          <Link
                            key={s.id}
                            href={href}
                            onClick={onNavigate}
                            className={clsx(
                              "flex h-[42px] items-center truncate rounded-lg pr-3 pl-[42px] text-base",
                              active ? "bg-shell-2 font-bold text-white" : "text-white/80 hover:bg-shell-2/60 hover:text-white",
                            )}
                          >
                            <span className="truncate">{s.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
              {section.links.map((link) => (
                <Item
                  key={link.href}
                  link={link}
                  onNavigate={onNavigate}
                  active={link.href === "/nclex" ? pathname === "/nclex" : pathname.startsWith(link.href)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-4 flex gap-2 px-3">
          <StoreBadge store="App Store" sub="Download on the" />
          <StoreBadge store="Google Play" sub="GET IT ON" />
        </div>
        <p className="mt-5 px-3 text-xs leading-5 text-white/80">
          © {new Date().getFullYear()} Bootcamp.com™
          <br />
          <a className="hover:underline" href="https://bootcamp.com/terms">Terms</a> ·{" "}
          <a className="hover:underline" href="https://bootcamp.com/privacy">Privacy</a>
        </p>
      </div>

      {plan === "free" && (
        <div className="shrink-0 px-4 pb-4">
          <div className="rounded-lg bg-white/5 px-4 pt-4 pb-4 text-center">
            <p className="text-[15px] leading-6 text-white/80">Upgrade your membership to get instant access to all content and features.</p>
            <Link
              href="/nclex/upgrade"
              className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-brand font-semibold text-white shadow-press hover:bg-[#6a5eef]"
            >
              <ShieldCheck className="size-5" />
              Upgrade
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StoreBadge({ store, sub }: { store: string; sub: string }) {
  return (
    <span className="inline-flex h-8 items-center gap-1 rounded-md border border-white/40 bg-black px-2 text-white">
      <span className="leading-none">
        <span className="block text-[6px] uppercase">{sub}</span>
        <span className="block text-[11px] font-semibold">{store}</span>
      </span>
    </span>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-shell shadow-[inset_-8px_0_5px_-5px_#12171b] lg:block">
      <SidebarContent />
    </aside>
  );
}
