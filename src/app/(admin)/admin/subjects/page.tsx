"use client";

import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, Check, ExternalLink, Eye, EyeOff, GitMerge, Pencil, Plus, Trash2, X } from "lucide-react";
import { crud, slugify, today } from "@/lib/admin/crud";
import type { CollectionName, SubjectRec, SystemRec } from "@/lib/admin/types";
import { getAll, useAll, useSubjects } from "@/lib/content";
import { formatAvg, useStats, type Stats } from "@/lib/stats";
import { formatDuration } from "@/lib/scoring";
import { ALL_TABS, TAB_LABELS, type SubjectTab } from "@/lib/subjectTabs";
import { subjectHref } from "@/lib/routes";
import { AdminPage, Badge, Btn, confirmDialog, Dialog, Field, IconBtn, Input, Panel, Select, Switch, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { HistoryButton, ImageDrop } from "@/components/admin/parts";
import { SubjectIcon } from "@/components/ui/visuals";

const api = crud("subjects");

/** Where each subject page tab's content is managed, filtered to this subject. */
const tabAdminHref = (tab: SubjectTab, id: string) => {
  const q = encodeURIComponent(id);
  return {
    "case-studies": `/admin/cases?subject=${q}`,
    standalone: `/admin/questions?subject=${q}&source=standalone`,
    videos: `/admin/courses?course=${q}`,
    "cheat-sheets": `/admin/cheat-sheets?subject=${q}`,
    "memory-tricks": `/admin/memory-tricks?subject=${q}`,
    performance: `/admin/subjects?open=${q}#numbers`,
  }[tab];
};

const move = <T,>(arr: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

/** Everything that points at a subject, so deletes can be blocked or turned into a merge. */
function useSubjectUsage(id: string) {
  const questions = useAll("questions");
  const cases = useAll("cases");
  const tricks = useAll("memoryTricks");
  const sheets = useAll("cheatSheets");
  const lessons = useAll("lessons");
  return useMemo(() => {
    return {
      questions: questions.filter((q) => q.subject === id).length,
      cases: cases.filter((c) => c.subject === id).length,
      tricks: tricks.filter((t) => t.subject === id).length,
      sheets: sheets.filter((c) => c.subject === id).length,
      lessons: lessons.filter((l) => l.course === id).length,
    };
  }, [questions, cases, tricks, sheets, lessons, id]);
}

export default function SubjectsAdmin() {
  const router = useRouter();
  const params = useSearchParams();
  const subjects = useSubjects(true);
  const [creating, setCreating] = useState(false);
  const openId = params.get("open") ?? subjects[0]?.id;
  const current = subjects.find((s) => s.id === openId) ?? subjects[0];

  const reorder = (i: number, d: number) =>
    api.reorder(
      move(
        subjects.map((s) => s.id),
        i,
        d,
      ),
    );

  return (
    <AdminPage
      title="Subjects & Systems"
      description="The structure every other screen filters by: subjects, their page tabs, their systems (sub-subjects), icons, and the numbers students see. Create, rename, reorder, hide, merge or delete."
      actions={
        <Btn variant="primary" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          New subject
        </Btn>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Panel title="Subjects" description="Order here is the order in the sidebar, Home and every filter." bodyClassName="p-2">
          <ul>
            {subjects.map((s, i) => (
              <li key={s.id}>
                <div
                  className={clsx(
                    "group flex items-center gap-2 rounded-md px-2 py-1.5",
                    current?.id === s.id ? "bg-primary-light shadow-[inset_3px_0_0_0_var(--color-primary)]" : "hover:bg-background",
                  )}
                >
                  <SubjectIcon id={s.id} size={22} />
                  <button type="button" onClick={() => router.replace(`/admin/subjects?open=${s.id}`)} className="min-w-0 flex-1 cursor-pointer text-left">
                    <span className={clsx("block truncate text-sm font-medium", s.visible ? "text-ink" : "text-muted line-through")}>{s.name}</span>
                    <span className="text-xs text-muted">
                      {s.systems.length} systems · {s.tabs.length} tabs{s.visible ? "" : " · hidden"}
                    </span>
                  </button>
                  <IconBtn label={`Move ${s.name} up`} disabled={i === 0} onClick={() => reorder(i, -1)}>
                    <ArrowUp className="size-4" />
                  </IconBtn>
                  <IconBtn label={`Move ${s.name} down`} disabled={i === subjects.length - 1} onClick={() => reorder(i, 1)}>
                    <ArrowDown className="size-4" />
                  </IconBtn>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        {current && <SubjectEditor key={current.id + current.updatedAt} rec={current} />}
      </div>
      {creating && <NewSubjectDialog onClose={() => setCreating(false)} />}
    </AdminPage>
  );
}

function NewSubjectDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const subjects = useSubjects(true);
  const [name, setName] = useState("");
  const id = slugify(name);
  const clash = subjects.some((s) => s.id === id);
  const create = () => {
    if (!name.trim() || !id) return toast("Give the subject a name.", "error");
    if (clash) return toast("A subject with that name already exists.", "error");
    const rec: SubjectRec = {
      id,
      name: name.trim(),
      order: subjects.length,
      visible: false,
      tabs: ["standalone", "videos", "cheat-sheets", "memory-tricks", "performance"],
      systems: [],
      icon: null,
      updatedAt: today(),
    };
    api.create(rec);
    // Every subject has its own crash course.
    crud("courses").create({ id, kind: "subject", title: rec.name, runtime: "", status: "published", order: subjects.length, updatedAt: today() });
    toast(`Created ${rec.name}. It stays hidden until you switch “Visible to students” on.`);
    onClose();
    router.replace(`/admin/subjects?open=${id}`);
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title="New subject"
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={create} disabled={!id || clash}>
            Create subject
          </Btn>
        </>
      }
    >
      <Field label="Name" hint={id ? `Link id: ${id}${clash ? " (already used)" : ""}` : "e.g. Gerontology"} error={clash ? "That name is taken." : ""}>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <p className="mt-3 text-sm text-muted">The subject starts hidden with no systems, so you can set it up before students see it. A crash course for it is created too.</p>
    </Dialog>
  );
}

function SubjectEditor({ rec }: { rec: SubjectRec }) {
  const router = useRouter();
  const [f, setF] = useState<SubjectRec>(rec);
  const [newSystem, setNewSystem] = useState("");
  /** System being renamed in place, and its draft name. */
  const [renaming, setRenaming] = useState<{ key: string; label: string } | null>(null);
  const [merge, setMerge] = useState<SystemRec | null>(null);
  const [mergeSubject, setMergeSubject] = useState(false);
  const questions = useAll("questions");
  const tricks = useAll("memoryTricks");
  const usageAll = useSubjectUsage(rec.id);
  const stats = useStats();
  const totals = stats.subject(rec.id);
  const dirty = !sameRecord(f, rec);
  useUnsavedGuard(dirty);

  const usage = useMemo(() => {
    const m = new Map<string, { questions: number; tricks: number }>();
    for (const s of rec.systems) m.set(s.key, { questions: 0, tricks: 0 });
    for (const q of questions) if (q.subject === rec.id && m.has(q.system)) m.get(q.system)!.questions++;
    for (const t of tricks) if (t.subject === rec.id && t.system && m.has(t.system)) m.get(t.system)!.tricks++;
    return m;
  }, [questions, tricks, rec]);

  const setSystems = (systems: SystemRec[]) => setF((x) => ({ ...x, systems }));
  const setSys = (key: string, patch: Partial<SystemRec>) => setSystems(f.systems.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const hiddenTabs = ALL_TABS.filter((t) => !f.tabs.includes(t));
  const inUse = usageAll.questions + usageAll.cases + usageAll.tricks + usageAll.sheets + usageAll.lessons;

  const addSystem = () => {
    const label = newSystem.trim();
    if (!label) return;
    if (f.systems.some((s) => s.label.toLowerCase() === label.toLowerCase() || s.key.toLowerCase() === label.toLowerCase())) return toast("A system with that name already exists.", "error");
    setSystems([...f.systems, { key: label, label, visible: true }]);
    setNewSystem("");
  };

  const commitRename = () => {
    if (!renaming) return;
    const label = renaming.label.trim();
    if (!label) return toast("Every system needs a name.", "error");
    if (f.systems.some((s) => s.key !== renaming.key && s.label.toLowerCase() === label.toLowerCase())) return toast("A system with that name already exists.", "error");
    setSys(renaming.key, { label });
    setRenaming(null);
  };

  const removeSystem = async (s: SystemRec) => {
    const u = usage.get(s.key);
    if (u && (u.questions || u.tricks)) return setMerge(s);
    if (!(await confirmDialog({ title: `Delete “${s.label}”?`, body: "Nothing uses this system, so it can be removed safely.", confirm: "Delete system", danger: true }))) return;
    setSystems(f.systems.filter((x) => x.key !== s.key));
  };

  const save = () => {
    if (!f.name.trim()) return toast("The subject needs a name.", "error");
    if (!f.tabs.length) return toast("Keep at least one tab visible.", "error");
    if (f.systems.some((s) => !s.label.trim())) return toast("Every system needs a name.", "error");
    api.update({ ...f, name: f.name.trim() });
    toast(`Saved ${f.name}`);
  };

  const deleteSubject = async () => {
    if (!(await confirmDialog({ title: `Delete ${rec.name}?`, body: "Nothing uses this subject, so it is removed along with its (empty) crash course.", confirm: "Delete subject", danger: true }))) return;
    api.hardDelete([rec.id]);
    if (getAll("courses").some((c) => c.id === rec.id)) crud("courses").hardDelete([rec.id]);
    router.replace("/admin/subjects");
  };

  return (
    <div className="space-y-4">
      <Panel
        title={rec.name}
        description={`Id: ${rec.id} (used in links, can't change)`}
        actions={
          <div className="flex gap-2">
            <HistoryButton<SubjectRec> historyKey={`subjects:${rec.id}`} onRestore={(v) => api.restore(rec.id, v)} describe={(v) => `${v.name} · ${v.systems.length} systems`} />
            <Btn onClick={() => setF(rec)} disabled={!dirty}>
              Discard
            </Btn>
            <Btn variant="primary" onClick={save} disabled={!dirty}>
              Save changes
            </Btn>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <Field label="Display name" required>
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </Field>
            <Switch checked={f.visible} onChange={(v) => setF({ ...f, visible: v })} label="Visible to students" description="Hidden subjects disappear from the sidebar, Home and filters." />
          </div>
          <Field label="Icon" hint="Seeded subjects use their built-in icon when none is uploaded.">
            <ImageDrop value={f.icon} onChange={(icon) => setF({ ...f, icon })} />
          </Field>
        </div>
      </Panel>

      <Panel title="Subject page tabs" description="Tabs students see on this subject's page, in order. The first tab is where the subject link opens. Click a tab to manage its content for this subject.">
        <ul className="divide-y divide-line rounded-md border border-line">
          {f.tabs.map((t, i) => (
            <li key={t} className="flex items-center gap-2 px-3 py-2">
              <span className="w-6 text-xs text-muted tabular-nums">{i + 1}</span>
              <Link href={tabAdminHref(t, rec.id)} className="flex-1 text-sm font-medium text-primary hover:underline" title={`Manage ${TAB_LABELS[t]} for ${rec.name}`}>
                {TAB_LABELS[t]}
              </Link>
              <Link href={subjectHref(rec.id, t)} target="_blank" aria-label={`Open ${TAB_LABELS[t]} as a student`} title="Open as a student" className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-primary-light hover:text-primary">
                <ExternalLink className="size-4" />
              </Link>
              <IconBtn label="Move up" disabled={i === 0} onClick={() => setF({ ...f, tabs: move(f.tabs, i, -1) })}>
                <ArrowUp className="size-4" />
              </IconBtn>
              <IconBtn label="Move down" disabled={i === f.tabs.length - 1} onClick={() => setF({ ...f, tabs: move(f.tabs, i, 1) })}>
                <ArrowDown className="size-4" />
              </IconBtn>
              <IconBtn label={`Hide ${TAB_LABELS[t]}`} onClick={() => setF({ ...f, tabs: f.tabs.filter((x) => x !== t) })}>
                <EyeOff className="size-4" />
              </IconBtn>
            </li>
          ))}
        </ul>
        {hiddenTabs.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Hidden:</span>
            {hiddenTabs.map((t: SubjectTab) => (
              <Btn key={t} variant="ghost" className="h-7" onClick={() => setF({ ...f, tabs: [...f.tabs, t] })}>
                <Eye className="size-3.5" />
                Show {TAB_LABELS[t]}
              </Btn>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Systems (sub-subjects)" description="Used by the Standalone tab, Create Test, Memory Tricks, Performance and every system filter. Renaming keeps all linked content attached. Numbers are counted from published questions and recorded answers, so they can't be edited.">
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-background text-left text-xs whitespace-nowrap text-muted uppercase">
              <tr>
                <th className="w-10 px-3 py-2">#</th>
                <th className="px-3 py-2">Name</th>
                <th className="w-24 px-3 py-2" title="Published standalone questions in this system">Questions</th>
                <th className="w-24 px-3 py-2" title="Published standalone, case study and readiness questions in this system">Perf. total</th>
                <th className="w-20 px-3 py-2" title="Average score over every recorded answer">Avg %</th>
                <th className="px-3 py-2">Used by</th>
                <th className="px-3 py-2">Visible</th>
                <th className="w-40 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {f.systems.map((s, i) => {
                const u = usage.get(s.key);
                const st = stats.system(rec.id, s.key);
                return (
                  <tr key={s.key} className="border-t border-line">
                    <td className="px-3 py-1.5 text-xs text-muted tabular-nums">{i + 1}</td>
                    <td className="px-3 py-1.5">
                      {renaming?.key === s.key ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={renaming.label}
                            autoFocus
                            aria-label={`New name for ${s.label}`}
                            onChange={(e) => setRenaming({ key: s.key, label: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename();
                              if (e.key === "Escape") setRenaming(null);
                            }}
                            className="h-8 min-w-[200px]"
                          />
                          <IconBtn label="Apply name" onClick={commitRename}>
                            <Check className="size-4" />
                          </IconBtn>
                          <IconBtn label="Cancel rename" onClick={() => setRenaming(null)}>
                            <X className="size-4" />
                          </IconBtn>
                        </div>
                      ) : (
                        <Link
                          href={`/admin/questions?subject=${encodeURIComponent(rec.id)}&system=${encodeURIComponent(s.key)}`}
                          title={`Questions in ${s.label}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {s.label}
                        </Link>
                      )}
                      {s.label !== s.key && <span className="mt-0.5 block text-[11px] text-muted">Originally “{s.key}”</span>}
                    </td>
                    <SystemNumbers st={st} />
                    <td className="px-3 py-1.5 text-xs whitespace-nowrap text-muted">
                      {u ? (
                        <>
                          <Link href={`/admin/questions?subject=${encodeURIComponent(rec.id)}&system=${encodeURIComponent(s.key)}`} className="hover:text-primary hover:underline">
                            {u.questions} q
                          </Link>
                          {" · "}
                          <Link href={`/admin/memory-tricks?subject=${encodeURIComponent(rec.id)}&system=${encodeURIComponent(s.key)}`} className="hover:text-primary hover:underline">
                            {u.tricks} tricks
                          </Link>
                        </>
                      ) : (
                        <Badge tone="teal">New</Badge>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      <Switch checked={s.visible} onChange={(v) => setSys(s.key, { visible: v })} />
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex justify-end">
                        <IconBtn label={`Rename ${s.label}`} onClick={() => setRenaming({ key: s.key, label: s.label })}>
                          <Pencil className="size-4" />
                        </IconBtn>
                        <IconBtn label="Move up" disabled={i === 0} onClick={() => setSystems(move(f.systems, i, -1))}>
                          <ArrowUp className="size-4" />
                        </IconBtn>
                        <IconBtn label="Move down" disabled={i === f.systems.length - 1} onClick={() => setSystems(move(f.systems, i, 1))}>
                          <ArrowDown className="size-4" />
                        </IconBtn>
                        <IconBtn label={`Delete or merge ${s.label}`} onClick={() => removeSystem(s)} className="hover:text-error">
                          <Trash2 className="size-4" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!f.systems.length && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-muted">
                    No systems yet. Add the first one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={newSystem} onChange={(e) => setNewSystem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSystem()} placeholder="New system name, e.g. Oncology" className="max-w-xs" />
          <Btn onClick={addSystem} disabled={!newSystem.trim()}>
            <Plus className="size-4" />
            Add system
          </Btn>
        </div>
      </Panel>

      <div id="numbers" className="scroll-mt-20">
        <Panel title="Numbers students see" description="Counted from published questions and recorded answers, so they update on their own. Publish, archive or move questions to change them.">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <Fact label="Questions (Home)" hint="Standalone + published case studies" value={totals.studyable} />
            <Fact label="Standalone questions" hint="Standalone page, subject tab, Create Test" value={totals.standalone} />
            <Fact label="Questions on Performance" hint="Also counts readiness exam questions" value={totals.perfTotal} />
            <Fact label="Average score" hint={`${totals.attempts} recorded answer${totals.attempts === 1 ? "" : "s"}`} value={formatAvg(totals.avg)} />
            <Fact label="Average time per question" hint="Time Management tables" value={totals.avgTimeSec == null ? "—" : formatDuration(totals.avgTimeSec)} />
          </dl>
        </Panel>
      </div>

      <Panel title="Delete or merge this subject">
        <p className="mb-3 text-sm text-muted">
          Used by {usageAll.questions} questions, {usageAll.cases} case studies, {usageAll.tricks} memory tricks, {usageAll.sheets} cheat sheets and {usageAll.lessons} lessons.
        </p>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => setMergeSubject(true)} disabled={!inUse}>
            <GitMerge className="size-4" />
            Merge into another subject…
          </Btn>
          <Btn variant="danger" disabled={Boolean(inUse)} onClick={deleteSubject} title={inUse ? "Merge or move its content first" : undefined}>
            <Trash2 className="size-4" />
            Delete subject
          </Btn>
        </div>
      </Panel>

      {merge && (
        <MergeSystemDialog
          subject={f}
          from={merge}
          usage={usage.get(merge.key)!}
          onClose={() => setMerge(null)}
          onDone={() => {
            setSystems(f.systems.filter((x) => x.key !== merge.key));
            setMerge(null);
          }}
        />
      )}
      {mergeSubject && <MergeSubjectDialog from={rec} onClose={() => setMergeSubject(false)} />}
    </div>
  );
}

/** Read-only cells: these numbers come from lib/stats, never from the record. */
function SystemNumbers({ st }: { st: Stats }) {
  const cell = "px-3 py-1.5 text-sm text-ink tabular-nums";
  return (
    <>
      <td className={cell}>{st.standalone}</td>
      <td className={cell}>{st.perfTotal}</td>
      <td className={cell} title={`${st.attempts} recorded answer${st.attempts === 1 ? "" : "s"}`}>
        {formatAvg(st.avg)}
      </td>
    </>
  );
}

function Fact({ label, hint, value }: { label: string; hint: string; value: number | string }) {
  return (
    <div>
      <dt className="text-sm text-ink">{label}</dt>
      <dd className="text-2xl font-semibold text-ink tabular-nums">{value}</dd>
      <dd className="text-xs text-muted">{hint}</dd>
    </div>
  );
}

/** A system that content still points to can't just be deleted: move its content to another system first. */
function MergeSystemDialog({ subject, from, usage, onClose, onDone }: { subject: SubjectRec; from: SystemRec; usage: { questions: number; tricks: number }; onClose: () => void; onDone: () => void }) {
  const targets = subject.systems.filter((s) => s.key !== from.key);
  const [to, setTo] = useState(targets[0]?.key ?? "");
  const questions = useAll("questions");
  const tricks = useAll("memoryTricks");
  const run = () => {
    const q = questions.filter((x) => x.subject === subject.id && x.system === from.key).map((x) => x.id);
    const t = tricks.filter((x) => x.subject === subject.id && x.system === from.key).map((x) => x.id);
    if (q.length) crud("questions").patchMany(q, { system: to }, `Moved from system “${from.label}”`);
    if (t.length) crud("memoryTricks").patchMany(t, { system: to }, `Moved from system “${from.label}”`);
    toast(`Moved ${q.length + t.length} item${q.length + t.length === 1 ? "" : "s"}. Save the subject to remove “${from.label}”.`);
    onDone();
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Merge “${from.label}” into another system`}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={run} disabled={!to}>
            <GitMerge className="size-4" />
            Move content & remove
          </Btn>
        </>
      }
    >
      <p className="mb-3 text-sm text-ink">
        {usage.questions} question{usage.questions === 1 ? "" : "s"} and {usage.tricks} memory trick{usage.tricks === 1 ? "" : "s"} use this system. Pick where they should go.
      </p>
      <Field label="Move everything to">
        <Select value={to} onChange={(e) => setTo(e.target.value)}>
          {targets.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
    </Dialog>
  );
}

/** Move every record of one subject to another, then delete the empty subject (and its course). */
function MergeSubjectDialog({ from, onClose }: { from: SubjectRec; onClose: () => void }) {
  const router = useRouter();
  const subjects = useSubjects(true).filter((s) => s.id !== from.id);
  const [to, setTo] = useState(subjects[0]?.id ?? "");
  const target = subjects.find((s) => s.id === to);
  const run = async () => {
    if (!target) return;
    if (!(await confirmDialog({ title: `Merge ${from.name} into ${target.name}?`, body: "All content moves over; its systems are added to the target subject; then this subject is deleted.", confirm: "Merge", danger: true })))
      return;
    const ids = <K extends CollectionName>(col: K, pick: (r: Record<string, unknown>) => boolean) =>
      (getAll(col) as unknown as Record<string, unknown>[]).filter(pick).map((r) => String(r.id));
    const q = ids("questions", (r) => r.subject === from.id);
    const c = ids("cases", (r) => r.subject === from.id);
    const t = ids("memoryTricks", (r) => r.subject === from.id);
    const s = ids("cheatSheets", (r) => r.subject === from.id);
    const l = ids("lessons", (r) => r.course === from.id);
    if (q.length) crud("questions").patchMany(q, { subject: to }, `Merged from ${from.name}`);
    if (c.length) crud("cases").patchMany(c, { subject: to }, `Merged from ${from.name}`);
    if (t.length) crud("memoryTricks").patchMany(t, { subject: to }, `Merged from ${from.name}`);
    if (s.length) crud("cheatSheets").patchMany(s, { subject: to }, `Merged from ${from.name}`);
    if (l.length) crud("lessons").patchMany(l, { course: to }, `Merged from ${from.name}`);
    const extra = from.systems.filter((x) => !target.systems.some((y) => y.key === x.key));
    api.update({ ...target, systems: [...target.systems, ...extra] }, "update", `Added systems from ${from.name}`);
    api.hardDelete([from.id]);
    if (getAll("courses").some((x) => x.id === from.id)) crud("courses").hardDelete([from.id]);
    toast(`Merged into ${target.name}`);
    onClose();
    router.replace(`/admin/subjects?open=${to}`);
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Merge ${from.name}`}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={run} disabled={!to}>
            Merge
          </Btn>
        </>
      }
    >
      <Field label="Move everything into">
        <Select value={to} onChange={(e) => setTo(e.target.value)}>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
    </Dialog>
  );
}
