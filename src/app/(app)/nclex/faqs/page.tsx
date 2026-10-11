import { PageHeader } from "@/components/ui/primitives";
import { PlacedFaqs } from "@/components/ui/PlacedFaqs";

export default function FaqsPage() {
  return (
    <>
      <PageHeader
        trail={[{ label: "FAQs" }]}
        title="FAQs"
        description="Don’t see your question answered here? Just send us a message by clicking the Contact link in the sidebar or click the blue chat button at the bottom-right of your screen."
      />
      <PlacedFaqs placement="home" title={null} />
    </>
  );
}
