"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BookOpen,
  Brain,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  Inbox,
  Gift,
  TicketPercent,
  LayoutDashboard,
  ListTree,
  LogOut,
  Megaphone,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PlayCircle,
  ScrollText,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Target,
  Type,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { STORAGE_FULL_EVENT, useAdminStore } from "@/lib/admin/store";
import { getAll } from "@/lib/content";
import { planReminder } from "@/lib/daily";
import { LogoMark } from "@/components/ui/Logo";
import { ConfirmHost, stripHtml, toast, Toaster } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: () => number;
}

const openMessages = () => getAll("messages").filter((m) => m.status === "open").length;
/** 1 while the next week/month has days without a Question of the Day (see lib/daily.ts). */
const pendingPayments = () => getAll("payments").filter((p) => p.status === "pending").length;
const qotdReminder = () => (planReminder() ? 1 : 0);

export const ADMIN_NAV: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  { title: "Structure", items: [{ href: "/admin/subjects", label: "Subjects & Systems", icon: ListTree }] },
  {
    title: "Content",
    items: [
      { href: "/admin/questions", label: "Question Bank", icon: ClipboardList },
      { href: "/admin/cases", label: "Case Studies", icon: BookOpen },
      { href: "/admin/readiness", label: "Readiness Exams", icon: GraduationCap },
      { href: "/admin/courses", label: "Courses & Lessons", icon: PlayCircle },
      { href: "/admin/cheat-sheets", label: "Cheat Sheets", icon: FileText },
      { href: "/admin/memory-tricks", label: "Memory Tricks", icon: Brain },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
      { href: "/admin/qotd", label: "Question of the Day", icon: CalendarDays, badge: qotdReminder },
      { href: "/admin/study-guide", label: "Study Guide", icon: ScrollText },
    ],
  },
  {
    title: "Experience",
    items: [
      { href: "/admin/home", label: "Home & Navigation", icon: Home },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { href: "/admin/copy", label: "Pages & Copy", icon: Type },
      { href: "/admin/plans", label: "Plans & Access", icon: Sparkles },
      { href: "/admin/rules", label: "Targets & Rules", icon: Target },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/payments", label: "Payments", icon: Wallet, badge: pendingPayments },
      { href: "/admin/promo-codes", label: "Promo Codes", icon: TicketPercent },
      { href: "/admin/referrals", label: "Referrals", icon: Gift },
      { href: "/admin/inbox", label: "Support Inbox", icon: Inbox, badge: openMessages },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/audit", label: "Audit Log", icon: SlidersHorizontal },
    ],
  },
];

