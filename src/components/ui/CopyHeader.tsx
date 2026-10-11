"use client";

import type { ReactNode } from "react";
import { useCopy } from "@/lib/content";
import { PageHeader } from "./primitives";

/** PageHeader whose title/description are editable page copy (Admin > Pages & Copy). Usable from server pages. */
export function CopyHeader({ trail, titleKey, descriptionKey, children }: { trail: { label: string; href?: string }[]; titleKey: string; descriptionKey?: string; children?: ReactNode }) {
  const copy = useCopy();
  return (
    <PageHeader trail={trail} title={copy(titleKey)} description={descriptionKey ? copy(descriptionKey) : undefined}>
      {children}
    </PageHeader>
  );
}
