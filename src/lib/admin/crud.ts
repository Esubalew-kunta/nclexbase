"use client";

import { getAll } from "@/lib/content";
import { useAdminStore, type AuditAction } from "./store";
import { COLLECTION_LABELS, type CollectionName, type Collections, type Status } from "./types";

/*
 * Write helpers for admin screens. Every write goes through the store's `save`, which
 * stamps updatedAt, keeps the previous version for "History", and adds an audit entry.
 */

type Rec<K extends CollectionName> = Collections[K];
const idOf = (r: unknown) => (r as { id: string }).id;
const titleOf = (r: unknown): string => {
  const o = r as Record<string, unknown>;
  return String(o.title ?? o.name ?? o.question ?? o.stem ?? o.code ?? o.email ?? o.id ?? "").replace(/<[^>]+>/g, "").slice(0, 80);
};

const STATUS_ACTION: Record<Status, AuditAction> = { published: "publish", draft: "unpublish", archived: "archive" };
const VERB: Partial<Record<AuditAction, string>> = { update: "Updated", publish: "Published", unpublish: "Moved to draft", archive: "Archived", restore: "Restored", create: "Created" };

export function crud<K extends CollectionName>(col: K) {
  const store = () => useAdminStore.getState();
  const noun = COLLECTION_LABELS[col].toLowerCase();
  const current = (id: string) => getAll(col).find((r) => idOf(r) === id);

  return {
    /** Create a new record (id must be unique). */
    create(rec: Rec<K>) {
      store().save(col, [rec], { action: "create", label: `Created ${noun} “${titleOf(rec)}”` });
    },
    /** Save edits to one record. `action` lets callers log publish/unpublish instead of update. */
    update(rec: Rec<K>, action: AuditAction = "update", summary?: string) {
      const prev = current(idOf(rec));
      store().save(col, [rec], { action, label: `${VERB[action] ?? "Updated"} ${noun} “${titleOf(rec)}”`, summary, previous: [prev] });
    },
    /** Apply the same field changes to many records (bulk actions). */
    patchMany(ids: string[], patch: Partial<Rec<K>>, label: string) {
      const recs = ids.map((id) => current(id)).filter(Boolean) as Rec<K>[];
      if (!recs.length) return;
      const status = (patch as { status?: Status }).status;
      store().save(
        col,
        recs.map((r) => ({ ...r, ...patch })),
        { action: status ? STATUS_ACTION[status] : "update", label: recs.length === 1 ? `${label}: “${titleOf(recs[0])}”` : `${label} (${recs.length} ${noun}s)`, previous: recs },
      );
    },
    setStatus(ids: string[], status: Status) {
      const verb = status === "published" ? "Published" : status === "draft" ? "Moved to draft" : "Archived";
      this.patchMany(ids, { status } as unknown as Partial<Rec<K>>, verb);
    },
    /** Permanent delete. Screens only offer it for archived records. */
    hardDelete(ids: string[]) {
      const label = ids.length === 1 ? `Deleted ${noun} “${titleOf(current(ids[0]))}”` : `Deleted ${ids.length} ${noun}s`;
      store().remove(col, ids, label);
    },
    /** Put back an older version from History. */
    restore(id: string, version: Rec<K>) {
      const prev = current(id);
      store().save(col, [{ ...version, id } as Rec<K>], { action: "restore", label: `Restored an earlier version of ${noun} “${titleOf(version)}”`, previous: [prev] });
    },
    reorder(idsInOrder: string[]) {
      const recs = idsInOrder.map((id, order) => ({ ...(current(id) as object), order }) as Rec<K>).filter((r) => idOf(r));
      store().save(col, recs, { action: "update", label: `Reordered ${noun}s` });
    },
  };
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

export const today = () => new Date().toISOString().slice(0, 10);
