// Fails when the admin preview, or the exam screen it shares, gains a way to save anything.
//
// The preview is trustworthy because ExamView is fed from outside: the student exam feeds it from
// the store, the preview from a local reducer. If ExamView, the preview or anything they render
// picks up a store write, a network call or a storage call, a student's score or the server could
// change because an admin tried a question. This check is run by `npm run build`.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../src/", import.meta.url));

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const slash = (p) => p.split("\\").join("/");

// Comments may talk about the store; code may not use it.
const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

// Files that must be free of anything that writes.
const strict = [
  "components/admin/ExamPreview.tsx",
  "components/exam/ExamView.tsx",
  "components/exam/ExamTools.tsx",
  ...walk(join(root, "components/exam/items")).map((p) => slash(relative(root, p))),
];

const forbidden = [
  [/import\s+(?!type\b)[^;]*from\s+["']@\/lib\/store["']/, "imports the student store (only `import type` is allowed)"],
  [/\buseStore\b/, "uses the student store"],
  [/\buseAdminStore\b/, "uses the admin store"],
  [/from\s+["']@\/lib\/api\//, "imports the API client"],
  [/from\s+["']@\/lib\/admin\/(crud|store)["']/, "imports an admin write path"],
  [/\bfetch\s*\(/, "calls fetch"],
  [/\b(localStorage|sessionStorage|indexedDB)\b/, "touches browser storage"],
];

let bad = 0;
for (const file of strict) {
  const src = strip(readFileSync(join(root, file), "utf8"));
  for (const [re, why] of forbidden) {
    if (re.test(src)) {
      console.error(`check-preview-isolated: ${file} ${why}.`);
      bad++;
    }
  }
}

// Feedback may read the signed-in student's plan, and nothing else from the store.
const fb = strip(readFileSync(join(root, "components/exam/Feedback.tsx"), "utf8"));
for (const m of fb.matchAll(/\buseStore\b[^\n;]*/g)) {
  const use = m[0];
  const isImport = /^useStore\s*\}\s*from/.test(use);
  const isPlanRead = /^useStore\(\(s\) => s\.user\.plan\)/.test(use);
  if (!isImport && !isPlanRead) {
    console.error(`check-preview-isolated: Feedback.tsx uses the store beyond reading the plan: ${use.trim()}`);
    bad++;
  }
}
if (/@\/lib\/api\//.test(fb) || /\bfetch\s*\(/.test(fb)) {
  console.error("check-preview-isolated: Feedback.tsx talks to the network.");
  bad++;
}

if (bad) process.exit(1);
console.log(`check-preview-isolated: ok (${strict.length} files, plus Feedback)`);
