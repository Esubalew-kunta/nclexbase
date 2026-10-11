import { NGN_COURSE, READINESS_EXAMS, SUBJECTS } from "@/data/catalog";
import { CASE_ROWS } from "@/data/cases";

/*
 * Links to content the admin can create. The site is a static export, so only seeded
 * subjects/courses/exams have their own pre-built pages (pretty URLs). Anything created in
 * the admin opens through one generic page that reads the id from the query string.
 */

const STATIC_SUBJECTS = new Set<string>(SUBJECTS.map((s) => s.id));
const STATIC_EXAMS = new Set<string>(READINESS_EXAMS.map((e) => e.id));
const STATIC_CASES = new Set<string>(CASE_ROWS.map((r) => r.id));
const STATIC_NGN = new Set<string>(NGN_COURSE.map((_, i) => `ngn-${i + 1}`));

/** Append a query parameter to a URL that may already have a query string. */
export const withParam = (href: string, key: string, value: string | number) => `${href}${href.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(String(value))}`;

export function subjectHref(id: string, tab?: string): string {
  if (STATIC_SUBJECTS.has(id)) return `/nclex/${id}${tab ? `/${tab}` : ""}`;
  return `/nclex/subject?id=${encodeURIComponent(id)}${tab ? `&tab=${tab}` : ""}`;
}

/** True when `pathname` (+ search) is somewhere inside this subject's pages. */
export function inSubject(pathname: string, search: string, id: string): boolean {
  if (STATIC_SUBJECTS.has(id)) return pathname === `/nclex/${id}` || pathname.startsWith(`/nclex/${id}/`);
  return pathname.startsWith("/nclex/subject") && new URLSearchParams(search).get("id") === id;
}

/** Lesson player for a course: subject crash courses and Next Gen modules. */
export function courseHref(id: string): string {
  if (STATIC_SUBJECTS.has(id)) return `/nclex/crash-courses/videos/${id}`;
  if (STATIC_NGN.has(id)) return `/nclex/next-gen-strategy-course/videos/${id.replace("ngn-", "")}`;
  return `/nclex/course?id=${encodeURIComponent(id)}`;
}

export function readinessHref(id: string): string {
  return STATIC_EXAMS.has(id) ? `/nclex/next-gen-readiness-exams/qbanks/${id}` : `/nclex/next-gen-readiness-exams/qbanks/start?id=${encodeURIComponent(id)}`;
}

/** Deep link that starts (or resumes) a case study. */
export function caseHref(id: string): string {
  return STATIC_CASES.has(id) ? `/nclex/next-gen-cases/qbanks/${id}` : `/nclex/next-gen-cases/qbanks/start?id=${encodeURIComponent(id)}`;
}

export const isSeededSubject = (id: string) => STATIC_SUBJECTS.has(id);
