import { SUBJECTS } from "@/data/catalog";
import type { SubjectId } from "@/lib/types";
import { SubjectHub } from "@/components/home/SubjectHub";
import { tabsFor, type SubjectTab } from "@/lib/subjectTabs";

export const dynamicParams = false;

export function generateStaticParams() {
  // The first tab lives at /nclex/:subject, so only the remaining tabs get their own path.
  return SUBJECTS.flatMap((s) => tabsFor(s.id).slice(1).map((tab) => ({ subject: s.id, tab })));
}

export default async function SubjectTabPage({ params }: { params: Promise<{ subject: string; tab: string }> }) {
  const { subject, tab } = await params;
  return <SubjectHub id={subject as SubjectId} tab={tab as SubjectTab} />;
}
