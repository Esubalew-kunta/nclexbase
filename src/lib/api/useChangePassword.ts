"use client";

import { useState } from "react";
import { changePassword } from "@/lib/api/auth";

/*
 * The state behind both "Change password" forms (the student's profile and the admin's
 * settings), so the rules and the wording live in one place and the two screens only differ
 * in how they look.
 */

export const MIN_LENGTH = 8;

export function useChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  // The server's own field errors, shown under the field they belong to.
  const [fields, setFields] = useState<Record<string, string>>({});

  // What can be said before asking the server. Shown only once the person has typed something.
  const hint =
    next && next.length < MIN_LENGTH
      ? `Use at least ${MIN_LENGTH} characters.`
      : repeat && next !== repeat
        ? "The two new passwords do not match."
        : next && next === current
          ? "Choose a password different from the current one."
          : "";
  const ready = Boolean(current && next && repeat) && !hint && !busy;

  async function submit() {
    if (!ready) return;
    setBusy(true);
    setError("");
    setFields({});
    setDone(false);
    const res = await changePassword(current, next, repeat);
    setBusy(false);
    if (res.ok) {
      setCurrent("");
      setNext("");
      setRepeat("");
      setDone(true);
      return;
    }
    const first: Record<string, string> = {};
    for (const [k, v] of Object.entries(res.errors ?? {})) first[k] = v[0];
    setFields(first);
    // A field error says it better than the envelope's generic message.
    setError(Object.keys(first).length ? "" : (res.message ?? "The password could not be changed."));
  }

  return { current, setCurrent, next, setNext, repeat, setRepeat, busy, done, error, fields, hint, ready, submit };
}
