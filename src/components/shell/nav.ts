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
      { label: "Readiness Exams", href: "/nclex/next-gen-readiness-exams", icon: "readiness" },
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
      { label: "Study Guide", href: "https://bootcamp.com/nclex/study-guide", icon: "studyGuide", external: true },
      { label: "Study Schedule", href: "/nclex/study-schedule", icon: "studySchedule" },
      { label: "Question of the Day", href: "https://bootcamp.com/nclex/question-of-the-day", icon: "questionOfDay", external: true },
      { label: "Student Reviews", href: "https://bootcamp.com/nclex/student-reviews", icon: "studentReviews", external: true },
      { label: "Success Stories", href: "https://bootcamp.com/nclex/success-stories", icon: "successStories", external: true },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Study Group", href: "https://www.facebook.com/groups/2169829559872032/", icon: "studyGroup", external: true },
      { label: "After the NCLEX", href: "https://bootcamp.com/nclex/after-the-nclex", icon: "afterNclex", external: true },
      { label: "FAQs", href: "/nclex/faqs", icon: "faqs" },
      { label: "Contact", href: "#", icon: "contact", action: "contact" },
    ],
  },
];

/** Product switcher in the sidebar header (emoji labels as on the live site). */
export const PRODUCTS: { label: string; items: { name: string; href: string; current?: boolean }[] }[] = [
  { label: "🦷 Dentistry", items: [{ name: "DAT Bootcamp", href: "https://bootcamp.com/dat" }, { name: "INBDE Bootcamp", href: "https://bootcamp.com/inbde" }] },
  { label: "🩺 Medical", items: [{ name: "MCAT Bootcamp", href: "https://bootcamp.com/mcat" }, { name: "Med School Bootcamp", href: "https://bootcamp.com/medschool" }] },
  { label: "⚕️ Nursing", items: [{ name: "NCLEX Bootcamp", href: "https://bootcamp.com/nclex", current: true }] },
  { label: "👓 Optometry", items: [{ name: "OAT Bootcamp", href: "https://bootcamp.com/oat" }] },
  { label: "🥽 Natural Sciences", items: [{ name: "Anatomy Bootcamp", href: "https://bootcamp.com/anatomy" }, { name: "Chemistry Bootcamp", href: "https://bootcamp.com/chemistry" }] },
];
