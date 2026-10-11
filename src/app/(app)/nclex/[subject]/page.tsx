import { SUBJECTS } from "@/data/catalog";
import type { SubjectId } from "@/lib/types";
import { SubjectRedirect } from "@/components/home/SubjectHub";

export const dynamicParams = false;

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ subject: s.id }));
}

/** /nclex/:subject redirects to its first visible tab, as on the live site. */
export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  return <SubjectRedirect id={subject as SubjectId} />;
}
