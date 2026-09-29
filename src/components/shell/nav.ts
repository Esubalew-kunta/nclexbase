import {
  BookOpen,
  BriefcaseMedical,
  CalendarDays,
  ChartNoAxesColumn,
  CirclePlay,
  CircleQuestionMark,
  FileText,
  Heart,
  House,
  Lightbulb,
  MessageSquare,
  SquarePlay,
  Star,
  Stethoscope,
  Target,
  ThumbsUp,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
}

export interface NavSection {
  title?: string;
  links: NavLink[];
  /** Study section renders the Subjects accordion before its links. */
  subjects?: boolean;
}

export const NAV: NavSection[] = [
  { links: [{ label: "Home", href: "/nclex", icon: House }] },
  {
    title: "Study",
    subjects: true,
    links: [
      { label: "Case Studies", href: "/nclex/next-gen-cases", icon: BriefcaseMedical },
      { label: "Standalone Questions", href: "/nclex/next-gen-standalone", icon: Stethoscope },
      { label: "Readiness Exams", href: "/nclex/next-gen-readiness-exams", icon: Target },
      { label: "Crash Course Videos", href: "/nclex/crash-courses", icon: SquarePlay },
      { label: "Cheat Sheets", href: "/nclex/cheat-sheets", icon: FileText },
    ],
  },
  {
    title: "Review",
    links: [
      { label: "Previous Tests", href: "/nclex/previous-tests", icon: BookOpen },
      { label: "Performance", href: "/nclex/performance", icon: ChartNoAxesColumn },
      { label: "Next Gen Course", href: "/nclex/next-gen-strategy-course", icon: CirclePlay },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Study Guide", href: "https://bootcamp.com/nclex/study-guide", icon: FileText, external: true },
      { label: "Study Schedule", href: "/nclex/study-schedule", icon: CalendarDays },
      { label: "Question of the Day", href: "https://bootcamp.com/nclex/question-of-the-day", icon: Lightbulb, external: true },
      { label: "Student Reviews", href: "https://bootcamp.com/nclex/student-reviews", icon: ThumbsUp, external: true },
      { label: "Success Stories", href: "https://bootcamp.com/nclex/success-stories", icon: Star, external: true },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Study Group", href: "https://www.facebook.com/groups/", icon: Users, external: true },
      { label: "After the NCLEX", href: "https://bootcamp.com/nclex/after-the-nclex", icon: Heart, external: true },
      { label: "FAQs", href: "/nclex/faqs", icon: CircleQuestionMark },
      { label: "Contact", href: "mailto:support@example.com", icon: MessageSquare, external: true },
    ],
  },
];
