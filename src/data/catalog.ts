import type { Expert, Subject, SubjectId } from "@/lib/types";

export const EXPERTS: Record<string, Expert> = {
  emily: { id: "emily", name: "Dr. Emily Wilson", short: "Dr. Emily", credentials: "DNP", initials: "EW", color: "#8b6f5c" },
  amber: { id: "amber", name: "Dr. Amber", short: "Dr. Amber", credentials: "DNP", initials: "A", color: "#5c6f8b" },
  cortney: { id: "cortney", name: "Dr. Cortney Olejniczak", short: "Dr. Cortney", credentials: "DNP", initials: "CO", color: "#a0735a" },
  crysta: { id: "crysta", name: "Crysta Bliss", short: "Nurse Crysta", credentials: "MSN", initials: "CB", color: "#7a5a4f" },
  miriam: { id: "miriam", name: "Nurse Miriam", short: "Nurse Miriam", credentials: "RN", initials: "M", color: "#6a4f7a" },
};

export const SUBJECTS: Subject[] = [
  {
    id: "adult-health",
    name: "Adult Health",
    experts: ["emily", "amber"],
    questionCount: 565,
    lessonCount: 86,
    standaloneCount: 403,
    caseCount: 27,
    videoRuntime: "7h 53m",
    avgScore: 61,
    avgTimeSec: 70,
    systems: [
      { name: "Cardiovascular", count: 78 },
      { name: "Endocrine", count: 52 },
      { name: "Gastrointestinal", count: 49 },
      { name: "Hematologic / Oncologic", count: 38 },
      { name: "Immune / Infectious Disease", count: 41 },
      { name: "Musculoskeletal", count: 27 },
      { name: "Neurologic", count: 44 },
      { name: "Respiratory", count: 46 },
      { name: "Urinary & Renal", count: 28 },
    ],
  },
  {
    id: "child-health",
    name: "Child Health",
    experts: ["crysta", "miriam"],
    questionCount: 196,
    lessonCount: 46,
    standaloneCount: 142,
    caseCount: 9,
    videoRuntime: "4h 05m",
    avgScore: 56,
    avgTimeSec: 68,
    systems: [
      { name: "Growth & Development", count: 22 },
      { name: "Respiratory", count: 30 },
      { name: "Cardiovascular", count: 18 },
      { name: "Gastrointestinal", count: 24 },
      { name: "Neurologic", count: 20 },
      { name: "Immune / Infectious Disease", count: 28 },
    ],
  },
  {
    id: "fundamentals",
    name: "Fundamentals",
    experts: ["emily", "crysta"],
    questionCount: 154,
    lessonCount: 26,
    standaloneCount: 154,
    caseCount: 0,
    videoRuntime: "2h 32m",
    avgScore: 58,
    avgTimeSec: 75,
    systems: [
      { name: "Infection Control", count: 34 },
      { name: "Safety", count: 38 },
      { name: "Mobility", count: 26 },
      { name: "Nutrition", count: 22 },
      { name: "Skin Integrity", count: 34 },
    ],
  },
  {
    id: "maternal-and-newborn-health",
    name: "Maternal & Newborn Health",
    experts: ["miriam", "crysta"],
    questionCount: 212,
    lessonCount: 36,
    standaloneCount: 140,
    caseCount: 12,
    videoRuntime: "3h 05m",
    avgScore: 55,
    avgTimeSec: 82,
    systems: [
      { name: "Antepartum", count: 44 },
      { name: "Intrapartum", count: 38 },
      { name: "Postpartum", count: 30 },
      { name: "Newborn", count: 28 },
    ],
  },
  {
    id: "mental-health",
    name: "Mental Health",
    experts: ["cortney", "emily"],
    questionCount: 116,
    lessonCount: 24,
    standaloneCount: 104,
    caseCount: 2,
    videoRuntime: "2h 15m",
    avgScore: 60,
    avgTimeSec: 76,
    systems: [
      { name: "Mood Disorders", count: 30 },
      { name: "Anxiety Disorders", count: 22 },
      { name: "Psychotic Disorders", count: 20 },
      { name: "Substance Use", count: 18 },
      { name: "Therapeutic Communication", count: 14 },
    ],
  },
  {
    id: "pharmacology",
    name: "Pharmacology",
    experts: ["cortney", "emily"],
    questionCount: 177,
    lessonCount: 42,
    standaloneCount: 177,
    caseCount: 0,
    videoRuntime: "3h 41m",
    avgScore: 55,
    avgTimeSec: 62,
    systems: [
      { name: "Cardiovascular", count: 20 },
      { name: "Endocrine", count: 16 },
      { name: "Gastrointestinal", count: 11 },
      { name: "Hematologic / Oncologic", count: 5 },
      { name: "Immune", count: 13 },
      { name: "Integumentary", count: 3 },
      { name: "Musculoskeletal", count: 9 },
      { name: "Neurologic", count: 24 },
      { name: "Psychiatric", count: 21 },
      { name: "Respiratory", count: 14 },
      { name: "Anti-Infectives", count: 41 },
    ],
  },
  {
    id: "management-of-care",
    name: "Management of Care",
    experts: ["amber", "emily"],
    questionCount: 134,
    lessonCount: 12,
    standaloneCount: 134,
    caseCount: 0,
    videoRuntime: "1h 12m",
    avgScore: 63,
    avgTimeSec: 73,
    systems: [
      { name: "Prioritization", count: 42 },
      { name: "Delegation", count: 36 },
      { name: "Legal & Ethical", count: 30 },
      { name: "Advocacy", count: 26 },
    ],
  },
];

