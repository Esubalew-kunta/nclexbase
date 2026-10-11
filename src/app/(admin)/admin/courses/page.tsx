"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { crud, today } from "@/lib/admin/crud";
import { newId } from "@/lib/admin/store";
import type { CourseRec, LessonRec, Status } from "@/lib/admin/types";
import { useAll } from "@/lib/content";
import { AccessBadge, AdminPage, Badge, Btn, confirmDialog, Drawer, Field, IconBtn, Input, Panel, Segmented, StatusBadge, toast, sameRecord, useUnsavedGuard } from "@/components/admin/ui";
import { accessFilter, BulkBar, DataTable, ListEmpty, ListToolbar, statusFilter, useEditParam, useList, useSelection, type Column } from "@/components/admin/list";
import { HistoryButton, StatusBulkActions, StatusPicker } from "@/components/admin/parts";

const courseApi = crud("courses");
const api = crud("lessons");

export default function CoursesAdmin() {
  const router = useRouter();
  const params = useSearchParams();
  const courses = useAll("courses").slice().sort((a, b) => (a.kind === b.kind ? a.order - b.order : a.kind === "subject" ? -1 : 1));
  const allLessons = useAll("lessons");
  const courseId = params.get("course") ?? courses[0]?.id;
  const course = courses.find((c) => c.id === courseId) ?? courses[0];
  const [editCourse, setEditCourse] = useState(false);
  const pick = (id: string) => router.replace(`/admin/courses?course=${id}`);

  return (
    <AdminPage title="Courses & Lessons" description="Crash Course videos for each subject and the Next Gen Strategy Course modules. Lesson order here is the order students see.">
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Panel title="Courses" bodyClassName="p-2">
          {(["subject", "ngn"] as const).map((kind) => (
            <div key={kind} className="mb-2">
              <p className="px-2 pt-1 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">{kind === "subject" ? "Crash courses" : "Next Gen Strategy Course"}</p>
              {courses
                .filter((c) => c.kind === kind)
                .map((c) => {
                  const n = allLessons.filter((l) => l.course === c.id).length;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pick(c.id)}
                      className={clsx(
                        "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left",
                        course?.id === c.id ? "bg-primary-light shadow-[inset_3px_0_0_0_var(--color-primary)]" : "hover:bg-background",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">{c.title}</span>
                      {c.status !== "published" && <StatusBadge status={c.status} />}
                      <span className="text-xs text-muted tabular-nums">{n}</span>
                    </button>
                  );
                })}
            </div>
          ))}
        </Panel>
        {course && (
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-ink">{course.title}</h2>
              <Badge>{course.runtime || "No runtime"}</Badge>
              <StatusBadge status={course.status} />
              <Btn className="ml-auto" onClick={() => setEditCourse(true)}>
                Edit course
              </Btn>
            </div>
            <Lessons key={course.id} course={course} />
          </div>
        )}
      </div>
      {editCourse && course && <CourseEditor key={course.id} rec={course} onClose={() => setEditCourse(false)} />}
    </AdminPage>
  );
}

