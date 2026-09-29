import { SUBJECTS } from "@/data/catalog";
import type { SubjectId } from "@/lib/types";
import { SubjectHub } from "@/components/home/SubjectHub";
import { tabsFor } from "@/lib/subjectTabs";

export const dynamicParams = false;

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ subject: s.id }));
}

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  const id = subject as SubjectId;
  return <SubjectHub id={id} tab={tabsFor(id)[0]} />;
}
