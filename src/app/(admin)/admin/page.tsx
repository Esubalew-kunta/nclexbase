"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, FileText, Inbox, Megaphone, Plus, Users } from "lucide-react";
import { adminHref } from "@/lib/admin/links";
import { useAdminStore } from "@/lib/admin/store";
import { COLLECTION_LABELS, type CollectionName } from "@/lib/admin/types";
import { useAll, useSubjects } from "@/lib/content";
import { AdminPage, Badge, fmtDateTime, Panel, stripHtml } from "@/components/admin/ui";
import { validateItem } from "@/components/admin/items";

function Kpi({ label, value, sub, href, icon: Icon }: { label: string; value: number | string; sub?: string; href: string; icon: typeof Users }) {
  return (
    <Link href={href} className="group rounded-lg border border-line bg-white p-4 transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-1 text-2xl font-bold text-ink tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </Link>
  );
}

export default function Dashboard() {
  const questions = useAll("questions");
  const cases = useAll("cases");
  const tricks = useAll("memoryTricks");
  const sheets = useAll("cheatSheets");
  const lessons = useAll("lessons");
  const faqs = useAll("faqs");
  const users = useAll("users");
  const messages = useAll("messages");
  const subjects = useSubjects(true);
  const audit = useAdminStore((s) => s.audit);
  const liveAnnouncements = useAll("announcements").filter((a) => a.status === "published").length;

  const pub = <T extends { status: string }>(l: T[]) => l.filter((x) => x.status === "published").length;
  const invalid = useMemo(() => questions.filter((q) => q.status !== "archived" && validateItem(q).length).length, [questions]);
  const emptySystems = useMemo(() => subjects.reduce((n, s) => n + s.systems.filter((x) => x.visible && !tricks.some((t) => t.subject === s.id && t.system === x.key && t.status !== "archived")).length, 0), [subjects, tricks]);
  const totalSystems = subjects.reduce((n, s) => n + s.systems.filter((x) => x.visible).length, 0);

  const drafts = useMemo(() => {
    const out: { col: CollectionName; id: string; title: string; at: string }[] = [];
    const add = (col: CollectionName, rows: { id: string; status?: string; updatedAt: string }[], title: (r: never) => string) =>
      rows.filter((r) => r.status === "draft").forEach((r) => out.push({ col, id: r.id, title: title(r as never), at: r.updatedAt }));
    add("questions", questions, (r: { stem: string }) => stripHtml(r.stem) || "Untitled question");
    add("cases", cases, (r: { title: string }) => r.title);
    add("memoryTricks", tricks, (r: { title: string }) => r.title || "Untitled memory trick");
    add("cheatSheets", sheets, (r: { title: string }) => r.title);
    add("lessons", lessons, (r: { title: string }) => r.title);
    add("faqs", faqs, (r: { question: string }) => r.question);
    return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  }, [questions, cases, tricks, sheets, lessons, faqs]);

  const health = [
    { label: "Questions with problems", n: invalid, href: "/admin/questions?health=invalid" },
    { label: "Systems without memory tricks", n: emptySystems, href: "/admin/memory-tricks", note: `of ${totalSystems}` },
    { label: "Cheat sheets without a PDF", n: sheets.filter((s) => !s.file && s.status === "published").length, href: "/admin/cheat-sheets?file=missing&status=published" },
    { label: "Case studies using the sample case", n: cases.filter((c) => !c.content && c.status === "published").length, href: "/admin/cases?content=sample&status=published" },
    { label: "Videos without a video URL", n: lessons.filter((l) => l.type === "video" && !l.videoUrl && l.status === "published").length, href: "/admin/courses" },
    { label: "FAQs not shown on any page", n: faqs.filter((f) => !f.placements.length && f.status === "published").length, href: "/admin/faqs" },
  ];
  const open = messages.filter((m) => m.status === "open").length;

  return (
    <AdminPage title="Dashboard" description="What's live, what needs attention, and what changed recently.">
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Published questions" value={pub(questions)} sub={`${questions.length} total · ${questions.filter((q) => q.status === "draft").length} drafts`} href="/admin/questions" icon={ClipboardList} />
        <Kpi label="Memory tricks live" value={pub(tricks)} sub={`${totalSystems - emptySystems} of ${totalSystems} systems covered`} href="/admin/memory-tricks" icon={FileText} />
        <Kpi label="Students" value={users.length + 1} sub={`${users.filter((u) => u.plan === "premium").length} premium (sample data)`} href="/admin/users" icon={Users} />
        <Kpi label="Open messages" value={open} sub={open ? "Waiting for a reply" : "Inbox is clear"} href="/admin/inbox?status=open" icon={Inbox} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Content health" description="Each line opens the matching filtered list.">
          <ul className="divide-y divide-line">
            {health.map((h) => (
              <li key={h.label}>
                <Link href={h.href} className="flex items-center gap-3 py-2.5 text-sm hover:text-primary">
                  {h.n ? <AlertTriangle className="size-4 shrink-0 text-warning" /> : <CheckCircle2 className="size-4 shrink-0 text-success" />}
                  <span className="flex-1">{h.label}</span>
                  <span className="font-semibold tabular-nums">
                    {h.n}
                    {h.note && <span className="ml-1 text-xs font-normal text-muted">{h.note}</span>}
                  </span>
                  <ArrowRight className="size-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Drafts waiting to be published" description="Hidden from students until published.">
          {drafts.length ? (
            <ul className="divide-y divide-line">
              {drafts.map((d) => (
                <li key={d.col + d.id}>
                  <Link href={adminHref(d.col, d.id) ?? "#"} className="flex items-center gap-3 py-2 text-sm hover:text-primary">
                    <Badge>{COLLECTION_LABELS[d.col]}</Badge>
                    <span className="min-w-0 flex-1 truncate">{d.title}</span>
                    <ArrowRight className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No drafts. Everything in progress is published.</p>
          )}
        </Panel>

        <Panel
          title="Recent changes"
          actions={
            <Link href="/admin/audit" className="text-sm font-semibold text-primary hover:underline">
              Full audit log
            </Link>
          }
        >
          {audit.length ? (
            <ul className="space-y-2">
              {audit.slice(0, 8).map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="w-36 shrink-0 text-xs text-muted">{fmtDateTime(a.at)}</span>
                  <span className="min-w-0 flex-1 truncate">{a.label}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nothing changed yet.</p>
          )}
        </Panel>

        <Panel title="Quick actions">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { href: "/admin/questions?new=1", label: "New question", icon: Plus },
              { href: "/admin/memory-tricks?edit=new", label: "Upload a memory trick", icon: Plus },
              { href: "/admin/cheat-sheets?edit=new", label: "Add a cheat sheet", icon: Plus },
              { href: "/admin/announcements", label: liveAnnouncements ? `Announcements (${liveAnnouncements} live)` : "Post an announcement", icon: Megaphone },
            ].map((a) => (
              <Link key={a.label} href={a.href} className="flex items-center gap-2 rounded-md border border-line px-3 py-2.5 text-sm font-medium text-ink hover:border-primary hover:bg-primary-light hover:text-primary">
                <a.icon className="size-4 text-primary" />
                {a.label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </AdminPage>
  );
}
