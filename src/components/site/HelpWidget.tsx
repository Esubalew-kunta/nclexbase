"use client";

import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useConfig } from "@/lib/content";

/*
 * The floating helper, bottom right of every public page: the AI tutor, and WhatsApp.
 *
 * **This is a front end only.** Nothing is sent anywhere. The composer is here so the shape of
 * the thing can be judged, and it says plainly that it is not answering yet rather than
 * pretending to think: a chat box that swallows a real question from a real student and never
 * replies is worse than no chat box, and a canned "answer" would be a lie about a product that
 * does not exist yet. Wire it to the assistant endpoint and delete `NOT_WIRED`.
 *
 * The WhatsApp button is inert until a number is set, because inventing one risks sending
 * students to a stranger's phone. Put the real number in `WHATSAPP` in international format,
 * digits only, and the button starts working.
 *
 * Why bottom right, and why one button: it is where every chat widget on the web lives, which
 * is the only reason it needs no label. It is reachable at every scroll position but stays out
 * of the way of the page's own calls to action, and it is small on a phone, because the thing
 * the visitor came to read is behind it.
 */
const NOT_WIRED = true;
const WHATSAPP = "";

export function HelpWidget() {
  const [open, setOpen] = useState(false);
  const { branding } = useConfig();

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open && (
        <div
          role="dialog"
          aria-label="Help"
          className="animate-pop-in w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-surface shadow-[0_8px_16px_rgba(7,39,42,0.08),0_28px_50px_-20px_rgba(7,39,42,0.45)] ring-1 ring-line/70"
        >
          <div className="flex items-start gap-3 bg-ink-teal px-5 py-4 text-white">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Sparkles size={17} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">Ask NCLEXBase</span>
              <span className="block text-xs text-white/60">The exam, or the app</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="-mt-1 -mr-2 flex size-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X size={17} />
            </button>
          </div>

          <div className="space-y-3 px-5 py-5">
            <p className="max-w-[16rem] rounded-2xl rounded-tl-sm bg-primary-light px-4 py-3 text-[13px] leading-5 text-ink">
              Ask about an item you got wrong, a topic you are stuck on, or the plans.
            </p>

            {NOT_WIRED && (
              <p className="rounded-xl bg-[#f6efd9] px-3.5 py-2.5 text-xs leading-5 text-[#6b5415]">
                Not switched on yet. WhatsApp or email reaches a person.
              </p>
            )}

            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 rounded-full bg-background px-2 py-1.5 ring-1 ring-line">
              <input
                disabled={NOT_WIRED}
                placeholder={NOT_WIRED ? "Coming soon" : "Type your question"}
                aria-label="Your question"
                className="min-w-0 flex-1 bg-transparent px-2.5 text-sm text-ink outline-none placeholder:text-faint disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={NOT_WIRED}
                aria-label="Send"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:bg-line disabled:text-faint"
              >
                <Send size={15} strokeWidth={2.4} />
              </button>
            </form>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-5 py-3.5 text-xs">
            {WHATSAPP ? (
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="font-bold text-[#128c7e] hover:underline">
                WhatsApp
              </a>
            ) : (
              <span className="font-bold text-faint" title="Set WHATSAPP in HelpWidget.tsx">
                WhatsApp
              </span>
            )}
            {branding.supportEmail && (
              <a href={`mailto:${branding.supportEmail}`} className="text-muted hover:text-primary">
                {branding.supportEmail}
              </a>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        {/* WhatsApp sits beside the chat button, not inside it: a student who already wants a
            person should not have to open a chat panel to find one. */}
        {WHATSAPP ? (
          <a
            href={`https://wa.me/${WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="flex size-12 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_6px_18px_-6px_rgba(7,39,42,0.5)] transition-transform duration-150 hover:scale-105 motion-reduce:transition-none"
          >
            <WhatsAppMark />
          </a>
        ) : (
          <span aria-hidden title="Set WHATSAPP in HelpWidget.tsx" className="flex size-12 items-center justify-center rounded-full bg-[#25d366]/35 text-white">
            <WhatsAppMark />
          </span>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close help" : "Ask NCLEXBase"}
          className="flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_6px_20px_-6px_rgba(7,39,42,0.6)] transition-transform duration-150 hover:scale-105 active:scale-95 motion-reduce:transition-none"
        >
          {open ? <X size={23} /> : <MessageCircle size={23} />}
        </button>
      </div>
    </div>
  );
}

/** WhatsApp's mark. Lucide carries no brand icons, and the brand is the point of the button. */
function WhatsAppMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.86 9.86 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.05-.2-.31a8.17 8.17 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23Zm-2.6 4.1c-.17 0-.46.07-.7.33-.24.26-.92.9-.92 2.18 0 1.29.94 2.53 1.07 2.7.13.18 1.82 2.78 4.42 3.9.62.26 1.1.42 1.47.54.62.2 1.18.17 1.63.1.5-.07 1.53-.62 1.75-1.23.21-.6.21-1.12.15-1.23-.07-.1-.24-.17-.5-.3-.26-.13-1.53-.76-1.77-.84-.24-.09-.41-.13-.59.13-.17.26-.67.84-.82 1.01-.15.18-.3.2-.56.07-.26-.13-1.1-.4-2.09-1.29-.77-.69-1.3-1.54-1.45-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.46.13-.15.17-.26.26-.44.09-.17.04-.33-.02-.46-.07-.13-.58-1.4-.8-1.92-.21-.5-.42-.44-.58-.44h-.5Z" />
    </svg>
  );
}
