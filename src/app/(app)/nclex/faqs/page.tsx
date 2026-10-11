import { PlacedFaqs } from "@/components/ui/PlacedFaqs";
import { CopyHeader } from "@/components/ui/CopyHeader";

export default function FaqsPage() {
  return (
    <>
      <CopyHeader trail={[{ label: "FAQs" }]} titleKey="faqs.title" descriptionKey="faqs.description" />
      <PlacedFaqs placement="home" title={null} />
    </>
  );
}
