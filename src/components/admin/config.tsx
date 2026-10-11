"use client";

import { useState, type ReactNode } from "react";
import { DEFAULT_CONFIG, type SiteConfig } from "@/lib/admin/config";
import { useAdminStore } from "@/lib/admin/store";
import { useConfig } from "@/lib/content";
import { Btn, confirmDialog, Panel, sameRecord, toast, useUnsavedGuard } from "./ui";

/** Local draft of one site-config section with save / discard / reset-to-default. */
export function useConfigSection<K extends keyof SiteConfig>(key: K, label: string) {
  const saved = useConfig()[key];
  const [draft, setDraft] = useState<SiteConfig[K]>(saved);
  const [base, setBase] = useState(saved);
  // Saved value changed (our own save, import, another tab): start from it again.
  if (base !== saved) {
    setBase(saved);
    setDraft(saved);
  }
  const dirty = !sameRecord(draft, saved);
  const isDefault = sameRecord(saved, DEFAULT_CONFIG[key]);
  return {
    draft,
    setDraft,
    dirty,
    isDefault,
    save: () => {
      useAdminStore.getState().setConfig({ [key]: draft } as never, `Updated ${label}`);
      toast(`${label} saved`);
    },
    discard: () => setDraft(saved),
    resetDefault: async () => {
      if (!(await confirmDialog({ title: `Reset ${label} to the defaults?`, body: "Your custom values for this section are replaced with the original ones.", confirm: "Reset", danger: true }))) return;
      useAdminStore.getState().setConfig({ [key]: DEFAULT_CONFIG[key] } as never, `Reset ${label} to defaults`);
      toast(`${label} reset`);
    },
  };
}

/** Panel with Save / Discard / Reset actions for a config section. */
interface SectionControls {
  dirty: boolean;
  isDefault: boolean;
  save: () => void;
  discard: () => void;
  resetDefault: () => void;
}

/** `invalid` (an error message) keeps Save disabled until the draft is fixed. */
export function ConfigPanel({ section, title, description, children, invalid }: { section: SectionControls; title: string; description?: ReactNode; children: ReactNode; invalid?: string }) {
  useUnsavedGuard(section.dirty);
  return (
    <Panel
      title={title}
      description={description}
      actions={
        <div className="flex flex-wrap gap-2">
          {!section.isDefault && (
            <Btn variant="ghost" onClick={section.resetDefault}>
              Reset to default
            </Btn>
          )}
          <Btn onClick={section.discard} disabled={!section.dirty}>
            Discard
          </Btn>
          <Btn variant="primary" onClick={section.save} disabled={!section.dirty || Boolean(invalid)} title={invalid || undefined}>
            Save
          </Btn>
        </div>
      }
    >
      {children}
    </Panel>
  );
}
