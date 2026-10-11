"use client";

import clsx from "clsx";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { HOME_SECTION_LABELS, PICKABLE_ICONS, type NavLinkCfg, type NavSectionCfg, type QuickAction } from "@/lib/admin/config";
import { newId } from "@/lib/admin/store";
import { Icon, type IconName } from "@/components/ui/Icon";
import { AdminPage, Badge, Btn, confirmDialog, IconBtn, Input, Select, Switch } from "@/components/admin/ui";
import { ConfigPanel, useConfigSection } from "@/components/admin/config";

const move = <T,>(arr: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

function IconPicker({ value, onChange }: { value: IconName; onChange: (v: IconName) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-label="Choose icon" title="Choose icon" className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-line text-primary hover:border-primary">
        <Icon name={value} size={18} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 grid w-56 grid-cols-6 gap-1 rounded-lg border border-line bg-white p-2 shadow-lg">
          {PICKABLE_ICONS.map((n) => (
            <button
              key={n}
              type="button"
              title={n}
              onClick={() => (onChange(n), setOpen(false))}
              className={clsx("flex size-8 cursor-pointer items-center justify-center rounded-md", n === value ? "bg-primary text-white" : "text-primary hover:bg-primary-light")}
            >
              <Icon name={n} size={18} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomeNavAdmin() {
  const home = useConfigSection("homeLayout", "Home page");
  const nav = useConfigSection("navigation", "sidebar navigation");
  const h = home.draft;
  const n = nav.draft;

  const setQa = (i: number, patch: Partial<QuickAction>) => home.setDraft({ ...h, quickActions: h.quickActions.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
  const setSection = (si: number, patch: Partial<NavSectionCfg>) => nav.setDraft({ sections: n.sections.map((s, k) => (k === si ? { ...s, ...patch } : s)) });
  const setLink = (si: number, li: number, patch: Partial<NavLinkCfg>) => setSection(si, { links: n.sections[si].links.map((l, k) => (k === li ? { ...l, ...patch } : l)) });
  const moveLinkTo = (si: number, li: number, target: number) => {
    const link = n.sections[si].links[li];
    nav.setDraft({ sections: n.sections.map((s, k) => (k === si ? { ...s, links: s.links.filter((_, x) => x !== li) } : k === target ? { ...s, links: [...s.links, link] } : s)) });
  };
  const qaError = h.quickActions.some((q) => !q.label.trim() || (!q.builtin && !q.href.trim())) ? "Every card needs a title, and custom cards need a link." : "";
  const navError = n.sections.some((s) => s.links.some((l) => !l.label.trim() || (l.kind === "link" && !l.href.trim()))) ? "Every link needs a label and an address." : "";

  return (
    <AdminPage title="Home & Navigation" description="The Home page (section order, quick-action cards) and the sidebar (sections and links). Announcements have their own tab.">
      <div className="space-y-4">
        <ConfigPanel section={home} invalid={qaError} title="Home page" description="Order and show/hide the sections, and add, edit, reorder or delete the quick-action cards.">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div>
              <p className="mb-2 text-xs font-semibold text-muted uppercase">Sections (in order)</p>
              <ul className="divide-y divide-line rounded-md border border-line">
                {h.sections.map((s, i) => (
                  <li key={s.key} className="flex items-center gap-2 px-2 py-1.5">
                    <Switch checked={s.visible} onChange={(v) => home.setDraft({ ...h, sections: h.sections.map((x, k) => (k === i ? { ...x, visible: v } : x)) })} />
                    <span className="flex-1 text-sm text-ink">{HOME_SECTION_LABELS[s.key]}</span>
                    <IconBtn label="Move up" disabled={i === 0} onClick={() => home.setDraft({ ...h, sections: move(h.sections, i, -1) })}>
                      <ArrowUp className="size-4" />
                    </IconBtn>
                    <IconBtn label="Move down" disabled={i === h.sections.length - 1} onClick={() => home.setDraft({ ...h, sections: move(h.sections, i, 1) })}>
                      <ArrowDown className="size-4" />
                    </IconBtn>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-muted">Section headings are edited in Pages & Copy.</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-muted uppercase">Quick-action cards</p>
              <ul className="space-y-2">
                {h.quickActions.map((q, i) => (
                  <li key={q.id} className="rounded-md border border-line p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Switch checked={q.visible} onChange={(v) => setQa(i, { visible: v })} />
                      <IconPicker value={q.icon} onChange={(icon) => setQa(i, { icon })} />
                      <Input value={q.label} aria-label="Card title" placeholder="Title" className="h-8 w-44" onChange={(e) => setQa(i, { label: e.target.value })} />
                      <Input value={q.subtitle} aria-label="Card subtitle" placeholder="Subtitle" className="h-8 min-w-[180px] flex-1" onChange={(e) => setQa(i, { subtitle: e.target.value })} />
                      <IconBtn label="Move up" disabled={i === 0} onClick={() => home.setDraft({ ...h, quickActions: move(h.quickActions, i, -1) })}>
                        <ArrowUp className="size-4" />
                      </IconBtn>
                      <IconBtn label="Move down" disabled={i === h.quickActions.length - 1} onClick={() => home.setDraft({ ...h, quickActions: move(h.quickActions, i, 1) })}>
                        <ArrowDown className="size-4" />
                      </IconBtn>
                      <IconBtn
                        label="Delete card"
                        className="hover:text-error"
                        onClick={async () => {
                          if (q.builtin && !(await confirmDialog({ title: `Delete the built-in “${q.label}” card?`, body: "You can bring it back with “Reset to default”. Hiding it keeps it available.", confirm: "Delete", danger: true }))) return;
                          home.setDraft({ ...h, quickActions: h.quickActions.filter((_, k) => k !== i) });
                        }}
                      >
                        <Trash2 className="size-4" />
                      </IconBtn>
                    </div>
                    <div className="mt-2 flex items-center gap-2 pl-[46px]">
                      {q.builtin === "createTest" ? (
                        <Badge tone="teal">Opens Create Test</Badge>
                      ) : (
                        <>
                          {q.builtin && <Badge tone="teal">Built-in</Badge>}
                          <Input value={q.href} aria-label="Card link" placeholder="/nclex/… or https://…" className="h-8 max-w-sm" onChange={(e) => setQa(i, { href: e.target.value })} />
                          {q.builtin === "dailyWarmup" && <span className="text-xs text-muted">Free members always see “Upgrade to unlock”.</span>}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <Btn
                variant="ghost"
                className="mt-2"
                onClick={() => home.setDraft({ ...h, quickActions: [...h.quickActions, { id: newId("qa"), label: "", subtitle: "", href: "", icon: "home", visible: true }] })}
              >
                <Plus className="size-4" />
                Add card
              </Btn>
            </div>
          </div>
        </ConfigPanel>

        <ConfigPanel section={nav} invalid={navError} title="Sidebar navigation" description="Sections and links of the student sidebar. Add, rename, re-link, reorder, move, hide or delete.">
          <div className="space-y-3">
            {n.sections.map((s, si) => (
              <div key={s.id} className={clsx("rounded-md border border-line", !s.visible && "opacity-60")}>
                <div className="flex flex-wrap items-center gap-2 border-b border-line bg-background px-3 py-2">
                  <Switch checked={s.visible} onChange={(v) => setSection(si, { visible: v })} />
                  <Input value={s.title} placeholder="Section heading (empty = no heading)" aria-label="Section heading" className="h-8 max-w-xs" onChange={(e) => setSection(si, { title: e.target.value })} />
                  <span className="flex-1" />
                  <IconBtn label="Move section up" disabled={si === 0} onClick={() => nav.setDraft({ sections: move(n.sections, si, -1) })}>
                    <ArrowUp className="size-4" />
                  </IconBtn>
                  <IconBtn label="Move section down" disabled={si === n.sections.length - 1} onClick={() => nav.setDraft({ sections: move(n.sections, si, 1) })}>
                    <ArrowDown className="size-4" />
                  </IconBtn>
                  <IconBtn
                    label="Delete section"
                    className="hover:text-error"
                    onClick={async () => {
                      if (s.links.length && !(await confirmDialog({ title: `Delete “${s.title || "untitled"}” and its ${s.links.length} links?`, confirm: "Delete", danger: true }))) return;
                      nav.setDraft({ sections: n.sections.filter((_, k) => k !== si) });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </IconBtn>
                </div>
                <ul className="divide-y divide-line">
                  {s.links.map((l, li) => (
                    <li key={l.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                      <Switch checked={l.visible} onChange={(v) => setLink(si, li, { visible: v })} />
                      <IconPicker value={l.icon} onChange={(icon) => setLink(si, li, { icon })} />
                      <Input value={l.label} aria-label="Link label" placeholder="Label" className="h-8 w-48" onChange={(e) => setLink(si, li, { label: e.target.value })} />
                      {l.kind === "link" ? (
                        <>
                          <Input value={l.href} aria-label="Link address" placeholder="/nclex/… or https://…" className="h-8 min-w-[200px] flex-1" onChange={(e) => setLink(si, li, { href: e.target.value })} />
                          <label className="flex items-center gap-1 text-xs text-muted">
                            <input type="checkbox" checked={l.external} onChange={(e) => setLink(si, li, { external: e.target.checked })} className="accent-primary" />
                            New tab
                          </label>
                        </>
                      ) : (
                        <Badge tone="teal">{l.kind === "subjects" ? "Subjects list" : "Opens Contact"}</Badge>
                      )}
                      <span className="flex-1" />
                      {n.sections.length > 1 && (
                        <Select value={si} onChange={(e) => moveLinkTo(si, li, Number(e.target.value))} aria-label="Move to section" className="h-8 w-36 text-xs">
                          {n.sections.map((x, k) => (
                            <option key={x.id} value={k}>
                              {k === si ? "Move to…" : x.title || "(no heading)"}
                            </option>
                          ))}
                        </Select>
                      )}
                      <IconBtn label="Move up" disabled={li === 0} onClick={() => setSection(si, { links: move(s.links, li, -1) })}>
                        <ArrowUp className="size-4" />
                      </IconBtn>
                      <IconBtn label="Move down" disabled={li === s.links.length - 1} onClick={() => setSection(si, { links: move(s.links, li, 1) })}>
                        <ArrowDown className="size-4" />
                      </IconBtn>
                      <IconBtn label="Delete link" className="hover:text-error" onClick={() => setSection(si, { links: s.links.filter((_, k) => k !== li) })}>
                        <Trash2 className="size-4" />
                      </IconBtn>
                    </li>
                  ))}
                </ul>
                <div className="px-3 py-2">
                  <Btn variant="ghost" className="h-8" onClick={() => setSection(si, { links: [...s.links, { id: newId("nav"), label: "", href: "", icon: "home", kind: "link", external: false, visible: true }] })}>
                    <Plus className="size-3.5" />
                    Add link
                  </Btn>
                  {!s.links.some((l) => l.kind === "subjects") && !n.sections.some((x) => x.links.some((l) => l.kind === "subjects")) && (
                    <Btn variant="ghost" className="h-8" onClick={() => setSection(si, { links: [...s.links, { id: "subjects", label: "Subjects", href: "", icon: "subjects", kind: "subjects", external: false, visible: true }] })}>
                      <Plus className="size-3.5" />
                      Add the Subjects list
                    </Btn>
                  )}
                </div>
              </div>
            ))}
            <Btn onClick={() => nav.setDraft({ sections: [...n.sections, { id: newId("sec"), title: "New section", visible: true, links: [] }] })}>
              <Plus className="size-4" />
              Add section
            </Btn>
          </div>
          <p className="mt-2 text-xs text-muted">Hidden or deleted links only leave the sidebar; their pages still open from other links.</p>
        </ConfigPanel>
      </div>
    </AdminPage>
  );
}
