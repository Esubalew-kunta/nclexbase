"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { SITE_NAME } from "@/lib/brand";
import { useConfig, useSubjects } from "@/lib/content";
import type { NavLinkCfg } from "@/lib/admin/config";
import { inSubject, subjectHref } from "@/lib/routes";
import type { IconName } from "@/components/ui/Icon";

type ItemLink = { label: string; href: string; icon: IconName; external?: boolean; contact?: boolean };

export const normalize = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);

/** NCLEXBase logo (NCLEX only, no product switcher). */
function Brand() {
  return (
    <div className="flex h-[72px] items-center px-4">
      <Link href="/nclex" aria-label={`${SITE_NAME} home`} className="flex items-center">
        <Logo height={36} />
      </Link>
    </div>
  );
}

function Item({ link, active, onNavigate, indent }: { link: ItemLink; active: boolean; onNavigate?: () => void; indent?: boolean }) {
  const setUi = useStore((s) => s.setUi);
  const cls = clsx(
    "group flex h-[42px] cursor-pointer items-center rounded-lg p-3 transition-colors",
    active ? "bg-primary-light text-primary" : "text-ink hover:bg-primary-light hover:text-primary",
  );
  const inner = (
    <>
      {!indent && <Icon name={link.icon} size={20} className={active ? "text-primary" : "text-muted group-hover:text-primary"} />}
      <h4 className={clsx("ml-2.5 min-w-0 flex-1 truncate text-base leading-4", active ? "font-bold text-primary" : "font-normal")}>{link.label}</h4>
      {link.external && <Icon name="externalLink" size={16} className="hidden text-muted group-hover:block" />}
    </>
  );
  if (link.contact)
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
  // useSearchParams needs a Suspense boundary in the static export.
  return (
    <Suspense>
      <SidebarInner onNavigate={onNavigate} />
    </Suspense>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = normalize(usePathname());
  const search = useSearchParams().toString();
  const plan = useStore((s) => s.user.plan);
  const setUi = useStore((s) => s.setUi);
  const subjectsOpen = useStore((s) => s.sidebarSubjectsOpen);
  const subjects = useSubjects();
  // Sections and links come from Admin > Home & Navigation.
  const { navigation, branding } = useConfig();
  const inAnySubject = subjects.some((s) => inSubject(pathname, search, s.id));
  const open = subjectsOpen || inAnySubject;
  const toItem = (l: NavLinkCfg): ItemLink => ({ label: l.label, href: l.href, icon: l.icon, external: l.external, contact: l.kind === "contact" });

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
          className="mx-4 mb-2 inline-flex h-[42px] cursor-pointer items-center rounded-[64px] bg-primary p-4 text-white shadow-press transition-[background,box-shadow,transform] duration-[50ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none"
        >
          <Icon name="plusSquare" size={20} />
          <span className="ml-2 text-base leading-4 font-semibold">Create Test</span>
        </button>

        <nav className="px-4" aria-label="Main">
          {navigation.sections.map((section) => {
            const links = section.links.filter((l) => l.visible);
            if (!section.visible || !links.length) return null;
            return (
              <div key={section.id}>
                {section.title && <div className="px-3 pt-2 text-[10px] leading-[10px] font-semibold text-muted uppercase">{section.title}</div>}
                <div className="py-2">
                  {links.map((link) =>
                    link.kind === "subjects" ? (
                      <div key={link.id} className="mb-1">
                        <div
                          onClick={() => useStore.getState().setSidebarSubjectsOpen(!open)}
                          className="group flex h-[42px] cursor-pointer items-center rounded-lg p-3 text-ink transition-colors hover:bg-primary-light hover:text-primary"
                          aria-expanded={open}
                        >
                          <Icon name={link.icon} size={20} className="text-muted group-hover:text-primary" />
                          <h4 className="ml-2.5 flex-1 text-base leading-4">{link.label}</h4>
                          <svg viewBox="0 0 24 24" className="size-5 text-muted" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={open ? "m19.5 8.25-7.5 7.5-7.5-7.5" : "m8.25 4.5 7.5 7.5-7.5 7.5"} />
                          </svg>
                        </div>
                        {open && (
                          <div className="ml-[22px] border-l border-line pl-2">
                            {subjects.map((s) => (
                              <Item key={s.id} indent link={{ label: s.name, href: subjectHref(s.id), icon: "home" }} active={inSubject(pathname, search, s.id)} onNavigate={onNavigate} />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Item key={link.id} link={toItem(link)} onNavigate={onNavigate} active={link.kind === "link" && !link.external && Boolean(link.href) && isActive(link.href)} />
                    ),
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="px-7 py-2 text-xs leading-4 text-muted">
          <a href="https://nclexbase.com" className="mb-2 block hover:text-primary">
            © {new Date().getFullYear()} {branding.siteName || SITE_NAME}
          </a>
          <div className="mb-2">
            <a href={branding.termsUrl} className="hover:text-primary">Terms</a> · <a href={branding.privacyUrl} className="hover:text-primary">Privacy</a>
          </div>
        </div>
      </div>

      {plan === "free" && (
        <div className="absolute inset-x-0 bottom-0 border-t border-line bg-white">
          <div className="m-4 flex flex-col rounded-lg border border-gold/50 bg-gold/10 p-4">
            <p className="mb-4 text-center text-sm leading-[21px] text-ink">Upgrade your membership to get instant access to all content and features.</p>
            <Link
              href="/nclex/upgrade"
              onClick={onNavigate}
              className="flex h-[42px] items-center justify-center rounded-[64px] bg-gold p-4 text-ink shadow-premium transition-[filter,box-shadow,transform] duration-[50ms] hover:brightness-95 active:translate-y-[2px] active:shadow-none"
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white lg:block">
      <SidebarContent />
    </aside>
  );
}
