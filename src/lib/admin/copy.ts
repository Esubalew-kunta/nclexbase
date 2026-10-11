/*
 * Every piece of page text the admin can rewrite (Admin > Pages & Copy). Components read
 * them with useCopy(); a key without an override shows its default below.
 * To make new text editable: add an entry here and read it with copy("key").
 */

export interface CopyEntry {
  key: string;
  page: string;
  label: string;
  default: string;
  long?: boolean;
}

export const COPY: CopyEntry[] = [
  { key: "home.schedule.title", page: "Home", label: "Study Schedule heading", default: "Study Schedule" },
  { key: "home.subjects.title", page: "Home", label: "Subjects heading", default: "Study by Subject" },
  { key: "home.questionTypes.title", page: "Home", label: "Question types heading", default: "Study by Question Type" },
  { key: "home.resources.title", page: "Home", label: "Resources heading", default: "Resources" },
  { key: "home.faqs.title", page: "Home", label: "FAQs heading", default: "FAQs" },

  { key: "cases.title", page: "Case Studies", label: "Title", default: "Case Studies" },
  { key: "cases.description", page: "Case Studies", label: "Description", long: true, default: "The case studies below are based on the real Next Gen NCLEX. Practice with these so you're ready for the real exam." },

  { key: "standalone.title", page: "Standalone Questions", label: "Title", default: "Standalone Questions" },
  { key: "standalone.description", page: "Standalone Questions", label: "Description", long: true, default: "The standalone questions below are based on the real Next Gen NCLEX. Practice with these so you're ready for the real exam." },

  { key: "readiness.title", page: "Readiness Exams", label: "Title", default: "CAT Readiness Exams" },
  { key: "readiness.description", page: "Readiness Exams", label: "Description", long: true, default: "These readiness exams simulate the look, feel, and content of the real Next Gen NCLEX. Use them to gauge your readiness to pass the NCLEX!" },

  { key: "crash.title", page: "Crash Courses", label: "Title", default: "Crash Course Videos" },
  { key: "crash.description", page: "Crash Courses", label: "Description", long: true, default: "Review the most tested NCLEX concepts with our videos and bite-sized quizzes! More lessons will be added weekly!" },

  { key: "ngn.title", page: "Next Gen Course", label: "Title", default: "Next Gen Strategy Course" },
  { key: "ngn.description", page: "Next Gen Course", label: "Description", long: true, default: "Learn everything you need to know about the Next Gen NCLEX. At the end, we'll walk through a full Next Gen case together." },

  { key: "sheets.title", page: "Cheat Sheets", label: "Title", default: "NCLEX Cheat Sheets" },
  { key: "sheets.description", page: "Cheat Sheets", label: "Description", long: true, default: "Everything you need to pass the NCLEX®, and nothing you don't. NCLEXBase's Cheat Sheets condense everything you need to know about a topic into a single, digestible resource." },

  { key: "subject.casesBanner", page: "Subject pages", label: "Case Studies tab banner", long: true, default: "The case studies below are based on the real Next Gen NCLEX. Practice with these so you're ready for the real exam." },
  { key: "subject.standaloneBanner", page: "Subject pages", label: "Standalone tab banner", long: true, default: "The standalone questions below are based on the real Next Gen NCLEX. Practice with these so you're ready for the real exam." },
  { key: "subject.memoryTricksBanner", page: "Subject pages", label: "Memory Tricks tab banner", long: true, default: "Memory tricks turn high-yield facts into something you won't forget. Each one is a printable PDF filed under its system." },

  { key: "performance.title", page: "Performance", label: "Title", default: "Performance" },
  { key: "performance.description", page: "Performance", label: "Description", long: true, default: "Performance tracks every question attempt for case studies, standalone questions, and readiness exams." },
  { key: "performance.banner", page: "Performance", label: "Pass Targets message", long: true, default: "99% of NCLEXBase students who meet all targets pass the NCLEX." },

  { key: "previous.title", page: "Previous Tests", label: "Title", default: "Previous Tests" },
  { key: "review.coachGood", page: "Score report", label: "Coach message (above average)", long: true, default: "Great job! You scored above average. Keep reviewing the explanations to lock in what you learned." },
  { key: "review.coachBad", page: "Score report", label: "Coach message (below average)", long: true, default: "Keep your head up! Review these solutions carefully and learn from your mistakes. I'm confident you'll bring this score up with hard work and practice." },

  { key: "faqs.title", page: "FAQs", label: "Title", default: "FAQs" },
  { key: "faqs.description", page: "FAQs", label: "Description", long: true, default: "Don’t see your question answered here? Just send us a message by clicking the Contact link in the sidebar or the chat button at the bottom-right of your screen." },

  { key: "qotd.title", page: "Question of the Day", label: "Title", default: "NCLEX® Question of the Day" },
  { key: "warmup.title", page: "Daily Warmup", label: "Title", default: "Daily Warmup" },
  { key: "warmup.description", page: "Daily Warmup", label: "Description", long: true, default: "Get one NCLEX® question in your inbox every day. Click the link in the email to answer it and read the rationale." },

  { key: "schedule.title", page: "Study Schedule", label: "Title", default: "Your Study Schedule" },
  { key: "studyGuide.title", page: "Study Guide", label: "Title", default: "NCLEX® Study Guide" },
  { key: "account.description", page: "Account", label: "Description", long: true, default: "Thanks for being part of the NCLEXBase.com family. Edit your profile, manage your memberships, view payment history, and more on this page." },
  { key: "contact.intro", page: "Contact widget", label: "Intro text", long: true, default: "Questions about NCLEXBase.com? Send us a message and our team will reply here." },
];

export const COPY_DEFAULTS: Record<string, string> = Object.fromEntries(COPY.map((c) => [c.key, c.default]));
