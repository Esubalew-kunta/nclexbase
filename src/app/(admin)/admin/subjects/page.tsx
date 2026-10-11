"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, GitMerge, Plus, Trash2 } from "lucide-react";
import { crud } from "@/lib/admin/crud";
import type { SubjectRec, SystemRec } from "@/lib/admin/types";
import { useAll, useSubjects } from "@/lib/content";
import { ALL_TABS, TAB_LABELS, type SubjectTab } from "@/lib/subjectTabs";
import { AdminPage, Badge, Btn, confirmDialog, Dialog, Field, IconBtn, Input, Panel, Select, Switch, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { HistoryButton } from "@/components/admin/parts";

const api = crud("subjects");

const move = <T,>(arr: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const out = [...arr];
  [out[i], out[j]] = [out[j], out[i]];
  return out;
};

export default function SubjectsAdmin() {
  const router = useRouter();
  const params = useSearchParams();
  const subjects = useSubjects(true);
  const openId = params.get("open") ?? subjects[0]?.id;
  const current = subjects.find((s) => s.id === openId) ?? subjects[0];

  const reorder = (i: number, d: number) => {
    const ids = move(
      subjects.map((s) => s.id),
      i,
      d,
    );
    api.reorder(ids);
  };

  return (
    <AdminPage
      title="Subjects & Systems"
      description="The structure every other screen filters by. Rename, reorder or hide subjects; choose which tabs each subject page shows; manage its systems (sub-subjects). Adding a brand-new subject needs the backend (icons, question bank), so it isn't offered here yet."
    >
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Panel title="Subjects" description="Order here is the order in the sidebar, Home and every filter." bodyClassName="p-2">
          <ul>
            {subjects.map((s, i) => (
              <li key={s.id}>
                <div
                  className={clsx(
                    "group flex items-center gap-1 rounded-md px-2 py-1.5",
                    current?.id === s.id ? "bg-primary-light shadow-[inset_3px_0_0_0_var(--color-primary)]" : "hover:bg-background",
                  )}
                >
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
    </AdminPage>
  );
}

function SubjectEditor({ rec }: { rec: SubjectRec }) {
  const [f, setF] = useState<SubjectRec>(rec);
  const [newSystem, setNewSystem] = useState("");
  const [merge, setMerge] = useState<SystemRec | null>(null);
  const questions = useAll("questions");
  const tricks = useAll("memoryTricks");
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
  const shownTabs = f.tabs;
  const hiddenTabs = ALL_TABS.filter((t) => !f.tabs.includes(t));

  const addSystem = () => {
    const label = newSystem.trim();
    if (!label) return;
    if (f.systems.some((s) => s.label.toLowerCase() === label.toLowerCase() || s.key.toLowerCase() === label.toLowerCase())) return toast("A system with that name already exists.", "error");
    setSystems([...f.systems, { key: label, label, visible: true }]);
    setNewSystem("");
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
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Display name" required>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
          <Switch checked={f.visible} onChange={(v) => setF({ ...f, visible: v })} label="Visible to students" description="Hidden subjects disappear from the sidebar, Home and filters." />
        </div>
      </Panel>

      <Panel title="Subject page tabs" description="Tabs students see on this subject's page, in order. The first tab is where /nclex/subject opens.">
        <ul className="divide-y divide-line rounded-md border border-line">
          {shownTabs.map((t, i) => (
            <li key={t} className="flex items-center gap-2 px-3 py-2">
              <span className="w-6 text-xs text-muted tabular-nums">{i + 1}</span>
              <span className="flex-1 text-sm text-ink">{TAB_LABELS[t]}</span>
              <IconBtn label="Move up" disabled={i === 0} onClick={() => setF({ ...f, tabs: move(f.tabs, i, -1) })}>
                <ArrowUp className="size-4" />
              </IconBtn>
              <IconBtn label="Move down" disabled={i === shownTabs.length - 1} onClick={() => setF({ ...f, tabs: move(f.tabs, i, 1) })}>
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

      <Panel title="Systems (sub-subjects)" description="Used by the Standalone tab, Create Test, Memory Tricks and every system filter. Renaming keeps all linked content attached.">
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-background text-left text-xs text-muted uppercase">
              <tr>
                <th className="w-10 px-3 py-2">#</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Used by</th>
                <th className="px-3 py-2">Visible</th>
                <th className="w-32 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {f.systems.map((s, i) => {
                const u = usage.get(s.key);
                return (
                  <tr key={s.key} className="border-t border-line">
                    <td className="px-3 py-1.5 text-xs text-muted tabular-nums">{i + 1}</td>
                    <td className="px-3 py-1.5">
                      <Input
                        value={s.label}
                        aria-label={`Name of system ${i + 1}`}
                        onChange={(e) => setSystems(f.systems.map((x) => (x.key === s.key ? { ...x, label: e.target.value } : x)))}
                        className="h-8"
                      />
                      {s.label !== s.key && <span className="mt-0.5 block text-[11px] text-muted">Originally “{s.key}”</span>}
                    </td>
                    <td className="px-3 py-1.5 text-xs text-muted">
                      {u ? (
                        <>
                          {u.questions} question{u.questions === 1 ? "" : "s"} · {u.tricks} trick{u.tricks === 1 ? "" : "s"}
                        </>
                      ) : (
                        <Badge tone="teal">New</Badge>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      <Switch checked={s.visible} onChange={(v) => setSystems(f.systems.map((x) => (x.key === s.key ? { ...x, visible: v } : x)))} />
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex justify-end">
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

      {merge && (
        <MergeDialog
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
    </div>
  );
}

/** A system that content still points to can't just be deleted: move its content to another system first. */
function MergeDialog({ subject, from, usage, onClose, onDone }: { subject: SubjectRec; from: SystemRec; usage: { questions: number; tricks: number }; onClose: () => void; onDone: () => void }) {
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
