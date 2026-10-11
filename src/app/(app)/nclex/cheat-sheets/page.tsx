import { CheatSheetBrowser } from "@/components/home/CheatSheets";
import { CopyHeader } from "@/components/ui/CopyHeader";

export default function CheatSheetsPage() {
  return (
    <>
      <CopyHeader trail={[{ label: "Cheat Sheets" }]} titleKey="sheets.title" descriptionKey="sheets.description" />
      <CheatSheetBrowser />
    </>
  );
}
