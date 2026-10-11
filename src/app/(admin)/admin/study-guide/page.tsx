"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useCheatSheets, useSubjects } from "@/lib/content";
import { AdminPage, Field, TextArea } from "@/components/admin/ui";
import { ConfigPanel, useConfigSection } from "@/components/admin/config";
import { FileDrop } from "@/components/admin/parts";

export default function StudyGuideAdmin() {
  const s = useConfigSection("studyGuide", "Study Guide");
  const subjects = useSubjects();
  const sheets = useCheatSheets();
  const d = s.draft;
  return (
    <AdminPage
      title="Study Guide"
      description="The downloadable study guide page. Without an uploaded PDF, students get a checklist generated from the visible subjects, their systems and published cheat sheets."
      actions={
        <Link href="/nclex/study-guide" target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-primary hover:bg-primary-light">
          <ExternalLink className="size-4" />
          View page
        </Link>
      }
    >
      <ConfigPanel section={s} title="Study Guide page">
        <div className="space-y-4">
          <Field label="Intro text" hint="Shown under the page title.">
            <TextArea value={d.intro} onChange={(e) => s.setDraft({ ...d, intro: e.target.value })} rows={3} />
          </Field>
          <Field label="Guide PDF (optional)" hint="Upload a designed PDF to replace the generated checklist.">
            <FileDrop
              value={d.fileUrl ? { url: d.fileUrl, name: d.fileName || "study-guide.pdf", pages: 0, sizeKb: 0 } : null}
              onChange={(f) => s.setDraft({ ...d, fileUrl: f?.url ?? "", fileName: f?.name ?? "" })}
            />
          </Field>
          {!d.fileUrl && (
            <p className="rounded-md border border-line bg-background px-3 py-2 text-sm text-muted">
              Generated checklist currently covers {subjects.length} subjects, {subjects.reduce((a, x) => a + x.systems.filter((y) => y.visible).length, 0)} systems and {sheets.length} cheat sheet topics.
            </p>
          )}
        </div>
      </ConfigPanel>
    </AdminPage>
  );
}