const norm = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p);

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = norm(usePathname());
  useAdminStore((s) => s.data.messages); // refresh the inbox badge
  useAdminStore((s) => s.config.qotd); // and the Question of the Day reminder
  useAdminStore((s) => s.data.payments); // and pending payments
  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]" aria-label="Admin">
      {ADMIN_NAV.map((g) => (
        <div key={g.title} className="mt-4">
          <p className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-white/50 uppercase">{g.title}</p>
          {g.items.map((it) => {
            const active = it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
            const n = it.badge?.() ?? 0;
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex h-9 items-center gap-2.5 rounded-md px-2 text-sm transition-colors",
                  active ? "bg-white/12 font-semibold text-white shadow-[inset_3px_0_0_0_var(--color-gold)]" : "text-white/75 hover:bg-white/8 hover:text-white",
                )}
              >
                <it.icon className={clsx("size-4 shrink-0", active ? "text-gold" : "text-white/60")} />
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                {n > 0 && <span className="rounded-full bg-gold px-1.5 text-xs leading-5 font-bold text-ink">{n}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate, headerAction }: { onNavigate?: () => void; headerAction?: ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-primary-hover">
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 pr-2">
        <Link href="/admin" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2.5 px-4">
          <LogoMark size={30} />
          <span className="leading-tight">
            <span className="block text-sm font-bold text-white">NCLEXBase</span>
            <span className="block text-[11px] font-semibold tracking-wider text-gold uppercase">Admin</span>
          </span>
        </Link>
        {headerAction}
      </div>
      <Nav onNavigate={onNavigate} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Jump-to search (Ctrl+K) across admin pages and content              */
/* ------------------------------------------------------------------ */

interface Jump {
  label: string;
  sub: string;
  href: string;
}

function buildJumps(): Jump[] {
  const out: Jump[] = ADMIN_NAV.flatMap((g) => g.items.map((i) => ({ label: i.label, sub: "Admin page", href: i.href })));
  for (const s of getAll("subjects")) out.push({ label: s.name, sub: "Subject", href: `/admin/subjects?open=${s.id}` });
  for (const q of getAll("questions")) out.push({ label: stripHtml(q.stem || q.lead || q.id).slice(0, 90), sub: `Question · ${q.id}`, href: `/admin/questions/edit?id=${q.id}` });
  for (const c of getAll("cases")) out.push({ label: c.title, sub: "Case study", href: `/admin/cases/edit?id=${c.id}` });
  for (const t of getAll("memoryTricks")) out.push({ label: t.title, sub: "Memory trick", href: `/admin/memory-tricks?edit=${t.id}` });
  for (const c of getAll("cheatSheets")) out.push({ label: c.title, sub: "Cheat sheet", href: `/admin/cheat-sheets?edit=${c.id}` });
  for (const f of getAll("faqs")) out.push({ label: f.question, sub: "FAQ", href: `/admin/faqs?edit=${f.id}` });
  for (const u of getAll("users")) out.push({ label: u.name, sub: `User · ${u.email}`, href: `/admin/users?edit=${u.id}` });
  for (const a of getAll("announcements")) out.push({ label: a.message, sub: "Announcement", href: `/admin/announcements?edit=${a.id}` });
  for (const c of getAll("courses")) out.push({ label: c.title, sub: "Course", href: `/admin/courses?course=${c.id}` });
  for (const c of getAll("promoCodes")) out.push({ label: c.code, sub: `Promo code · ${c.kind === "percent" ? `${c.percent}% off` : "free Pro access"}`, href: `/admin/promo-codes?edit=${c.id}` });
  return out;
}

function JumpTo() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const data = useAdminStore((s) => s.data);
  const jumps = useMemo(() => (open ? buildJumps() : []), [open, data]); // eslint-disable-line react-hooks/exhaustive-deps
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = words.length ? jumps.filter((j) => words.every((w) => `${j.label} ${j.sub}`.toLowerCase().includes(w))).slice(0, 12) : jumps.slice(0, 12);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 0);
  }, [open]);

  const go = (j: Jump) => {
    setOpen(false);
    setQ("");
    router.push(j.href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-md cursor-pointer items-center gap-2 rounded-md border border-line bg-background px-3 text-sm text-muted hover:border-faint"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Jump to anything…</span>
        <kbd className="rounded border border-line bg-white px-1.5 text-xs">Ctrl K</kbd>
      </button>
      {open && (
        <div className="animate-fade-in fixed inset-0 z-[65] flex items-start justify-center bg-[rgba(9,68,72,0.35)] p-4 pt-[12vh]" onMouseDown={() => setOpen(false)}>
          <div className="animate-pop-in w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Jump to">
            <div className="flex items-center gap-2 border-b border-line px-3">
              <Search className="size-4 text-muted" />
              <input
                ref={input}
                value={q}
                onChange={(e) => (setQ(e.target.value), setCursor(0))}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setCursor((c) => Math.min(hits.length - 1, c + 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setCursor((c) => Math.max(0, c - 1));
                  }
                  if (e.key === "Enter" && hits[cursor]) go(hits[cursor]);
                }}
                placeholder="Search pages, questions, cases, users, codes…"
                className="h-12 flex-1 text-sm text-ink outline-none placeholder:text-faint"
              />
            </div>
            <ul className="max-h-[50vh] overflow-auto p-1">
              {hits.map((j, i) => (
                <li key={j.href + i}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(j)}
                    className={clsx("flex w-full cursor-pointer flex-col rounded px-3 py-2 text-left", i === cursor && "bg-primary-light")}
                  >
                    <span className="truncate text-sm text-ink">{j.label}</span>
                    <span className="truncate text-xs text-muted">{j.sub}</span>
                  </button>
                </li>
              ))}
              {!hits.length && <li className="px-3 py-6 text-center text-sm text-muted">Nothing found for “{q}”.</li>}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = norm(usePathname());
  const hydrated = useAdminStore((s) => s.hydrated);
  const session = useAdminStore((s) => s.session);
  const [drawer, setDrawer] = useState(false);
  // Desktop sidebar: pinned open, or collapsed and peeking in when the pointer reaches the left edge.
  const collapsed = useAdminStore((s) => s.sidebarCollapsed);
  const [peek, setPeek] = useState(false);
  const shown = !collapsed || peek;
  const setCollapsed = (v: boolean) => {
    useAdminStore.getState().setSidebarCollapsed(v);
    setPeek(false);
  };

  // While peeking, slide back out once the pointer moves well past the sidebar (works even if it never "entered" it).
  useEffect(() => {
    if (!peek) return;
    const onMove = (e: MouseEvent) => e.clientX > 280 && setPeek(false);
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [peek]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        const s = useAdminStore.getState();
        s.setSidebarCollapsed(!s.sidebarCollapsed);
        setPeek(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onFull = () => toast("Browser storage is full, so the last change was not saved. Export a backup (Settings), then delete unused items or uploads.", "error");
    window.addEventListener(STORAGE_FULL_EVENT, onFull);
    return () => window.removeEventListener(STORAGE_FULL_EVENT, onFull);
  }, []);

  useEffect(() => {
    /*
     * Where a signed-out admin is sent: the same form as everybody else.
     *
     * There used to be a second one at /admin/login. It asked for the same credentials, and in
     * the prototype it pre-filled them, so on a public build it handed the admin password to
     * anyone who opened the page. /auth/signin checks the password -- against the server where
     * there is one, against this browser's admin store where there is not -- and sends an
     * administrator here.
     */
    if (hydrated && !session) router.replace(`/auth/signin?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, session, pathname, router]);
  if (!hydrated || !session)
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <span className="size-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-label="Loading" />
      </div>
    );

  return (
    <div className="min-h-dvh bg-background">
      {/* Invisible strip on the left edge: touching it slides the collapsed sidebar in. */}
      {collapsed && !peek && <div aria-hidden className="fixed inset-y-0 left-0 z-40 hidden w-2 lg:block" onMouseEnter={() => setPeek(true)} />}
      <aside
        inert={!shown}
        className={clsx(
          "fixed inset-y-0 left-0 z-40 hidden w-60 transition-transform duration-200 ease-out lg:block",
          shown ? "translate-x-0" : "-translate-x-full",
          collapsed && peek && "shadow-[8px_0_30px_rgba(9,68,72,0.35)]",
        )}
      >
        <SidebarBody
          onNavigate={collapsed ? () => setPeek(false) : undefined}
          headerAction={
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Keep the sidebar open" : "Collapse the sidebar"}
              title={collapsed ? "Keep open (Ctrl+B)" : "Collapse (Ctrl+B)"}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
            >
              {collapsed ? <Pin className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          }
        />
      </aside>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="animate-fade-in absolute inset-0 bg-[rgba(9,68,72,0.35)]" onClick={() => setDrawer(false)} />
          <div className="animate-slide-in-left absolute inset-y-0 left-0 w-64">
            <SidebarBody onNavigate={() => setDrawer(false)} />
          </div>
          <button onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute top-3 left-[268px] flex size-9 items-center justify-center rounded-full bg-white text-ink">
            <X className="size-4" />
          </button>
        </div>
      )}
      <div className={clsx("transition-[padding] duration-200", collapsed ? "lg:pl-0" : "lg:pl-60")}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setDrawer(true)} aria-label="Open menu" className="flex size-9 items-center justify-center rounded-md text-primary hover:bg-primary-light lg:hidden">
            <Menu className="size-5" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Open the sidebar" : "Collapse the sidebar"}
            title={`${collapsed ? "Open" : "Collapse"} sidebar (Ctrl+B)`}
            className="hidden size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-primary hover:bg-primary-light lg:flex"
          >
            {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>
          <JumpTo />
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-right text-xs leading-tight md:block">
              <span className="block font-semibold text-ink">{session.name}</span>
              <span className="block text-muted">{session.email}</span>
            </span>
            <button
              onClick={() => {
                useAdminStore.getState().logout();
                router.replace("/auth/signin?next=%2Fadmin");
              }}
              aria-label="Sign out"
              title="Sign out"
              className="flex size-9 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-primary-light hover:text-primary"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">
          <Suspense>{children}</Suspense>
        </main>
      </div>
      <ConfirmHost />
      <Toaster />
    </div>
  );
}
