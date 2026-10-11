import type { ExamSettings } from "@/lib/store";

/** Site-wide settings the admin controls. Stored as a partial patch over DEFAULT_CONFIG. */
export interface SiteConfig {
  branding: { siteName: string; supportEmail: string; termsUrl: string; privacyUrl: string };
  announcement: {
    enabled: boolean;
    message: string;
    linkLabel: string;
    linkHref: string;
    audience: "all" | "free" | "premium";
    tone: "info" | "premium";
    /** ISO dates (inclusive). Empty = no limit. */
    start: string;
    end: string;
  };
  home: {
    sections: Record<HomeSection, boolean>;
    quickActions: { key: QuickActionKey; visible: boolean; label: string; subtitle: string }[];
  };
  /** Sidebar links by href ("subjects" = the Subjects accordion). */
  nav: Record<string, { visible: boolean; label: string }>;
  freeTier: { freeQuestions: number };
  targets: { score: number; usage: number };
  readinessBands: { high: number; borderline: number };
  schedule: { goodMaxHours: number; busyMaxHours: number; goodMessage: string; busyMessage: string; heavyMessage: string };
  upgrade: { headline: string; subhead: string; included: string[] };
  qotd: { schedule: Record<string, string>; emailSubject: string; senderName: string };
  exam: { defaults: ExamSettings; askAi: boolean };
  flags: Record<string, boolean>;
  studyGuide: { intro: string; fileUrl: string; fileName: string };
}

export type HomeSection = "schedule" | "subjects" | "questionTypes" | "resources" | "faqs";
export type QuickActionKey = "createTest" | "dailyWarmup" | "performance" | "readiness" | "previousTests";

export const HOME_SECTION_LABELS: Record<HomeSection, string> = {
  schedule: "Study Schedule",
  subjects: "Study by Subject",
  questionTypes: "Study by Question Type",
  resources: "Resources",
  faqs: "FAQs",
};

export const DEFAULT_CONFIG: SiteConfig = {
  branding: {
    siteName: "NCLEXBase.com",
    supportEmail: "team@bootcamp.com",
    termsUrl: "https://nclexbase.com/terms",
    privacyUrl: "https://nclexbase.com/privacy",
  },
  announcement: {
    enabled: false,
    message: "New: Memory Tricks are now on every subject page.",
    linkLabel: "Take a look",
    linkHref: "/nclex/adult-health/memory-tricks",
    audience: "all",
    tone: "info",
    start: "",
    end: "",
  },
  home: {
    sections: { schedule: true, subjects: true, questionTypes: true, resources: true, faqs: true },
    quickActions: [
      { key: "createTest", visible: true, label: "Create Test", subtitle: "Study up to 85 questions at a time" },
      { key: "dailyWarmup", visible: true, label: "Daily Warmup", subtitle: "One question emailed daily" },
      { key: "performance", visible: true, label: "Performance", subtitle: "See if you're ready to pass" },
      { key: "readiness", visible: true, label: "CAT Readiness Exams", subtitle: "Gauge exam readiness" },
      { key: "previousTests", visible: true, label: "Previous Tests", subtitle: "Review past test attempts" },
    ],
  },
  nav: {},
  freeTier: { freeQuestions: 36 },
  targets: { score: 62, usage: 85 },
  readinessBands: { high: 70, borderline: 60 },
  schedule: {
    goodMaxHours: 6,
    busyMaxHours: 9,
    goodMessage: "That's a great start!",
    busyMessage: "That's a busy schedule. You've got this!",
    heavyMessage: "Consider a later exam date to lighten your load.",
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
  qotd: { schedule: {}, emailSubject: "Your NCLEX Question of the Day", senderName: "NCLEXBase.com" },
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
