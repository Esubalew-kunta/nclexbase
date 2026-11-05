"use client";

import { useState, useSyncExternalStore } from "react";
import { AuthLink, AuthShell, AuthSubmit } from "@/components/shell/AuthShell";

/** The address fragment, as a store: "" while the page is built (a static page has none) and on the server. */
const subscribe = (notify: () => void) => {
  window.addEventListener("hashchange", notify);
  return () => window.removeEventListener("hashchange", notify);
};
const readHash = () => window.location.hash;

/**
 * Where the "Copy code" button in a code email lands: /auth/code/#481516
 *
 * An email cannot copy anything itself (mail clients run no script), so its button opens this page,
 * which can. The code rides in the part of the address after `#`, which a browser never sends to
 * any server, so it is not in our logs and not in a referrer. It is shown only to whoever opened
 * the link, and it proves nothing on its own: the server still has to be given it.
 */
export default function CodePage() {
  const hash = useSyncExternalStore(subscribe, readHash, () => "");
  const code = decodeURIComponent(hash.slice(1)).replace(/[^\w -]/g, "").slice(0, 32);
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.replace(/\s/g, ""));
      setCopied(true);
    } catch {
      // Clipboard access can be refused (an old browser, an embedded view): leave it selectable.
      document.getSelection()?.selectAllChildren(document.getElementById("code") as Node);
    }
  };

  return (
    <AuthShell
      title={code ? "Your code" : "No code here"}
      subtitle={code ? (copied ? "Copied. Go back and paste it." : "Copy it, then go back to where you were signing in.") : "Open the Copy code button in the email again."}
      onSubmit={copy}
      footer={<AuthSubmit disabled={!code}>{copied ? "Copied" : "Copy code"}</AuthSubmit>}
    >
      {code && (
        <p id="code" className="mb-4 rounded-lg border border-line bg-primary-light px-4 py-6 text-center font-mono text-[34px] leading-10 font-bold tracking-[0.25em] text-primary select-all">
          {code}
        </p>
      )}
      <div className="-mt-2 pt-4 pb-2 text-center">
        <AuthLink href="/auth/signin">Go to log in</AuthLink>
      </div>
    </AuthShell>
  );
}
