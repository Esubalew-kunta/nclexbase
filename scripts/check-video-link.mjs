// Runs the shared list of video addresses through the browser's copy of the link rules.
//
// scripts/video-links.fixture.json is a copy of the API's tests/Fixtures/video-links.json, which
// the API's own test runs through the PHP copy of the rules. If the two lists differ (when both
// repos are checked out side by side) or either copy of the rules disagrees with the list, this
// fails. Run by `npm run build`.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseVideoLink } from "../src/lib/videoLink.ts";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const fixtureText = readFileSync(here("./video-links.fixture.json"), "utf8");
const fixture = JSON.parse(fixtureText);

let bad = 0;
const fail = (msg) => {
  console.error(`check-video-link: ${msg}`);
  bad++;
};

for (const [input, provider, embed] of fixture.allowed) {
  const out = parseVideoLink(input);
  if (!out) fail(`should be allowed: ${JSON.stringify(input)}`);
  else if (out.provider !== provider || out.embedUrl !== embed || out.url !== input.trim()) fail(`wrong result for ${JSON.stringify(input)}: ${JSON.stringify(out)}`);
}
for (const input of fixture.refused) {
  if (parseVideoLink(input) !== null) fail(`should be refused: ${JSON.stringify(input)}`);
}
for (const input of [null, undefined, 42, ["https://youtu.be/dQw4w9WgXcQ"]]) {
  if (parseVideoLink(input) !== null) fail(`a non-text value was accepted: ${JSON.stringify(input)}`);
}

const api = here("../../api/tests/Fixtures/video-links.json");
if (existsSync(api) && JSON.stringify(JSON.parse(readFileSync(api, "utf8"))) !== JSON.stringify(fixture)) {
  fail("scripts/video-links.fixture.json differs from api/tests/Fixtures/video-links.json. Copy the API's file over it.");
}

if (bad) process.exit(1);
console.log(`check-video-link: ok (${fixture.allowed.length} allowed, ${fixture.refused.length} refused)`);