function Lessons({ course }: { course: CourseRec }) {
  const all = useAll("lessons");
  const rows = useMemo(() => all.filter((l) => l.course === course.id), [all, course.id]);
  const edit = useEditParam();
  const ordered = rows.slice().sort((a, b) => a.order - b.order);
  const list = useList<LessonRec>({
    id: "lessons",
    rows,
    search: (l) => `${l.id} ${l.title} ${l.videoUrl ?? ""}`,
    filters: [
      {
        key: "type",
        label: "Type",
        options: [
          { value: "video", label: "Video" },
          { value: "bites", label: "Bites quiz" },
        ],
        match: (l, v) => l.type === v,
      },
      accessFilter(),
      statusFilter(),
      {
        key: "media",
        label: "Media",
        options: [
          { value: "missing", label: "Video URL missing" },
          { value: "has", label: "Has video URL" },
        ],
        match: (l, v) => l.type === "video" && (v === "has" ? Boolean(l.videoUrl) : !l.videoUrl),
      },
    ],
    sorts: { order: { label: "Order", value: (l) => l.order }, title: { label: "Title", value: (l) => l.title } },
    defaultSort: { key: "order", dir: "asc" },
    pageSize: 100,
  });
  const sel = useSelection(list.filtered.map((l) => l.id));
  const moveLesson = (l: LessonRec, d: number) => {
    const ids = ordered.map((x) => x.id);
    const i = ids.indexOf(l.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    api.reorder(ids);
  };
  const canReorder = !list.active && list.sort.key === "order";
  const columns: Column<LessonRec>[] = [
    { key: "order", label: "#", sort: "order", render: (l) => <span className="text-muted tabular-nums">{ordered.indexOf(l) + 1}</span>, headClassName: "w-12" },
    { key: "title", label: "Lesson", sort: "title", render: (l) => <span className="font-medium">{l.title}</span> },
    { key: "type", label: "Type", render: (l) => <Badge tone={l.type === "video" ? "teal" : "gold"}>{l.type === "video" ? `Video${l.duration ? ` · ${l.duration}` : ""}` : `Bites · ${l.count ?? 0} Qs`}</Badge> },
    { key: "access", label: "Access", render: (l) => <AccessBadge access={l.access} /> },
    { key: "status", label: "Status", render: (l) => <StatusBadge status={l.status} /> },
    {
      key: "move",
      label: "",
      render: (l) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <IconBtn label="Move up" disabled={!canReorder || ordered[0] === l} onClick={() => moveLesson(l, -1)}>
            <ArrowUp className="size-4" />
          </IconBtn>
          <IconBtn label="Move down" disabled={!canReorder || ordered.at(-1) === l} onClick={() => moveLesson(l, 1)}>
            <ArrowDown className="size-4" />
          </IconBtn>
        </div>
      ),
    },
  ];
  const editing = edit.id === "new" ? null : rows.find((l) => l.id === edit.id);
  return (
    <>
      <ListToolbar
        list={list}
        placeholder="Search lessons"
        extra={
          <Btn variant="primary" onClick={() => edit.open("new")}>
            <Plus className="size-4" />
            New lesson
          </Btn>
        }
      />
      {!canReorder && <p className="mb-2 text-xs text-muted">Clear search and filters and sort by # to reorder.</p>}
      <BulkBar count={sel.selected.size} onClear={sel.clear}>
        <StatusBulkActions
          ids={[...sel.selected]}
          rows={rows}
          onStatus={(ids, s) => (api.setStatus(ids, s), toast(`${ids.length} updated`))}
          onAccess={(ids, a) => (api.patchMany(ids, { access: a }, a === "free" ? "Made free" : "Made premium"), toast(`${ids.length} updated`))}
          onDelete={(ids) => (api.hardDelete(ids), sel.clear())}
        />
      </BulkBar>
      <DataTable list={list} columns={columns} rowId={(l) => l.id} onRowClick={(l) => edit.open(l.id)} selection={sel} empty={<ListEmpty list={list} noun="lessons" onCreate={() => edit.open("new")} />} />
      {edit.id && (edit.id === "new" || editing) && <LessonEditor key={edit.id} rec={editing ?? null} course={course} nextOrder={ordered.length} onClose={edit.close} />}
    </>
  );
}

function LessonEditor({ rec, course, nextOrder, onClose }: { rec: LessonRec | null; course: CourseRec; nextOrder: number; onClose: () => void }) {
  const initial = useMemo<LessonRec>(() => rec ?? { id: newId("lesson"), course: course.id, type: "video", title: "", duration: "", access: "premium", status: "draft", order: nextOrder, updatedAt: today() }, [rec]); // eslint-disable-line react-hooks/exhaustive-deps
  const [f, setF] = useState(initial);
  const dirty = !sameRecord(f, initial);
  useUnsavedGuard(dirty);
  const durationOk = !f.duration || /^\d{1,3}:\d{2}$/.test(f.duration);
  const save = (status?: Status) => {
    const next = { ...f, title: f.title.trim(), status: status ?? f.status };
    if (!next.title) return toast("Add a lesson title.", "error");
    if (!durationOk) return toast("Duration should look like 12:34.", "error");
    if (rec) api.update(next, next.status !== rec.status ? (next.status === "published" ? "publish" : next.status === "draft" ? "unpublish" : "archive") : "update");
    else api.create(next);
    toast(rec ? "Lesson saved" : "Lesson created");
    onClose();
  };
  const close = async () => {
    if (dirty && !(await confirmDialog({ title: "Discard changes?", confirm: "Discard", danger: true }))) return;
    onClose();
  };
  return (
    <Drawer
      open
      onClose={close}
      title={rec ? `Edit: ${rec.title}` : `New lesson in ${course.title}`}
      footer={
        <>
          {rec && <HistoryButton<LessonRec> historyKey={`lessons:${rec.id}`} onRestore={(v) => (api.restore(rec.id, v), onClose())} describe={(v) => v.title} />}
          <span className="flex-1" />
          <Btn onClick={close}>Cancel</Btn>
          <Btn onClick={() => save("draft")}>Save draft</Btn>
          <Btn variant="primary" onClick={() => save("published")}>
            {rec?.status === "published" ? "Save & keep published" : "Publish"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Type">
          <Segmented
            value={f.type}
            onChange={(v) => setF({ ...f, type: v })}
            options={[
              { value: "video", label: "Video" },
              { value: "bites", label: "Bites quiz" },
            ]}
          />
        </Field>
        <Field label="Title" required>
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus />
        </Field>
        {f.type === "video" ? (
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <Field label="Duration" error={durationOk ? "" : "Use mm:ss"} hint="e.g. 12:34">
              <Input value={f.duration ?? ""} onChange={(e) => setF({ ...f, duration: e.target.value })} invalid={!durationOk} />
            </Field>
            <Field label="Video URL" hint="Hosted video link (YouTube, Vimeo, CDN). Upload arrives with the backend.">
              <Input value={f.videoUrl ?? ""} onChange={(e) => setF({ ...f, videoUrl: e.target.value || undefined })} placeholder="https://" />
            </Field>
          </div>
        ) : (
          <Field label="Number of questions">
            <Input type="number" min={1} value={f.count ?? 5} onChange={(e) => setF({ ...f, count: Number(e.target.value) || 1 })} className="w-28" />
          </Field>
        )}
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Access">
            <Segmented
              value={f.access}
              onChange={(v) => setF({ ...f, access: v })}
              options={[
                { value: "free", label: "Free" },
                { value: "premium", label: "Premium" },
              ]}
            />
          </Field>
          <Field label="Status">
            <StatusPicker value={f.status} onChange={(v) => setF({ ...f, status: v })} />
          </Field>
        </div>
      </div>
    </Drawer>
  );
}

function CourseEditor({ rec, onClose }: { rec: CourseRec; onClose: () => void }) {
  const [f, setF] = useState(rec);
  const save = () => {
    if (!f.title.trim()) return toast("Add a course title.", "error");
    courseApi.update({ ...f, title: f.title.trim() }, f.status !== rec.status ? (f.status === "published" ? "publish" : f.status === "draft" ? "unpublish" : "archive") : "update");
    toast("Course saved");
    onClose();
  };
  return (
    <Drawer
      open
      onClose={onClose}
      title={`Course: ${rec.title}`}
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={save}>
            Save
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required>
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        <Field label="Runtime" hint="Shown on the course card, e.g. “8h 20m”.">
          <Input value={f.runtime} onChange={(e) => setF({ ...f, runtime: e.target.value })} className="w-40" />
        </Field>
        <Field label="Status" hint="Unpublished courses disappear from the Crash Courses / Next Gen pages.">
          <StatusPicker value={f.status} onChange={(v) => setF({ ...f, status: v })} />
        </Field>
      </div>
    </Drawer>
  );
}
