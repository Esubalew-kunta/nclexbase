"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ConfigPatch } from "./config";
import type { CollectionName, Collections } from "./types";

/*
 * Everything the admin changes, saved in this browser (localStorage key "nclexbase-admin").
 * Seed data is never copied in here: each collection keeps only created/edited records
 * and the ids that were hard-deleted. lib/content merges this over the seed.
 * Uploaded files live in IndexedDB (lib/admin/files.ts), not here.
 */

export interface CollectionPatch<T> {
  records: Record<string, T>;
  removed: Record<string, true>;
}

export type AuditAction = "create" | "update" | "publish" | "unpublish" | "archive" | "restore" | "delete" | "settings" | "import" | "reset" | "login" | "logout";

export interface AuditEntry {
  id: string;
  at: string;
  by: string;
  action: AuditAction;
  /** Collection name, or "settings". */
  entity: string;
  entityId?: string;
  label: string;
  summary?: string;
}

export interface Version {
  at: string;
  by: string;
  record: unknown;
}

export interface SavedView {
  name: string;
  query: string;
}

type Data = { [K in CollectionName]?: CollectionPatch<Collections[K]> };

interface AdminState {
  hydrated: boolean;
  session: { email: string; name: string; at: string } | null;
  /** Prototype-only credentials for the single super admin. */
  credentials: { email: string; password: string };
  data: Data;
  config: ConfigPatch;
  audit: AuditEntry[];
  /** Previous versions per record, newest first, key `${collection}:${id}`. */
  history: Record<string, Version[]>;
  savedViews: Record<string, SavedView[]>;
  /** Desktop sidebar hidden (it still slides in when the pointer touches the left edge). */
  sidebarCollapsed: boolean;
}

interface AdminActions {
  setSidebarCollapsed: (v: boolean) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setCredentials: (c: { email: string; password: string }) => void;
  save: <K extends CollectionName>(col: K, records: Collections[K][], meta: { action: AuditAction; label: string; summary?: string; previous?: (Collections[K] | undefined)[] }) => void;
  remove: <K extends CollectionName>(col: K, ids: string[], label: string) => void;
  /** Replace whole config sections (each key = one section, saved as a unit). */
  setConfig: (patch: ConfigPatch, summary: string) => void;
  saveView: (list: string, view: SavedView) => void;
  deleteView: (list: string, name: string) => void;
  importData: (data: Pick<AdminState, "data" | "config">) => void;
  resetData: () => void;
  log: (entry: Omit<AuditEntry, "id" | "at" | "by">) => void;
}

export type AdminStore = AdminState & AdminActions;

const now = () => new Date().toISOString();
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const MAX_AUDIT = 800;
const MAX_VERSIONS = 10;

const empty: Omit<AdminState, "hydrated"> = {
  session: null,
  credentials: { email: "admin@nclexbase.com", password: "admin123" },
  data: {},
  config: {},
  audit: [],
  history: {},
  savedViews: {},
  sidebarCollapsed: false,
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => {
      const by = () => get().session?.email ?? "system";
      const entry = (e: Omit<AuditEntry, "id" | "at" | "by">): AuditEntry => ({ ...e, id: uid(), at: now(), by: by() });
      const pushAudit = (audit: AuditEntry[], e: Omit<AuditEntry, "id" | "at" | "by">) => [entry(e), ...audit].slice(0, MAX_AUDIT);

      return {
        hydrated: false,
        ...empty,

        login: (email, password) => {
          const c = get().credentials;
          if (email.trim().toLowerCase() !== c.email.toLowerCase() || password !== c.password) return false;
          set((s) => ({ session: { email: c.email, name: "Super Admin", at: now() }, audit: pushAudit(s.audit, { action: "login", entity: "session", label: "Signed in" }) }));
          return true;
        },
        logout: () => set((s) => ({ audit: pushAudit(s.audit, { action: "logout", entity: "session", label: "Signed out" }), session: null })),
        setCredentials: (credentials) => set((s) => ({ credentials, audit: pushAudit(s.audit, { action: "settings", entity: "settings", label: "Admin sign-in changed" }) })),

        save: (col, records, meta) =>
          set((s) => {
            const cur = (s.data[col] ?? { records: {}, removed: {} }) as CollectionPatch<Collections[typeof col]>;
            const next = { records: { ...cur.records }, removed: { ...cur.removed } };
            const history = { ...s.history };
            const at = now();
            records.forEach((r, i) => {
              const id = (r as { id: string }).id;
              const stamped = { ...r, updatedAt: at.slice(0, 10) };
              next.records[id] = stamped;
              delete next.removed[id];
              const prev = meta.previous?.[i];
              if (prev) history[`${col}:${id}`] = [{ at, by: by(), record: prev }, ...(history[`${col}:${id}`] ?? [])].slice(0, MAX_VERSIONS);
            });
            const ids = records.map((r) => (r as { id: string }).id);
            return {
              data: { ...s.data, [col]: next },
              history,
              audit: pushAudit(s.audit, { action: meta.action, entity: col, entityId: ids.length === 1 ? ids[0] : undefined, label: meta.label, summary: meta.summary }),
            };
          }),

        remove: (col, ids, label) =>
          set((s) => {
            const cur = s.data[col] ?? { records: {}, removed: {} };
            const next = { records: { ...cur.records }, removed: { ...cur.removed } };
            for (const id of ids) {
              delete next.records[id];
              next.removed[id] = true;
            }
            return { data: { ...s.data, [col]: next }, audit: pushAudit(s.audit, { action: "delete", entity: col, entityId: ids.length === 1 ? ids[0] : undefined, label }) };
          }),

        setConfig: (patch, summary) =>
          set((s) => ({ config: { ...s.config, ...patch }, audit: pushAudit(s.audit, { action: "settings", entity: "settings", label: summary }) })),

        saveView: (list, view) =>
          set((s) => ({ savedViews: { ...s.savedViews, [list]: [...(s.savedViews[list] ?? []).filter((v) => v.name !== view.name), view] } })),
        deleteView: (list, name) => set((s) => ({ savedViews: { ...s.savedViews, [list]: (s.savedViews[list] ?? []).filter((v) => v.name !== name) } })),

        importData: ({ data, config }) =>
          set((s) => ({ data: data ?? {}, config: config ?? {}, history: {}, audit: pushAudit(s.audit, { action: "import", entity: "settings", label: "Imported admin data from JSON" }) })),
        resetData: () => set((s) => ({ data: {}, config: {}, history: {}, audit: pushAudit(s.audit, { action: "reset", entity: "settings", label: "Reset all content to the seed" }) })),

        log: (e) => set((s) => ({ audit: pushAudit(s.audit, e) })),
        setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      };
    },
    {
      name: "nclexbase-admin",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ session: s.session, credentials: s.credentials, data: s.data, config: s.config, audit: s.audit, history: s.history, savedViews: s.savedViews, sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
);

export const newId = (prefix: string) => `${prefix}-${uid()}`;
