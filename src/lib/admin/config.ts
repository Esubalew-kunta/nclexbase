import type { ExamSettings } from "@/lib/store";
import type { IconName } from "@/components/ui/Icon";
import { NAV } from "@/components/shell/nav";

/**
 * Site-wide settings the admin controls. Stored per section: saving a section replaces it
 * (lib/admin/store.ts setConfig); missing sections fall back to DEFAULT_CONFIG.
 */
export interface SiteConfig {
  branding: { siteName: string; supportEmail: string; termsUrl: string; privacyUrl: string; coachName: string; coachPhotoUrl: string };
  homeLayout: { sections: { key: HomeSection; visible: boolean }[]; quickActions: QuickAction[] };
  navigation: { sections: NavSectionCfg[] };
  freeTier: { freeQuestions: number };
  /** Catalog totals shown on Home and in Create Test (mirrors the live product until the bank is complete). */
  totals: { cases: number; standalone: number; readiness: number; performanceQuestions: number };
  targets: { score: number; usage: number };
  readinessBands: { high: number; borderline: number };
  schedule: ScheduleRules;
  upgrade: { headline: string; subhead: string; included: string[] };
  payments: {
    /** Shown next to every price, e.g. "ETB" or "USD". */
    currency: string;
    /** How long a review usually takes, shown after a student submits. */
    reviewTime: string;
    /** Admin alerts for new payments. Sending needs the backend; until then alerts wait in the Notifications log. */
    telegram: { enabled: boolean; chatId: string };
  };
  qotd: {
    /** Date (YYYY-MM-DD) → question id. Days with no entry have no Question of the Day. */
    schedule: Record<string, string>;
    /** Days filled by "Auto-select" (the rest of `schedule` was picked by hand). */
    autoDays: Record<string, true>;
    /** The subjects/systems last used to auto-fill each month ("YYYY-MM"). */
    months: Record<string, QotdMonth>;
    /** Remind the admin this many days before the current week/month ends if the next one has empty days. */
    remind: { period: "week" | "month" | "off"; days: number };
    emailSubject: string;
    senderName: string;
  };
  exam: { defaults: ExamSettings; askAi: boolean };
  flags: Record<string, boolean>;
  studyGuide: { intro: string; fileUrl: string; fileName: string };
  /** Page text overrides by copy key (see lib/admin/copy.ts). Missing keys use the default text. */
  copy: Record<string, string>;
}

/** Auto-select settings for one month: the subjects to draw from, each limited to some systems or all of them. */
export interface QotdMonth {
  subjects: { id: string; systems: string[] | null }[];
  filledAt: string;
}

export type HomeSection = "schedule" | "subjects" | "questionTypes" | "resources" | "faqs";
export type QuickActionKey = "createTest" | "dailyWarmup" | "performance" | "readiness" | "previousTests";

export interface QuickAction {
  id: string;
  /** Built-in actions keep their special behaviour (Create Test opens the modal, Daily Warmup locks for free members). */
  builtin?: QuickActionKey;
  label: string;
  subtitle: string;
  href: string;
  icon: IconName;
  visible: boolean;
}

export interface NavLinkCfg {
  id: string;
  label: string;
  href: string;
  icon: IconName;
  /** "subjects" = the Subjects accordion, "contact" = opens the contact widget. */
  kind: "link" | "subjects" | "contact";
  external: boolean;
  visible: boolean;
}

export interface NavSectionCfg {
  id: string;
  title: string;
  visible: boolean;
  links: NavLinkCfg[];
}

export interface ScheduleItemCfg {
  id: string;
  title: string;
  minutes: number;
  href: string;
}

export interface ScheduleRules {
  goodMaxHours: number;
  busyMaxHours: number;
  goodMessage: string;
  busyMessage: string;
  heavyMessage: string;
  /** Day-one onboarding assignments. */
  intro: ScheduleItemCfg[];
  ngnOverview: { enabled: boolean; title: string; minutes: number };
  caseMinutes: number;
  /** Standalone practice blocks, repeated in order to fill the plan. */
  blocks: { title: string; minutes: number }[];
  /** A review pair after every N content assignments (0 = off). */
  reviewEvery: number;
  review: ScheduleItemCfg[];
  readinessMinutes: number;
}

export const HOME_SECTION_LABELS: Record<HomeSection, string> = {
  schedule: "Study Schedule",
  subjects: "Study by Subject",
  questionTypes: "Study by Question Type",
  resources: "Resources",
  faqs: "FAQs",
};

