"use client";

import { Send } from "lucide-react";
import { useState } from "react";

/*
 * The contact form.
 *
 * **It hands the message to the visitor's own mail app rather than posting it anywhere**, and
 * that is deliberate: the API has no contact endpoint (see `api/routes/api.php`), so a form
 * that posted would be a form that drops messages, which is worse than no form at all. A
 * `mailto:` with the fields already filled in is the honest version that works today: the
 * message really is sent, from an address the student controls, and we can reply to it.
 *
 * What it costs: a visitor with no mail app configured sees nothing happen, which is why the
 * address is printed underneath rather than hidden behind the button. When `POST /contact`
 * exists in the API, swap the handler for a fetch and delete the note; the fields and the
 * markup do not need to change.
 */
export function ContactForm({ email }: { email: string }) {
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [handedOver, setHandedOver] = useState(false);

  const ready = name.trim().length > 1 && /.+@.+\..+/.test(from) && message.trim().length > 4;

  const send = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;

    const subject = `Question from ${name.trim()}`;
    const body = `${message.trim()}\n\n---\n${name.trim()}\n${from.trim()}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setHandedOver(true);
  };

  return (
    <form onSubmit={send} className="rounded-2xl bg-surface p-5 shadow-card ring-1 ring-line/70 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            className="h-12 w-full rounded-xl bg-background px-4 text-[15px] text-ink ring-1 ring-line outline-none focus:ring-2 focus:ring-primary"
          />
        </Field>

        <Field label="Your email">
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            type="email"
            autoComplete="email"
            required
            className="h-12 w-full rounded-xl bg-background px-4 text-[15px] text-ink ring-1 ring-line outline-none focus:ring-2 focus:ring-primary"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Message">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            required
            placeholder="A plan, a payment, or a question you think is wrong"
            className="w-full resize-y rounded-xl bg-background px-4 py-3 text-[15px] leading-6 text-ink ring-1 ring-line outline-none placeholder:text-faint focus:ring-2 focus:ring-primary"
          />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <button
          type="submit"
          disabled={!ready}
          className="flex h-12 items-center gap-2.5 rounded-full bg-primary px-6 text-sm font-bold text-white shadow-press transition-[background,transform] duration-[60ms] hover:bg-primary-hover active:translate-y-[2px] active:shadow-none disabled:bg-line disabled:text-faint disabled:shadow-none"
        >
          Send
          <Send size={15} strokeWidth={2.4} />
        </button>

        <p className="text-sm text-muted">
          {handedOver ? (
            <>
              Your mail app should be open with the message in it. If nothing happened, write to{" "}
              <a href={`mailto:${email}`} className="font-semibold text-primary hover:text-primary-hover">
                {email}
              </a>
              .
            </>
          ) : (
            <>This opens your mail app with the message ready to send.</>
          )}
        </p>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}
