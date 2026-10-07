"use client";

import { Download } from "lucide-react";
import { CHEAT_SHEETS, SUBJECTS } from "@/data/catalog";
import { Icon } from "@/components/ui/Icon";
import { Button, Card, PageHeader } from "@/components/ui/primitives";

/** Builds a printable HTML copy of the study guide from the catalog (subjects, systems, cheat sheet topics). */
function buildGuideHtml(): string {
  const sections = SUBJECTS.map((s) => {
    const systems = s.systems.map((x) => `<li>${x.name}</li>`).join("");
    const sheets = CHEAT_SHEETS.filter((c) => c.subject === s.id)
      .map((c) => `<li>${c.title}</li>`)
      .join("");
    return `<h2>${s.name}</h2><h3>Systems to know</h3><ul>${systems}</ul>${sheets ? `<h3>Cheat sheet topics</h3><ul>${sheets}</ul>` : ""}`;
  }).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>NCLEX Study Guide</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1f2937}h1{color:#5f4de0}h2{margin-top:32px;border-bottom:2px solid #ededf0;padding-bottom:6px}h3{margin:16px 0 4px;font-size:15px;color:#6b7280;text-transform:uppercase}li{margin:2px 0}</style></head><body><h1>NCLEX Study Guide</h1><p>A checklist of every subject, system, and high-yield topic covered in NCLEX Bootcamp. Print it, check topics off as you study them.</p>${sections}</body></html>`;
}

export default function StudyGuidePage() {
  const download = () => {
    const url = URL.createObjectURL(new Blob([buildGuideHtml()], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "nclex-study-guide.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        trail={[{ label: "Study Guide" }]}
        title="NCLEX® Study Guide"
        description="A simple checklist of everything you need to know for the NCLEX®: every subject, system, and high-yield topic in one printable guide."
      />
      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#f0eefe] text-brand">
          <Icon name="studyGuide" size={24} />
        </span>
        <div className="flex-1">
          <h4 className="text-lg leading-[22.5px] font-semibold text-ink">NCLEX® Study Guide</h4>
          <p className="text-base leading-6 text-muted">Covers {SUBJECTS.length} subjects and every system tested on the exam. Free to download.</p>
        </div>
        <Button onClick={download}>
          <Download size={16} />
          <span className="ml-2">Download</span>
        </Button>
      </Card>
    </>
  );
}