export const subjectById = (id: SubjectId) => SUBJECTS.find((s) => s.id === id)!;

export const TOTALS = {
  cases: 300,
  standalone: 1254,
  readiness: 400,
  lessons: 272,
  freeQuestions: 36,
};

export const READINESS_EXAMS = [1, 2, 3, 4].map((n) => ({
  id: `readiness-exam-${n}`,
  number: n,
  title: `Readiness Exam ${n}`,
  questions: 100,
  minutes: 200,
  free: n === 1,
}));

export const NGN_COURSE = [
  { title: "Next Gen NCLEX: The Basics", lessons: 3, runtime: "34m" },
  { title: "How to Approach a Case", lessons: 4, runtime: "35m" },
  { title: "Full Case and Question Walkthrough", lessons: 2, runtime: "45m" },
];

export const CHEAT_SHEETS: { title: string; subject: SubjectId; system: string }[] = [
  { title: "DVT & PE", subject: "adult-health", system: "Cardiovascular" },
  { title: "Diabetes", subject: "adult-health", system: "Endocrine" },
  { title: "Heart Failure", subject: "adult-health", system: "Cardiovascular" },
  { title: "Sepsis", subject: "adult-health", system: "Immune/Infectious Disease" },
  { title: "COPD", subject: "adult-health", system: "Respiratory" },
  { title: "Acute Kidney Injury", subject: "adult-health", system: "Urinary & Renal" },
  { title: "Stroke", subject: "adult-health", system: "Neurologic" },
  { title: "Asthma", subject: "child-health", system: "Respiratory" },
  { title: "Growth & Development", subject: "child-health", system: "Growth & Development" },
  { title: "Pediatric Dehydration", subject: "child-health", system: "Gastrointestinal" },
  { title: "Infection Control", subject: "fundamentals", system: "Infection Control" },
  { title: "Pressure Injuries", subject: "fundamentals", system: "Skin Integrity" },
  { title: "Fall Prevention", subject: "fundamentals", system: "Safety" },
  { title: "Delegation", subject: "management-of-care", system: "Delegation" },
  { title: "Prioritization Frameworks", subject: "management-of-care", system: "Prioritization" },
  { title: "Preeclampsia", subject: "maternal-and-newborn-health", system: "Antepartum" },
  { title: "Fetal Heart Monitoring", subject: "maternal-and-newborn-health", system: "Intrapartum" },
  { title: "Postpartum Hemorrhage (PPH)", subject: "maternal-and-newborn-health", system: "Postpartum" },
  { title: "OB Medications", subject: "maternal-and-newborn-health", system: "Antepartum" },
  { title: "Bipolar Disorder", subject: "mental-health", system: "Mood Disorders" },
  { title: "Therapeutic Communication", subject: "mental-health", system: "Therapeutic Communication" },
  { title: "Anticoagulants", subject: "pharmacology", system: "Hematologic" },
  { title: "Insulin", subject: "pharmacology", system: "Endocrine" },
  { title: "Antibiotics", subject: "pharmacology", system: "Anti-Infectives" },
];

