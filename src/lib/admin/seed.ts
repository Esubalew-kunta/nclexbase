import { CHEAT_SHEETS, LESSONS, NGN_COURSE, READINESS_EXAMS, SUBJECTS } from "@/data/catalog";
import { CASES, CASE_ROWS } from "@/data/cases";
import { STANDALONE } from "@/data/standalone";
import { READINESS_ITEMS } from "@/data/readiness";
import { MEMORY_TRICKS_SEED } from "@/data/memoryTricks";
import { PLANS_SEED } from "@/data/plans";
import faqsJson from "@/data/live/faqs.json";
import { tabsFor } from "@/lib/subjectTabs";
import type { SubjectId } from "@/lib/types";
import type { AnnouncementRec, CaseRec, CheatSheetRec, CodeRec, Collections, CourseRec, FaqPlacement, FaqRec, LessonRec, MessageRec, QuestionRec, ReadinessRec, SubjectRec, UserRec } from "./types";

/*
 * Turns today's static data (src/data/*) into admin records. These are the starting
 * point; admin edits are stored as patches on top (lib/admin/store.ts).
 */

const SEEDED = "2026-10-01";
const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const subjects = (): SubjectRec[] =>
  SUBJECTS.map((s, i) => ({
    id: s.id,
    name: s.name,
    order: i,
    visible: true,
    tabs: tabsFor(s.id),
    // Counts and averages are not stored: lib/stats.ts derives them from the bank and attempts.
    systems: s.systems.map((sys) => ({ key: sys.name, label: sys.name, visible: true })),
    icon: null,
    updatedAt: SEEDED,
  }));

const cheatSheets = (): CheatSheetRec[] => {
  const seen = new Set<string>();
  return CHEAT_SHEETS.map((c, i) => {
    let id = `cs-${slug(c.subject)}-${slug(c.title)}`;
    while (seen.has(id)) id += "-2";
    seen.add(id);
    return { id, title: c.title, subject: c.subject, systems: c.systems, subjectSystems: c.subjectSystems, access: c.free ? "free" : "premium", status: "published", order: i, file: null, updatedAt: SEEDED };
  });
};

const questions = (): QuestionRec[] => {
  const out: QuestionRec[] = [];
  const meta = { access: "free" as const, status: "published" as const, updatedAt: SEEDED };
  STANDALONE.forEach((it, i) => out.push({ ...it, ...meta, source: { kind: "standalone" }, order: i }));
  CASES.forEach((c) => c.items.forEach((it, i) => out.push({ ...it, ...meta, source: { kind: "case", caseId: c.id }, order: i })));
  // Includes the readiness case items (they are listed in exam order).
  READINESS_ITEMS.forEach((it, i) => out.push({ ...it, ...meta, source: { kind: "readiness" }, order: i }));
  return out;
};

const cases = (): CaseRec[] =>
  CASE_ROWS.map((r) => {
    const c = CASES.find((x) => x.id === r.id);
    return {
      id: r.id,
      number: r.number,
      title: r.title,
      subject: r.subject as SubjectId,
      access: r.free ? "free" : "premium",
      status: "published",
      order: r.number,
      content: c ? { intro: c.intro, exhibit: c.exhibit, tabs: c.tabs, itemIds: c.items.map((i) => i.id) } : null,
      updatedAt: SEEDED,
    };
  });

const readiness = (): ReadinessRec[] =>
  READINESS_EXAMS.map((r, i) => ({
    id: r.id,
    number: r.number,
    title: r.title,
    minQuestions: r.minQuestions,
    maxQuestions: r.questions,
    minutes: r.minutes,
    shuffle: r.number !== 1,
    access: r.free ? "free" : "premium",
    status: "published",
    order: i,
    updatedAt: SEEDED,
  }));

const courses = (): CourseRec[] => [
  ...SUBJECTS.map((s, i): CourseRec => ({ id: s.id, kind: "subject", title: s.name, runtime: s.videoRuntime, status: "published", order: i, updatedAt: SEEDED })),
  ...NGN_COURSE.map((m, i): CourseRec => ({ id: `ngn-${i + 1}`, kind: "ngn", title: m.title, runtime: m.runtime, status: "published", order: i, updatedAt: SEEDED })),
];

const lessons = (): LessonRec[] => [
  ...SUBJECTS.flatMap((s) =>
    LESSONS[s.id].map((l, i): LessonRec => ({
      id: `${s.id}-${i + 1}`,
      course: s.id,
      type: l.type,
      title: l.title,
      duration: l.duration,
      count: l.count,
      access: l.locked ? "premium" : "free",
      status: "published",
      order: i,
      updatedAt: SEEDED,
    })),
  ),
  ...NGN_COURSE.flatMap((m, mi) =>
    m.lessons.map((title, i): LessonRec => ({ id: `ngn-${mi + 1}-${i + 1}`, course: `ngn-${mi + 1}`, type: "video", title, access: "free", status: "published", order: i, updatedAt: SEEDED })),
  ),
];

