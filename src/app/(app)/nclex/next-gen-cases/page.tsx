import { CaseList } from "@/components/home/CaseList";
import { CopyHeader } from "@/components/ui/CopyHeader";

export default function CaseStudiesPage() {
  return (
    <>
      <CopyHeader trail={[{ label: "Next Gen Cases" }]} titleKey="cases.title" descriptionKey="cases.description" />
      <CaseList />
    </>
  );
}
