"use client";

import type { FaqPlacement } from "@/lib/admin/types";
import { useFaqs } from "@/lib/content";
import { FaqList } from "./primitives";

/** The FAQs the admin placed on this page (Admin > FAQs). Renders nothing when there are none. */
export function PlacedFaqs({ placement, title }: { placement: FaqPlacement; title?: string | null }) {
  const items = useFaqs(placement);
  return items.length ? <FaqList items={items} title={title} /> : null;
}
