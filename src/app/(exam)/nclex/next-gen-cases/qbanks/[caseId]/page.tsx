import { CASE_ROWS } from "@/data/cases";
import { StartCase } from "./StartCase";

export const dynamicParams = false;

export function generateStaticParams() {
  return CASE_ROWS.map((r) => ({ caseId: r.id }));
}

export default async function CaseLaunchPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const row = CASE_ROWS.find((r) => r.id === caseId)!;
  return <StartCase caseId={caseId} subject={row.subject} title={row.title} />;
}
