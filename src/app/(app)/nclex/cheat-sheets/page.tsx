import { PageHeader } from "@/components/ui/primitives";
import { CheatSheetBrowser } from "@/components/home/CheatSheets";

export default function CheatSheetsPage() {
  return (
    <>
      <PageHeader
        trail={[{ label: "Cheat Sheets" }]}
        title="NCLEX Cheat Sheets"
        description="Everything you need to pass the NCLEX®, and nothing you don't. NCLEXBase's Cheat Sheets condense everything you need to know about a topic into a single, digestible resource."
      />
      <CheatSheetBrowser />
    </>
  );
}
