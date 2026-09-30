"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

/** Stand-in for the live app's Intercom messenger (opened from sidebar → Contact). */
export function ContactWidget() {
  const open = useStore((s) => s.contactOpen);
  const setUi = useStore((s) => s.setUi);
  const [sent, setSent] = useState(false);
  const [text, setText] = useState("");

  // The live app hides Intercom's launcher until "Contact" is clicked.
  if (!open) return null;
  return (
    <>
      <button
        onClick={() => setUi({ contactOpen: !open })}
        aria-label={open ? "Close messenger" : "Open messenger"}
        className="fixed right-5 bottom-5 z-40 flex size-12 cursor-pointer items-center justify-center rounded-full bg-[#1f8ded] text-white shadow-[0_1px_6px_rgba(0,0,0,0.06),0_2px_32px_rgba(0,0,0,0.16)] transition-transform hover:scale-110"
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
          <div className="bg-[#1f8ded] px-6 pt-6 pb-8 text-white">
            <p className="text-2xl font-bold">Hi there 👋</p>
            <p className="mt-2 text-base text-white/90">Questions about NCLEX Bootcamp? Send us a message and our team will reply here.</p>
          </div>
          <div className="flex-1 overflow-auto p-5 text-sm text-ink">
            {sent ? (
              <div className="rounded-xl bg-[#f2f4f7] p-4">Thanks! We usually reply in a few hours. (Prototype: messages aren&apos;t sent anywhere.)</div>
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a message…"
                className="h-32 w-full resize-none rounded-xl border border-[#e3e5e8] p-3 outline-none focus:border-[#1f8ded]"
              />
            )}
          </div>
          {!sent && (
            <div className="border-t border-[#eee] p-4">
              <button
                disabled={!text.trim()}
                onClick={() => setSent(true)}
                className="h-11 w-full cursor-pointer rounded-lg bg-[#1f8ded] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
