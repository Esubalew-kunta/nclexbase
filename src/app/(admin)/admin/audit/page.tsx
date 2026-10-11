"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { adminHref } from "@/lib/admin/links";
import { useAdminStore, type AuditEntry } from "@/lib/admin/store";
import { COLLECTION_LABELS, type CollectionName } from "@/lib/admin/types";
import { todayISO } from "@/lib/daily";
import { AdminPage, Badge, Btn, fmtDateTime } from "@/components/admin/ui";
import { DataTable, ListEmpty, ListToolbar, useList, type Column } from "@/components/admin/list";

const ACTIONS: AuditEntry["action"][] = ["create", "update", "publish", "unpublish", "archive", "restore", "delete", "settings", "import", "reset", "login", "logout"];
const TONE: Partial<Record<AuditEntry["action"], "success" | "warning" | "error" | "teal" | "gold" | "neutral">> = {
  create: "teal",
  publish: "success",
  unpublish: "warning",
  archive: "neutral",
  delete: "error",
  reset: "error",
  import: "gold",
  settings: "gold",
};
const entityLabel = (e: string) => (e in COLLECTION_LABELS ? `${COLLECTION_LABELS[e as CollectionName]}s` : e === "settings" ? "Settings" : e === "session" ? "Sign-in" : e);

export default function AuditAdmin() {
  const rows = useAdminStore((s) => s.audit);
  const entities = [...new Set(rows.map((r) => r.entity))];
  const list = useList<AuditEntry>({
    id: "audit",
    rows,
    search: (r) => `${r.label} ${r.summary ?? ""} ${r.by} ${r.entityId ?? ""}`,
    filters: [
      { key: "action", label: "Action", options: ACTIONS.map((a) => ({ value: a, label: a[0].toUpperCase() + a.slice(1) })), match: (r, v) => r.action === v },
      { key: "entity", label: "Area", options: entities.map((e) => ({ value: e, label: entityLabel(e) })), match: (r, v) => r.entity === v },
      {
        key: "when",
        label: "When",
        options: [
          { value: "1", label: "Today" },
          { value: "7", label: "Last 7 days" },
          { value: "30", label: "Last 30 days" },
        ],
        match: (r, v) => Date.parse(todayISO()) - Date.parse(r.at.slice(0, 10)) < Number(v) * 864e5,
      },
    ],
    sorts: { at: { label: "Time", value: (r) => r.at } },
    defaultSort: { key: "at", dir: "desc" },
    pageSize: 50,
  });
  const columns: Column<AuditEntry>[] = [
    { key: "at", label: "When", sort: "at", render: (r) => <span className="text-xs whitespace-nowrap text-muted">{fmtDateTime(r.at)}</span> },
    { key: "action", label: "Action", render: (r) => <Badge tone={TONE[r.action] ?? "neutral"}>{r.action}</Badge> },
    { key: "area", label: "Area", render: (r) => <span className="text-sm text-muted">{entityLabel(r.entity)}</span> },
    {
      key: "what",
      label: "What happened",
      render: (r) => {
        const href = r.action !== "delete" ? adminHref(r.entity, r.entityId) : null;
        return (
          <div className="max-w-xl">
            {href ? (
              <Link href={href} className="text-sm text-ink hover:text-primary hover:underline">
                {r.label}
              </Link>
            ) : (
              <span className="text-sm">{r.label}</span>
            )}
            {r.summary && <p className="text-xs text-muted">{r.summary}</p>}
          </div>
        );
      },
    },
    { key: "by", label: "By", render: (r) => <span className="text-xs text-muted">{r.by}</span> },
  ];
  const exportCsv = () => {
    const lines = list.filtered.map((r) => [r.at, r.by, r.action, r.entity, r.entityId ?? "", r.label, r.summary ?? ""].map((x) => `"${x.replace(/"/g, '""')}"`).join(","));
    const url = URL.createObjectURL(new Blob([["at,by,action,area,id,label,summary", ...lines].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `nclexbase-audit-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <AdminPage
      title="Audit Log"
      description="Every change made in the admin: who, what and when (last 800 entries)."
      actions={
        <Btn onClick={exportCsv} disabled={!list.filtered.length}>
          <Download className="size-4" />
          Export CSV
        </Btn>
      }
    >
      <ListToolbar list={list} placeholder="Search changes" />
      <DataTable list={list} columns={columns} rowId={(r) => r.id} empty={<ListEmpty list={list} noun="changes" />} />
    </AdminPage>
  );
}
