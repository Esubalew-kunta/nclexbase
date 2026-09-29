// Next 16 static export writes segment prefetch payloads as nested folders
// (`__next.<group>/nclex/__PAGE__.txt`) while the client router requests the
// dotted form (`__next.<group>.nclex.__PAGE__.txt`). Plain static hosts can't
// map one to the other, so write the dotted aliases next to the folders.
import { readdirSync, statSync, copyFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = new URL("../out", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
let count = 0;

function walkFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walkFiles(p) : [p];
  });
}

function visit(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (name.startsWith("__next.")) {
      for (const file of walkFiles(p)) {
        const alias = join(dir, `${name}.${relative(p, file).split(sep).join(".")}`);
        copyFileSync(file, alias);
        count++;
      }
    } else {
      visit(p);
    }
  }
}

visit(OUT);
console.log(`flatten-export: wrote ${count} prefetch aliases`);