export const CHEAT_SHEET_SYSTEMS = [
  "Cardiovascular",
  "Endocrine",
  "Gastrointestinal",
  "Immune/Infectious Disease",
  "Musculoskeletal",
  "Neurologic",
  "Respiratory",
  "Urinary & Renal",
];

/** Crash course lessons per subject (first few titles shown; rest generated). */
export const LESSON_TITLES: Record<SubjectId, string[]> = {
  "adult-health": ["Heart Failure", "Myocardial Infarction", "DVT & PE", "Sepsis", "Diabetes Mellitus", "COPD", "Acute Kidney Injury", "Stroke"],
  "child-health": ["Growth & Development", "Asthma", "Bronchiolitis", "Dehydration", "Congenital Heart Defects", "Epiglottitis"],
  fundamentals: ["Infection Control", "Fall Prevention", "Pressure Injuries", "Vital Signs", "Mobility & Transfers"],
  "maternal-and-newborn-health": ["Prenatal Care", "Preeclampsia", "Fetal Heart Monitoring", "Postpartum Hemorrhage (PPH)", "Newborn Assessment"],
  "mental-health": ["Therapeutic Communication", "Bipolar Disorder", "Schizophrenia", "Anxiety Disorders", "Substance Withdrawal"],
  pharmacology: ["Anticoagulants", "Insulin", "Cardiac Glycosides", "Antibiotics", "Psychotropics", "Opioids"],
  "management-of-care": ["Prioritization", "Delegation", "Legal & Ethical Issues", "Advocacy"],
};

export const HOME_FAQS = [
  ["What is NCLEX Bootcamp?", "NCLEX Bootcamp is a complete NCLEX® prep platform: 2,600+ Next Gen questions, case studies, crash course videos, cheat sheets, readiness exams, and a personalized study schedule."],
  ["I'm already using another NCLEX® question bank. How is NCLEX Bootcamp different?", "Every question includes a written and video explanation, linked crash course lessons, and linked cheat sheets, so you learn the concept, not just the answer."],
  ["Who made NCLEX Bootcamp?", "Our content is written by practicing nurses and nurse educators with DNP and MSN degrees."],
  ["Does NCLEX Bootcamp have a pass guarantee?", "Yes. Eligible 2 and 3 month memberships include a pass guarantee."],
  ["Can I use NCLEX Bootcamp for the NCLEX-PN®?", "Yes. Most content applies to both the RN and PN exams."],
  ["Is NCLEX Bootcamp updated for the 2026 NCLEX® test plan changes?", "Yes. Content is reviewed against the current NCSBN test plan."],
  ["Does NCLEX Bootcamp have a study guide or study schedule?", "Yes. Use the Study Schedule creator to generate a day-by-day plan to your exam date."],
  ["Where can I read student reviews for NCLEX Bootcamp?", "Visit the Student Reviews and Success Stories pages."],
  ["Do you offer a payment plan?", "Yes. You can pay in 4 installments at checkout."],
  ["How can I contact you?", "Use the Contact link in the sidebar or the chat button at the bottom right."],
  ["What do the learning, reviewing, and mastered tags do?", "Tag questions after answering them, then build tests from those pools to target your weak spots."],
  ["Can I purchase now, but activate my account later?", "Yes. Contact support and we can schedule your activation."],
  ["Can I adjust the video playback speed?", "Yes. Use the settings icon in the video player."],
] as const;

export const PERFORMANCE_FAQS = [
  ["How is my score calculated?", "Your score is the total points earned divided by total points possible, using official Next Gen NCLEX® scoring rules (0/1, +/-, and rationale scoring)."],
  ["Can I reset my score for each subject?", "Yes. Go to Account, then reset progress for any subject."],
  ["Can I reset or untag my used questions?", "Yes. Resetting a subject returns its questions to the Unused pool."],
  ["Are Case Studies and Readiness Exam included in my performance?", "Yes. Performance tracks every question attempt for case studies, standalone questions, and readiness exams."],
] as const;

export const SCHEDULE_FAQS = [
  ["Why should I use the study schedule creator?", "It turns your exam date into a day-by-day plan so you always know what to study next."],
  ["Is this the same as the PDF study schedule?", "It follows the same proven plan, but adapts to your dates and days off."],
  ["What if I fall behind or need to change something?", "Click once to rebalance the remaining days. You can change your exam date anytime."],
] as const;