/** Icons the admin can choose for sidebar links and quick actions. */
export const PICKABLE_ICONS: IconName[] = [
  "home",
  "subjects",
  "caseStudies",
  "standalone",
  "readiness",
  "crashCourse",
  "cheatSheets",
  "previousTests",
  "performance",
  "nextGenCourse",
  "studyGuide",
  "studySchedule",
  "questionOfDay",
  "faqs",
  "contact",
  "qaCreateTest",
  "qaPerformance",
  "qaReadiness",
  "qaPreviousTests",
  "shield",
  "target",
  "bites",
  "externalLink",
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Seed the editable sidebar from the built-in NAV definition. */
const seedNavigation = (): NavSectionCfg[] =>
  NAV.map((s, i) => ({
    id: `sec-${slug(s.title ?? "top") || i}`,
    title: s.title ?? "",
    visible: true,
    links: [
      ...(s.subjects ? [{ id: "subjects", label: "Subjects", href: "", icon: "subjects" as IconName, kind: "subjects" as const, external: false, visible: true }] : []),
      ...s.links.map((l) => ({ id: `nav-${slug(l.label)}`, label: l.label, href: l.href, icon: l.icon, kind: l.action === "contact" ? ("contact" as const) : ("link" as const), external: Boolean(l.external), visible: true })),
    ],
  }));

export const DEFAULT_CONFIG: SiteConfig = {
  branding: {
    siteName: "NCLEXBase.com",
    supportEmail: "team@bootcamp.com",
    termsUrl: "https://nclexbase.com/terms",
    privacyUrl: "https://nclexbase.com/privacy",
    coachName: "Dr. Emily Wilson",
    coachPhotoUrl: "/assets/experts/emily.jpeg",
  },
  homeLayout: {
    sections: (["schedule", "subjects", "questionTypes", "resources", "faqs"] as HomeSection[]).map((key) => ({ key, visible: true })),
    quickActions: [
      { id: "qa-create", builtin: "createTest", label: "Create Test", subtitle: "Study up to 85 questions at a time", href: "", icon: "qaCreateTest", visible: true },
      { id: "qa-warmup", builtin: "dailyWarmup", label: "Daily Warmup", subtitle: "One question emailed daily", href: "/nclex/daily-warmup", icon: "shield", visible: true },
      { id: "qa-performance", builtin: "performance", label: "Performance", subtitle: "See if you're ready to pass", href: "/nclex/performance", icon: "qaPerformance", visible: true },
      { id: "qa-readiness", builtin: "readiness", label: "CAT Readiness Exams", subtitle: "Gauge exam readiness", href: "/nclex/next-gen-readiness-exams", icon: "qaReadiness", visible: true },
      { id: "qa-previous", builtin: "previousTests", label: "Previous Tests", subtitle: "Review past test attempts", href: "/nclex/previous-tests", icon: "qaPreviousTests", visible: true },
    ],
  },
  navigation: { sections: seedNavigation() },
  freeTier: { freeQuestions: 36 },
  totals: { cases: 300, standalone: 1280, readiness: 600, performanceQuestions: 1580 },
  targets: { score: 62, usage: 85 },
  readinessBands: { high: 70, borderline: 60 },
  schedule: {
    goodMaxHours: 6,
    busyMaxHours: 9,
    goodMessage: "That's a great start!",
    busyMessage: "That's a busy schedule. You've got this!",
    heavyMessage: "Consider a later exam date to lighten your load.",
    intro: [
      { id: "intro-test", title: "Create Your First Test", minutes: 15, href: "/nclex" },
      { id: "intro-qotd", title: "Get the NCLEX Question of the Day", minutes: 15, href: "/nclex/question-of-the-day" },
      { id: "intro-guide", title: "Read the NCLEX Study Guide", minutes: 15, href: "/nclex/study-guide" },
    ],
    ngnOverview: { enabled: true, title: "(Optional) Next Gen NCLEX Overview", minutes: 30 },
    caseMinutes: 30,
    blocks: [
      { title: "35 Adult Health Standalone Questions", minutes: 75 },
      { title: "20 Child Health, 10 Pharmacology Standalone Questions", minutes: 60 },
      { title: "30 Mental Health Standalone Questions", minutes: 60 },
      { title: "20 Fundamentals Standalone Questions", minutes: 90 },
      { title: "35 Adult Health Standalone Questions", minutes: 75 },
      { title: "30 Maternal & Newborn Health Standalone Questions", minutes: 60 },
      { title: "30 Management of Care Standalone Questions", minutes: 60 },
      { title: "30 Pharmacology Standalone Questions", minutes: 60 },
    ],
    reviewEvery: 6,
    review: [
      { id: "tag", title: "30 Learning and Reviewing Tagged Questions", minutes: 60, href: "/nclex/previous-tests" },
      { id: "crash", title: "Review Crash Course Videos and Cheat Sheets", minutes: 60, href: "/nclex/crash-courses" },
    ],
    readinessMinutes: 180,
  },
  upgrade: {
    headline: "Pass the NCLEX®. Guaranteed.",
    subhead: "Trusted by 200,000+ students preparing for the NCLEX®.",
    included: [
      "2,600+ NCLEX® Questions",
      "50 NCLEX® Cases",
      "Crash Course Videos",
      "4 CAT Readiness Exams",
      "140+ Printable Cheat Sheets",
      "Memory Tricks for every subject",
      "Study Schedule Creator",
      "Ask NCLEXBase AI",
      "Pass Targets Tracker",
      "Mobile App Access",
    ],
  },
  payments: { currency: "ETB", reviewTime: "within 24 hours", telegram: { enabled: false, chatId: "" } },
  qotd: { schedule: {}, autoDays: {}, months: {}, remind: { period: "week", days: 5 }, emailSubject: "Your NCLEX Question of the Day", senderName: "NCLEXBase.com" },
  exam: {
    defaults: { textSize: 16, answerStats: true, shortcuts: false, restrictions: true, gridView: false, hoverPreview: true, timer: true },
    askAi: true,
  },
  flags: {},
  studyGuide: {
    intro: "A simple checklist of everything you need to know for the NCLEX®: every subject, system, and high-yield topic in one printable guide.",
    fileUrl: "",
    fileName: "",
  },
  // Overrides only; defaults live in lib/admin/copy.ts so new keys work without a migration.
  copy: {},
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends (infer U)[] ? U[] : T[K] extends object ? DeepPartial<T[K]> : T[K] };
export type ConfigPatch = DeepPartial<SiteConfig>;

const isObj = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);

/** Deep merge for plain objects; arrays and values in `patch` replace the defaults. */
export function mergeDeep<T>(base: T, patch: unknown): T {
  if (!isObj(base) || !isObj(patch)) return (patch === undefined ? base : (patch as T));
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) out[k] = k in base ? mergeDeep((base as Record<string, unknown>)[k], v) : v;
  return out as T;
}
