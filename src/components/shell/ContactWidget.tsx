"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { newId, useAdminStore } from "@/lib/admin/store";
import { useAll, useConfig } from "@/lib/content";

/** Stand-in for the live app's Intercom messenger (opened from sidebar → Contact). */
export function ContactWidget() {
  const open = useStore((s) => s.contactOpen);
  const setUi = useStore((s) => s.setUi);
  const [sent, setSent] = useState(false);
  const [text, setText] = useState("");
  const user = useStore((s) => s.user);
  const siteName = useConfig().branding.siteName;
  // Messages land in Admin > Support Inbox; replies from there show up here.
  const thread = useAll("messages").filter((m) => m.email === user.email);
  const send = () => {
    const now = new Date().toISOString();
    useAdminStore.getState().save(
      "messages",
      [{ id: newId("msg"), name: user.name || user.email.split("@")[0], email: user.email, body: text.trim(), createdAt: now, status: "open", replies: [], updatedAt: now }],
      { action: "create", label: `New support message from ${user.email}` },
    );
    setText("");
    setSent(true);
  };

  // The live app hides Intercom's launcher until "Contact" is clicked.
  if (!open) return null;
  return (
    <>
      <button
        onClick={() => setUi({ contactOpen: !open })}
        aria-label={open ? "Close messenger" : "Open messenger"}
        className="fixed right-5 bottom-5 z-40 flex size-12 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-[0_1px_6px_rgba(0,0,0,0.06),0_2px_32px_rgba(0,0,0,0.16)] transition-transform hover:scale-110"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        ) : (
          <svg viewBox="0 0 28 32" className="size-7" fill="currentColor">
            <path d="M28 32s-4.714-1.855-8.527-3.34H3.437C1.54 28.66 0 27.026 0 25.013V3.644C0 1.633 1.54 0 3.437 0h21.125c1.898 0 3.437 1.632 3.437 3.645v18.404H28V32zm-4.139-11.982a.88.88 0 00-1.292-.105c-.03.026-3.015 2.681-8.57 2.681-5.486 0-8.517-2.636-8.571-2.684a.88.88 0 00-1.29.107 1.01 1.01 0 00-.219.708.992.992 0 00.318.664c.142.128 3.537 3.15 9.762 3.15 6.226 0 9.621-3.022 9.763-3.15a.992.992 0 00.317-.664 1.01 1.01 0 00-.218-.707z" />
          </svg>
        )}
      </button>
      {open && (
        <div className="animate-pop-in fixed right-5 bottom-[84px] z-40 flex h-[520px] max-h-[calc(100dvh-104px)] w-[376px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_5px_40px_rgba(0,0,0,0.16)]">
          <div className="border-b-[3px] border-gold bg-primary px-6 pt-6 pb-8 text-white">
            <p className="text-2xl font-bold">Hi there</p>
            <p className="mt-2 text-base text-white/90">Questions about {siteName}? Send us a message and our team will reply here.</p>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-auto p-5 text-sm text-ink">
            {thread.map((m) => (
              <div key={m.id} className="flex flex-col gap-2">
                <div className="ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-primary px-3 py-2 text-white">{m.body}</div>
                {m.replies.map((r, i) => (
                  <div key={i} className="max-w-[85%] rounded-xl rounded-bl-sm bg-primary-light px-3 py-2">
                    <p className="mb-0.5 text-xs font-semibold text-primary">{r.by}</p>
                    {r.body}
                  </div>
                ))}
              </div>
            ))}
            {sent && <div className="rounded-xl border border-line p-3 text-muted">Thanks! We usually reply in a few hours.</div>}
            <textarea
              value={text}
              onChange={(e) => (setText(e.target.value), setSent(false))}
              placeholder="Write a message…"
              aria-label="Message"
              className="mt-auto h-28 w-full shrink-0 resize-none rounded-xl border border-line p-3 outline-none focus:border-primary"
            />
          </div>
          <div className="border-t border-line p-4">
            <button
              disabled={!text.trim()}
              onClick={send}
              className="h-11 w-full cursor-pointer rounded-lg bg-primary font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
