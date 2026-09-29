import { PageHeader } from "@/components/ui/primitives";
import { CaseList } from "@/components/home/CaseList";

export default function CaseStudiesPage() {
  return (
    <>
      <PageHeader
        trail={[{ label: "Next Gen Cases" }]}
        title="Case Studies"
        description="The case studies below are based on the real Next Gen NCLEX. Practice with these so you're ready for the real exam."
        experts={["emily", "cortney", "crysta"]}
      />
      <CaseList />
    </>
  );
}
