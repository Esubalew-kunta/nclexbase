"use client";

import { useState } from "react";
import { CHEAT_SHEETS, CHEAT_SHEET_SYSTEMS, SUBJECTS } from "@/data/catalog";
import type { SubjectId } from "@/lib/types";
import { PageHeader } from "@/components/ui/primitives";
import { CheatSheetGrid, FilterPills } from "@/components/home/CheatSheets";

export default function CheatSheetsPage() {
  const [subject, setSubject] = useState<SubjectId | "all">("all");
  const [system, setSystem] = useState("All Systems");
  const list = CHEAT_SHEETS.filter(
    (c) => (subject === "all" || c.subject === subject) && (system === "All Systems" || c.system.startsWith(system.split("/")[0])),
  );
  return (
    <>
      <PageHeader
        trail={[{ label: "Cheat Sheets" }]}
        title="NCLEX Cheat Sheets"
        description="Everything you need to pass the NCLEX®, and nothing you don't. NCLEX Bootcamp's Cheat Sheets condense everything you need to know about a topic into a single, digestible resource."
      />
      <FilterPills
        value={subject}
        onChange={(v) => setSubject(v as SubjectId | "all")}
        options={[{ value: "all", label: "All" }, ...SUBJECTS.map((s) => ({ value: s.id, label: s.name }))]}
      />
      <FilterPills value={system} onChange={setSystem} options={["All Systems", ...CHEAT_SHEET_SYSTEMS].map((s) => ({ value: s, label: s }))} small />
      <CheatSheetGrid sheets={list} />
    </>
  );
}
