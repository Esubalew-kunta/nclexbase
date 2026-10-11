import { SUBJECTS } from "@/data/catalog";
import type { SubjectId } from "@/lib/types";
import { SubjectHub } from "@/components/home/SubjectHub";
import { ALL_TABS, type SubjectTab } from "@/lib/subjectTabs";

export const dynamicParams = false;

export function generateStaticParams() {
  // Every tab for every subject is generated; Admin > Subjects & Systems decides which ones show.
  return SUBJECTS.flatMap((s) => ALL_TABS.map((tab) => ({ subject: s.id, tab })));
}

export default async function SubjectTabPage({ params }: { params: Promise<{ subject: string; tab: string }> }) {
  const { subject, tab } = await params;
  return <SubjectHub id={subject as SubjectId} tab={tab as SubjectTab} />;
}
