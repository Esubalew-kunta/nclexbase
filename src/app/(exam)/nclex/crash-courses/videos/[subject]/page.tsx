import { LESSONS, SUBJECTS } from "@/data/catalog";
import { LessonPlayer } from "@/components/exam/LessonPlayer";

export const dynamicParams = false;

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ subject: s.id }));
}

export default async function LessonPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  const s = SUBJECTS.find((x) => x.id === subject)!;
  return <LessonPlayer title={s.name} lessons={LESSONS[s.id]} base={`/nclex/crash-courses/videos/${s.id}`} back="/nclex/crash-courses" />;
}