const faqs = (): FaqRec[] => {
  const groups = faqsJson as unknown as Record<string, [string, string][]>;
  const placementOf: Record<string, FaqPlacement> = { faqs: "home", performance: "performance", readiness: "readiness", schedule: "schedule", review: "review" };
  const byQuestion = new Map<string, FaqRec>();
  let order = 0;
  for (const [group, list] of Object.entries(groups)) {
    const placement = placementOf[group];
    if (!placement) continue;
    for (const [question, answer] of list) {
      const hit = byQuestion.get(question);
      if (hit) {
        if (!hit.placements.includes(placement)) hit.placements.push(placement);
        continue;
      }
      byQuestion.set(question, { id: `faq-${slug(question).slice(0, 48)}`, question, answer, placements: [placement], status: "published", order: order++, updatedAt: SEEDED });
    }
  }
  return [...byQuestion.values()];
};

const plans = () => PLANS_SEED.map((p, i) => ({ ...p, status: "published" as const, order: i, updatedAt: SEEDED }));

/* Mock people for the Users / Codes / Inbox tabs (no backend yet). */
const FIRST = ["Amara", "Bethany", "Carlos", "Dana", "Elijah", "Fatima", "Grace", "Hana", "Isaac", "Jade", "Kofi", "Lena", "Mateo", "Nia", "Omar", "Priya", "Quinn", "Rosa", "Samuel", "Tess", "Uma", "Victor", "Wren", "Yusuf"];
const LAST = ["Okafor", "Nguyen", "Ramirez", "Kim", "Brooks", "Haddad", "Patel", "Tanaka", "Mensah", "Rivera", "Cohen", "Ali"];
const SCHOOLS = ["", "", "Lakeside College of Nursing", "", "Riverside University", "", "Lakeside College of Nursing", ""];

const users = (): UserRec[] =>
  FIRST.map((f, i) => {
    const l = LAST[(i * 7) % LAST.length];
    const created = new Date(Date.UTC(2026, 3 + (i % 6), 1 + ((i * 5) % 27)));
    const last = new Date(Date.UTC(2026, 9, 11 - ((i * 3) % 50)));
    return {
      id: `u-${i + 1}`,
      name: `${f} ${l}`,
      email: `${f}.${l}`.toLowerCase() + "@example.com",
      plan: i % 3 === 0 ? "free" : "premium",
      status: i === 9 ? "disabled" : "active",
      institution: SCHOOLS[i % SCHOOLS.length],
      createdAt: created.toISOString().slice(0, 10),
      lastActive: last.toISOString().slice(0, 10),
      answered: (i * 137) % 1400,
      scorePct: 48 + ((i * 11) % 34),
      updatedAt: SEEDED,
    };
  });

const codes = (): CodeRec[] => [
  { id: "code-1", code: "LAKESIDE-2026", institution: "Lakeside College of Nursing", seats: 120, used: 47, expiresAt: "2027-06-30", status: "active", updatedAt: SEEDED },
  { id: "code-2", code: "RIVERSIDE-RN", institution: "Riverside University", seats: 60, used: 60, expiresAt: "2026-12-31", status: "active", updatedAt: SEEDED },
  { id: "code-3", code: "PILOT-FALL25", institution: "Pilot cohort", seats: 25, used: 11, expiresAt: "2026-01-31", status: "disabled", updatedAt: SEEDED },
];

const messages = (): MessageRec[] => [
  {
    id: "msg-1",
    name: "Grace Patel",
    email: "grace.patel@example.com",
    body: "Hi! Can I move my exam date in the study schedule without losing the assignments I already finished?",
    createdAt: "2026-10-09T14:12:00Z",
    status: "open",
    replies: [],
    updatedAt: SEEDED,
  },
  {
    id: "msg-2",
    name: "Kofi Mensah",
    email: "kofi.mensah@example.com",
    body: "The pharmacology memory tricks are great. Will there be more for endocrine drugs?",
    createdAt: "2026-10-07T09:40:00Z",
    status: "closed",
    replies: [{ by: "NCLEXBase team", body: "Thanks Kofi! Endocrine drug tricks are on the way this month.", at: "2026-10-07T12:05:00Z" }],
    updatedAt: SEEDED,
  },
];

const announcements = (): AnnouncementRec[] => [
  {
    id: "ann-memory-tricks",
    message: "New: Memory Tricks are now on every subject page.",
    linkLabel: "Take a look",
    linkHref: "/nclex/adult-health/memory-tricks",
    audience: "all",
    tone: "info",
    start: "",
    end: "",
    status: "draft",
    order: 0,
    updatedAt: SEEDED,
  },
];

export type SeedFactories = { [K in keyof Collections]: () => Collections[K][] };

/** One factory per collection. Called once and cached (see lib/content). */
export const SEED: SeedFactories = {
  subjects,
  memoryTricks: () => MEMORY_TRICKS_SEED.map((t) => ({ ...t })),
  cheatSheets,
  questions,
  cases,
  readiness,
  courses,
  lessons,
  faqs,
  plans,
  users,
  codes,
  messages,
  announcements,
};
