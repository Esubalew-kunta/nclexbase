import type { IconName } from "@/components/ui/Icon";

export interface NavLink {
  label: string;
  href: string;
  icon: IconName;
  external?: boolean;
  /** Opens the contact widget instead of navigating. */
  action?: "contact";
}

export interface NavSection {
  title?: string;
  links: NavLink[];
  /** Study section renders the Subjects accordion before its links. */
  subjects?: boolean;
}

export const NAV: NavSection[] = [
  { links: [{ label: "Home", href: "/nclex", icon: "home" }] },
  {
    title: "Study",
    subjects: true,
    links: [
      { label: "Case Studies", href: "/nclex/next-gen-cases", icon: "caseStudies" },
      { label: "Standalone Questions", href: "/nclex/next-gen-standalone", icon: "standalone" },
      { label: "CAT Readiness Exams", href: "/nclex/next-gen-readiness-exams", icon: "readiness" },
      { label: "Crash Course Videos", href: "/nclex/crash-courses", icon: "crashCourse" },
      { label: "Cheat Sheets", href: "/nclex/cheat-sheets", icon: "cheatSheets" },
    ],
  },
  {
    title: "Review",
    links: [
      { label: "Previous Tests", href: "/nclex/previous-tests", icon: "previousTests" },
      { label: "Performance", href: "/nclex/performance", icon: "performance" },
      { label: "Next Gen Course", href: "/nclex/next-gen-strategy-course/videos", icon: "nextGenCourse" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Study Guide", href: "/nclex/study-guide", icon: "studyGuide" },
      { label: "Study Schedule", href: "/nclex/study-schedule", icon: "studySchedule" },
      { label: "Question of the Day", href: "/nclex/question-of-the-day", icon: "questionOfDay" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "FAQs", href: "/nclex/faqs", icon: "faqs" },
      { label: "Contact", href: "#", icon: "contact", action: "contact" },
    ],
  },
];
