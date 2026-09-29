import { HOME_FAQS } from "@/data/catalog";
import { FaqList, PageHeader } from "@/components/ui/primitives";

export default function FaqsPage() {
  return (
    <>
      <PageHeader
        trail={[{ label: "FAQs" }]}
        title="FAQs"
        description="Don't see your question answered here? Just send us a message by clicking the Contact link in the sidebar."
      />
      <FaqList items={HOME_FAQS} title={null} />
    </>
  );
}
