"use client";

import { useState } from "react";
import { Download, Eye } from "lucide-react";
import { PRINT_CSS } from "@/lib/brand";
import type { FileRef } from "@/lib/admin/types";
import { useCheatSheets, useConfig, useSubjects } from "@/lib/content";
import { Icon } from "@/components/ui/Icon";
import { Button, Card, PageHeader } from "@/components/ui/primitives";
import { FileLink, PdfModal } from "@/components/ui/files";

export default function StudyGuidePage() {
  const subjects = useSubjects();
  const sheets = useCheatSheets();
  const { studyGuide } = useConfig();
  const [open, setOpen] = useState(false);
  // Admin > Study Guide can upload a PDF; otherwise the guide is generated from subjects, systems and cheat sheets.
  const file: FileRef | null = studyGuide.fileUrl ? { url: studyGuide.fileUrl, name: studyGuide.fileName || "nclex-study-guide.pdf", pages: 0, sizeKb: 0 } : null;

  const buildGuideHtml = () => {
    const sections = subjects
      .map((s) => {
        const systems = s.systems
          .filter((x) => x.visible)
          .map((x) => `<li>${x.label}</li>`)
          .join("");
        const list = sheets
          .filter((c) => c.subject === s.id)
          .map((c) => `<li>${c.title}</li>`)
          .join("");
        return `<h2>${s.name}</h2><h3>Systems to know</h3><ul>${systems}</ul>${list ? `<h3>Cheat sheet topics</h3><ul>${list}</ul>` : ""}`;
      })
      .join("");
    return `<!doctype html><html><head><meta charset="utf-8"><title>NCLEX Study Guide | NCLEXBase.com</title><style>${PRINT_CSS}</style></head><body><header class="brand"><h1>NCLEX Study Guide</h1><span>NCLEXBase.com</span></header><p>A checklist of every subject, system, and high-yield topic covered in NCLEXBase. Print it, check topics off as you study them.</p>${sections}</body></html>`;
  };

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
      <PageHeader trail={[{ label: "Study Guide" }]} title="NCLEX® Study Guide" description={studyGuide.intro} />
      <Card className="flex flex-col items-start gap-4 border border-line p-6 sm:flex-row sm:items-center">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
          <Icon name="studyGuide" size={24} />
        </span>
        <div className="flex-1">
          <h4 className="text-lg leading-[22.5px] font-semibold text-ink">NCLEX® Study Guide</h4>
          <p className="text-base leading-6 text-muted">Covers {subjects.length} subjects and every system tested on the exam. Free to download.</p>
        </div>
        {file ? (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setOpen(true)}>
              <Eye size={16} />
              <span className="ml-2">View</span>
            </Button>
            <FileLink file={file} download className="inline-flex h-[42px] items-center gap-2 rounded-[64px] bg-primary px-4 font-semibold text-white shadow-press hover:bg-primary-hover">
              <Download size={16} />
              Download
            </FileLink>
          </div>
        ) : (
          <Button onClick={download}>
            <Download size={16} />
            <span className="ml-2">Download</span>
          </Button>
        )}
      </Card>
      <PdfModal file={open ? file : null} title="NCLEX® Study Guide" onClose={() => setOpen(false)} />
    </>
  );
}
