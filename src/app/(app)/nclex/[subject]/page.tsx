import { SUBJECTS } from "@/data/catalog";
import type { SubjectId } from "@/lib/types";
import { tabsFor } from "@/lib/subjectTabs";
import { ClientRedirect } from "@/components/shell/ClientRedirect";

export const dynamicParams = false;

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ subject: s.id }));
}

/** /nclex/:subject redirects to its first tab, as on the live site. */
export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject } = await params;
  return <ClientRedirect to={`/nclex/${subject}/${tabsFor(subject as SubjectId)[0]}`} />;
}
