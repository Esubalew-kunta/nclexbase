"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, Megaphone } from "lucide-react";
import { NAV } from "@/components/shell/nav";
import { HOME_SECTION_LABELS, type HomeSection } from "@/lib/admin/config";
import { AdminPage, Field, IconBtn, Input, Segmented, Select, Switch } from "@/components/admin/ui";
import { ConfigPanel, useConfigSection } from "@/components/admin/config";

const move = <T,>(arr: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

export default function HomeNavAdmin() {
  const ann = useConfigSection("announcement", "announcement");
  const home = useConfigSection("home", "Home page");
  const nav = useConfigSection("nav", "sidebar navigation");
  const a = ann.draft;
  const h = home.draft;
  const n = nav.draft;
  const navLinks = [{ href: "subjects", label: "Subjects (accordion)", section: "Study" }, ...NAV.flatMap((s) => s.links.map((l) => ({ href: l.href, label: l.label, section: s.title ?? "Top" })))];

  return (
    <AdminPage title="Home & Navigation" description="What students see first: the site-wide announcement, the Home page sections and quick actions, and the sidebar.">
      <div className="space-y-4">
        <ConfigPanel section={ann} invalid={a.start && a.end && a.end < a.start ? "Fix the dates" : a.enabled && !a.message.trim() ? "Write a message" : ""} title="Announcement bar" description="A notice at the top of every student page. Students can dismiss it; changing the message shows it again.">
          <div className="space-y-3">
            <Switch checked={a.enabled} onChange={(v) => ann.setDraft({ ...a, enabled: v })} label="Show the announcement" />
            <Field label="Message">
              <Input value={a.message} onChange={(e) => ann.setDraft({ ...a, message: e.target.value })} maxLength={180} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Link text (optional)">
                <Input value={a.linkLabel} onChange={(e) => ann.setDraft({ ...a, linkLabel: e.target.value })} />
              </Field>
              <Field label="Link (optional)" hint="A student page like /nclex/upgrade, or a full URL.">
                <Input value={a.linkHref} onChange={(e) => ann.setDraft({ ...a, linkHref: e.target.value })} />
              </Field>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <Field label="Who sees it">
                <Select value={a.audience} onChange={(e) => ann.setDraft({ ...a, audience: e.target.value as typeof a.audience })}>
                  <option value="all">Everyone</option>
                  <option value="free">Free members only</option>
                  <option value="premium">Premium members only</option>
                </Select>
              </Field>
              <Field label="Style">
                <Segmented
                  value={a.tone}
                  onChange={(v) => ann.setDraft({ ...a, tone: v })}
                  options={[
                    { value: "info", label: "Info (teal)" },
                    { value: "premium", label: "Premium (gold)" },
                  ]}
                />
              </Field>
              <Field label="Starts">
                <Input type="date" value={a.start} onChange={(e) => ann.setDraft({ ...a, start: e.target.value })} />
              </Field>
              <Field label="Ends" error={a.start && a.end && a.end < a.start ? "Ends before it starts." : ""}>
                <Input type="date" value={a.end} onChange={(e) => ann.setDraft({ ...a, end: e.target.value })} />
              </Field>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted uppercase">Preview</p>
              <div className={clsx("flex items-center gap-3 rounded-lg border px-4 py-3 text-base text-ink", a.tone === "premium" ? "border-gold/60 bg-gold/10" : "border-primary/25 bg-primary-light", !a.enabled && "opacity-50")}>
                <Megaphone className={clsx("size-5 shrink-0", a.tone === "premium" ? "text-gold" : "text-primary")} />
                <p>
                  {a.message || <span className="text-muted">Your message</span>}
                  {a.linkLabel && <span className="ml-2 font-semibold text-primary underline">{a.linkLabel}</span>}
                </p>
              </div>
            </div>
          </div>
        </ConfigPanel>

        <ConfigPanel section={home} title="Home page" description="Turn sections on or off, and choose which quick-action cards appear, in what order and with what words.">
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted uppercase">Sections</p>
              {(Object.keys(HOME_SECTION_LABELS) as HomeSection[]).map((k) => (
                <Switch key={k} checked={h.sections[k]} onChange={(v) => home.setDraft({ ...h, sections: { ...h.sections, [k]: v } })} label={HOME_SECTION_LABELS[k]} />
              ))}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-muted uppercase">Quick actions</p>
              <ul className="divide-y divide-line rounded-md border border-line">
                {h.quickActions.map((q, i) => (
                  <li key={q.key} className="grid items-center gap-2 px-3 py-2 sm:grid-cols-[auto_1fr_1.4fr_auto]">
                    <Switch checked={q.visible} onChange={(v) => home.setDraft({ ...h, quickActions: h.quickActions.map((x, k) => (k === i ? { ...x, visible: v } : x)) })} />
                    <Input value={q.label} aria-label="Card title" className="h-8" onChange={(e) => home.setDraft({ ...h, quickActions: h.quickActions.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
                    <Input value={q.subtitle} aria-label="Card subtitle" className="h-8" onChange={(e) => home.setDraft({ ...h, quickActions: h.quickActions.map((x, k) => (k === i ? { ...x, subtitle: e.target.value } : x)) })} />
                    <div className="flex">
                      <IconBtn label="Move up" disabled={i === 0} onClick={() => home.setDraft({ ...h, quickActions: move(h.quickActions, i, -1) })}>
                        <ArrowUp className="size-4" />
                      </IconBtn>
                      <IconBtn label="Move down" disabled={i === h.quickActions.length - 1} onClick={() => home.setDraft({ ...h, quickActions: move(h.quickActions, i, 1) })}>
                        <ArrowDown className="size-4" />
                      </IconBtn>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-muted">Daily Warmup shows “Upgrade to unlock” to free members regardless of its subtitle.</p>
            </div>
          </div>
        </ConfigPanel>

        <ConfigPanel section={nav} title="Sidebar navigation" description="Hide links or rename them. Hidden pages still work if someone has the link.">
          <ul className="divide-y divide-line rounded-md border border-line">
            {navLinks.map((l) => {
              const v = n[l.href] ?? { visible: true, label: "" };
              return (
                <li key={l.href} className="grid items-center gap-3 px-3 py-2 sm:grid-cols-[auto_120px_1fr_1fr]">
                  <Switch checked={v.visible} onChange={(on) => nav.setDraft({ ...n, [l.href]: { ...v, visible: on } })} />
                  <span className="text-xs text-muted">{l.section}</span>
                  <span className="text-sm text-ink">{l.label}</span>
                  <Input value={v.label} placeholder={`Rename (default: ${l.label})`} className="h-8" onChange={(e) => nav.setDraft({ ...n, [l.href]: { ...v, label: e.target.value } })} disabled={l.href === "subjects"} />
                </li>
              );
            })}
          </ul>
        </ConfigPanel>
      </div>
    </AdminPage>
  );
}
