"use client";

import clsx from "clsx";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Pin } from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";
import { useAll, useConfig } from "@/lib/content";
import { qotdPool, rotationFor, todayISO } from "@/lib/daily";
import type { McqItem } from "@/lib/types";
import { EmailPreview } from "@/components/daily/EmailPreview";
import { AdminPage, Badge, Btn, Dialog, Field, IconBtn, Input, Panel, stripHtml, toast } from "@/components/admin/ui";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function QotdAdmin() {
  const cfg = useConfig().qotd;
  const questions = useAll("questions");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [picked, setPicked] = useState(todayISO());
  const [choosing, setChoosing] = useState<string | null>(null);
  const [email, setEmail] = useState({ subject: cfg.emailSubject, sender: cfg.senderName });

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());
    return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i));
  }, [month]);
  const pool = useMemo(() => qotdPool(), [questions]); // eslint-disable-line react-hooks/exhaustive-deps
  const itemFor = (date: string): { item: McqItem | undefined; pinned: boolean } => {
    const id = cfg.schedule[date];
    if (id) return { item: pool.find((q) => q.id === id), pinned: true };
    return { item: pool.length ? rotationFor(date) : undefined, pinned: false };
  };
  const selected = itemFor(picked);
  const pinnedCount = Object.keys(cfg.schedule).filter((d) => d >= todayISO()).length;

  const pin = (date: string, id: string | null) => {
    const schedule = { ...cfg.schedule };
    if (id) schedule[date] = id;
    else delete schedule[date];
    useAdminStore.getState().setConfig({ qotd: { ...cfg, schedule } }, id ? `Scheduled the Question of the Day for ${date}` : `Cleared the Question of the Day for ${date}`);
    toast(id ? `Scheduled for ${date}` : `${date} uses the rotation again`);
  };

  return (
    <AdminPage
      title="Question of the Day"
      description="Each day shows one single-answer question on the Question of the Day page and in the Daily Warmup email. Pin a question to a date; unpinned days use the automatic rotation."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel
          title={month.toLocaleString("en-US", { month: "long", year: "numeric" })}
          description={`${pinnedCount} upcoming day${pinnedCount === 1 ? "" : "s"} pinned · ${pool.length} eligible questions`}
          actions={
            <div className="flex items-center gap-1">
              <IconBtn label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                <ChevronLeft className="size-4" />
              </IconBtn>
              <Btn variant="ghost" onClick={() => (setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), setPicked(todayISO()))}>
                Today
              </Btn>
              <IconBtn label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                <ChevronRight className="size-4" />
              </IconBtn>
            </div>
          }
        >
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
            {DOW.map((d) => (
              <div key={d} className="py-1 font-semibold">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const key = iso(d);
              const { item, pinned } = itemFor(key);
              const inMonth = d.getMonth() === month.getMonth();
              const isToday = key === todayISO();
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPicked(key)}
                  onDoubleClick={() => setChoosing(key)}
                  className={clsx(
                    "flex min-h-[78px] cursor-pointer flex-col rounded-md border p-1.5 text-left transition-colors",
                    picked === key ? "border-primary bg-primary-light" : "border-line bg-white hover:border-faint",
                    !inMonth && "opacity-45",
                  )}
                >
                  <span className={clsx("mb-1 flex size-6 items-center justify-center rounded-full text-xs font-semibold", isToday ? "bg-primary text-white" : "text-ink")}>{d.getDate()}</span>
                  {item && (
                    <span className={clsx("line-clamp-2 text-[11px] leading-tight", pinned ? "font-medium text-ink" : "text-muted")}>
                      {pinned && <Pin className="mr-0.5 inline size-3 text-gold" />}
                      {stripHtml(item.stem)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">Click a day to preview it; double-click (or use the button on the right) to pin a question.</p>
        </Panel>

        <div className="space-y-4">
          <Panel
            title={new Date(`${picked}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            description={selected.pinned ? "Pinned by an admin" : "Automatic rotation"}
            actions={
              <div className="flex gap-2">
                {selected.pinned && <Btn onClick={() => pin(picked, null)}>Unpin</Btn>}
                <Btn variant="primary" onClick={() => setChoosing(picked)}>
                  <Pin className="size-4" />
                  {selected.pinned ? "Change" : "Pin a question"}
                </Btn>
              </div>
            }
          >
            {selected.item ? (
              <div className="origin-top scale-[0.92]">
                <EmailPreview item={selected.item} date={picked} link={`https://nclexbase.com/nclex/question-of-the-day?d=${picked}`} />
              </div>
            ) : (
              <p className="text-sm text-muted">No eligible questions. Publish a multiple-choice question first.</p>
            )}
          </Panel>
          <Panel title="Daily Warmup email">
            <div className="space-y-3">
              <Field label="Subject line">
                <Input value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} />
              </Field>
              <Field label="Sender name">
                <Input value={email.sender} onChange={(e) => setEmail({ ...email, sender: e.target.value })} />
              </Field>
              <Btn
                variant="primary"
                disabled={email.subject === cfg.emailSubject && email.sender === cfg.senderName}
                onClick={() => (useAdminStore.getState().setConfig({ qotd: { ...cfg, emailSubject: email.subject, senderName: email.sender } }, "Updated the Daily Warmup email"), toast("Email settings saved"))}
              >
                Save email settings
              </Btn>
              <p className="text-xs text-muted">Sending needs the backend; students currently see the email as a preview.</p>
            </div>
          </Panel>
        </div>
      </div>
      {choosing && <ChooseQuestion date={choosing} pool={pool} schedule={cfg.schedule} onClose={() => setChoosing(null)} onPick={(id) => (pin(choosing, id), setChoosing(null))} />}
    </AdminPage>
  );
}

function ChooseQuestion({ date, pool, schedule, onClose, onPick }: { date: string; pool: McqItem[]; schedule: Record<string, string>; onClose: () => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = pool.filter((x) => words.every((w) => `${x.id} ${stripHtml(x.stem)} ${x.options.join(" ")} ${x.topic}`.toLowerCase().includes(w))).slice(0, 50);
  // Warn about questions already pinned within 90 days of this date.
  const near = (id: string) =>
    Object.entries(schedule).find(([d, v]) => v === id && d !== date && Math.abs(Date.parse(d) - Date.parse(date)) <= 90 * 864e5)?.[0];
  return (
    <Dialog open onClose={onClose} title={`Pick a question for ${date}`} width={720}>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stem, options, topic, id" autoFocus className="mb-3" />
      <ul className="divide-y divide-line rounded-md border border-line">
        {hits.map((x) => {
          const clash = near(x.id);
          return (
            <li key={x.id}>
              <button type="button" onClick={() => onPick(x.id)} className="flex w-full cursor-pointer items-start gap-3 px-3 py-2 text-left hover:bg-primary-light">
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-sm text-ink">{stripHtml(x.stem)}</span>
                  <span className="text-xs text-muted">
                    {x.id} · {x.topic || x.system}
                  </span>
                </span>
                {clash && <Badge tone="warning">Also on {clash}</Badge>}
              </button>
            </li>
          );
        })}
        {!hits.length && <li className="px-3 py-6 text-center text-sm text-muted">No questions match.</li>}
      </ul>
    </Dialog>
  );
}
