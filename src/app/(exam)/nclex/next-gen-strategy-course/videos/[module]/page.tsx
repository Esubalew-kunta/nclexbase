import { NGN_COURSE } from "@/data/catalog";
import { LessonPlayer } from "@/components/exam/LessonPlayer";

export const dynamicParams = false;

export function generateStaticParams() {
  return NGN_COURSE.map((_, i) => ({ module: String(i + 1) }));
}

export default async function NgnLessonPage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const m = NGN_COURSE[Number(module) - 1];
  const lessons = m.lessons.map((title) => ({ type: "video" as const, title, duration: "", locked: false }));
  return <LessonPlayer title={m.title} lessons={lessons} base={`/nclex/next-gen-strategy-course/videos/${module}`} back="/nclex/next-gen-strategy-course/videos" />;
}
