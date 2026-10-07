import { READINESS_EXAMS } from "@/data/catalog";
import { ReadinessIntro } from "./ReadinessIntro";

export const dynamicParams = false;

export function generateStaticParams() {
  return READINESS_EXAMS.map((e) => ({ examId: e.id }));
}

export default async function ReadinessIntroPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const exam = READINESS_EXAMS.find((e) => e.id === examId)!;
  return <ReadinessIntro id={exam.id} number={exam.number} title={exam.title} />;
}
