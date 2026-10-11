"use client";

import clsx from "clsx";
import { useState } from "react";
import { Send } from "lucide-react";
import { crud } from "@/lib/admin/crud";
import { useAdminStore } from "@/lib/admin/store";
import type { MessageRec } from "@/lib/admin/types";
import { useAll } from "@/lib/content";
import { AdminPage, Badge, Btn, Drawer, fmtDateTime, Segmented, TextArea, toast } from "@/components/admin/ui";
import { DataTable, ListEmpty, ListToolbar, useEditParam, useList, type Column } from "@/components/admin/list";
import { DeleteRecordButton } from "@/components/admin/parts";

const api = crud("messages");
const TONE = { open: "warning", pending: "teal", closed: "neutral" } as const;

export default function InboxAdmin() {
  const rows = useAll("messages");
  const edit = useEditParam();
  const list = useList<MessageRec>({
    id: "inbox",
    rows,
    search: (m) => `${m.name} ${m.email} ${m.body} ${m.replies.map((r) => r.body).join(" ")}`,
    filters: [
      {
        key: "status",
        label: "Status",
        options: [
          { value: "open", label: "Open (needs a reply)" },
          { value: "pending", label: "Waiting on student" },
          { value: "closed", label: "Closed" },
        ],
        match: (m, v) => m.status === v,
      },
    ],
    sorts: { received: { label: "Received", value: (m) => m.createdAt }, from: { label: "From", value: (m) => m.name } },
    defaultSort: { key: "received", dir: "desc" },
  });
  const columns: Column<MessageRec>[] = [
    {
      key: "from",
      label: "From",
      sort: "from",
      render: (m) => (
        <div>
          <p className={clsx("text-sm", m.status === "open" ? "font-semibold" : "font-medium")}>{m.name}</p>
          <p className="text-xs text-muted">{m.email}</p>
        </div>
      ),
    },
    { key: "body", label: "Message", render: (m) => <p className="line-clamp-2 max-w-xl text-sm">{m.body}</p> },
    { key: "replies", label: "Replies", render: (m) => <span className="text-sm text-muted tabular-nums">{m.replies.length}</span> },
    { key: "status", label: "Status", render: (m) => <Badge tone={TONE[m.status]}>{m.status === "pending" ? "Waiting" : m.status[0].toUpperCase() + m.status.slice(1)}</Badge> },
    { key: "received", label: "Received", sort: "received", render: (m) => <span className="text-xs text-muted">{fmtDateTime(m.createdAt)}</span> },
  ];
  const open = rows.find((m) => m.id === edit.id);
  return (
    <AdminPage title="Support Inbox" description="Messages students send from the Contact button. Replies show up in the student's chat window.">
      <ListToolbar list={list} placeholder="Search messages, names, emails" />
      <DataTable list={list} columns={columns} rowId={(m) => m.id} onRowClick={(m) => edit.open(m.id)} empty={<ListEmpty list={list} noun="messages" />} />
      {open && <Thread key={open.id} msg={open} onClose={edit.close} />}
    </AdminPage>
  );
}

function Thread({ msg, onClose }: { msg: MessageRec; onClose: () => void }) {
  const [reply, setReply] = useState("");
  const name = useAdminStore((s) => s.session?.name) ?? "Admin";
  const send = () => {
    if (!reply.trim()) return;
    api.update({ ...msg, status: "pending", replies: [...msg.replies, { by: `NCLEXBase team (${name})`, body: reply.trim(), at: new Date().toISOString() }] }, "update", "Replied");
    setReply("");
    toast("Reply sent");
  };
  return (
    <Drawer open onClose={onClose} title={`${msg.name} · ${msg.email}`} width={600}>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-muted">Status</span>
        <Segmented
          value={msg.status}
          onChange={(v) => (api.update({ ...msg, status: v }), toast(`Marked ${v}`))}
          options={[
            { value: "open", label: "Open" },
            { value: "pending", label: "Waiting" },
            { value: "closed", label: "Closed" },
          ]}
        />
        <span className="flex-1" />
        <DeleteRecordButton noun="conversation" onDelete={() => (api.hardDelete([msg.id]), onClose())} />
      </div>
      <div className="space-y-3">
        <div className="rounded-lg border border-line bg-background p-3">
          <p className="mb-1 text-xs text-muted">{fmtDateTime(msg.createdAt)}</p>
          <p className="text-sm whitespace-pre-wrap text-ink">{msg.body}</p>
        </div>
        {msg.replies.map((r, i) => (
          <div key={i} className="ml-8 rounded-lg border border-primary/25 bg-primary-light p-3">
            <p className="mb-1 text-xs text-muted">
              {r.by} · {fmtDateTime(r.at)}
            </p>
            <p className="text-sm whitespace-pre-wrap text-ink">{r.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <TextArea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Write a reply…" />
        <div className="mt-2 flex justify-between gap-2">
          <Btn onClick={() => (api.update({ ...msg, status: "closed" }), toast("Closed"), onClose())}>Close without reply</Btn>
          <Btn variant="primary" onClick={send} disabled={!reply.trim()}>
            <Send className="size-4" />
            Send reply
          </Btn>
        </div>
      </div>
    </Drawer>
  );
}
