/*
 * Finding, changing and removing the <img> tags inside a question's HTML, as plain text edits.
 *
 * The stem and the explanation are HTML written by hand or captured from a source, and they must
 * come back exactly as they went in apart from the one picture the admin touched. Parsing the
 * whole thing into a DOM and writing it back would quietly rewrite everything around it (quotes,
 * entities, tag case), so each edit here replaces or removes one <img ...> tag and nothing else.
 *
 * Plain TypeScript with no imports, so scripts/check-image-html.mjs can run it directly.
 */

export interface HtmlImage {
  /** Position among the images in this HTML, in reading order. */
  index: number;
  /** The whole tag, e.g. `<img src="/assets/cases/a.png" alt="">`. */
  tag: string;
  /** Where the tag starts in the HTML. */
  start: number;
  src: string;
  alt: string;
  /** The words that show this picture when hovered, when it is a hover picture (see `hoverLink`). */
  hoverText?: string;
}

// A tag ends at the first `>` that is not inside quotes, so `alt="a > b"` does not cut it short.
const TAG = /<img\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;

export function findImages(html: string): HtmlImage[] {
  return [...html.matchAll(TAG)].map((m, index) => {
    const start = m.index ?? 0;
    const hover = hoverLink(html, start, m[0].length);
    return { index, tag: m[0], start, src: attr(m[0], "src") ?? "", alt: attr(m[0], "alt") ?? "", ...(hover ? { hoverText: hover.text } : {}) };
  });
}

const HOVER_OPEN = /<span class="hover-link"[^>]*>/gi;
const CARD_OPEN = '<span class="hover-card">';

/**
 * A picture that appears when words are hovered sits inside them:
 * `<span class="hover-link" tabindex="0">words<span class="hover-card"><img ...></span></span>`.
 * Returns where that whole link starts and ends and the words, or null for any other picture.
 */
function hoverLink(html: string, imgStart: number, imgLength: number): { start: number; end: number; text: string } | null {
  const before = html.slice(0, imgStart);
  const after = html.slice(imgStart + imgLength);
  const closing = /^\s*<\/span>\s*<\/span>/.exec(after);
  if (!before.endsWith(CARD_OPEN) || !closing) return null;
  const cardAt = before.length - CARD_OPEN.length;
  let open: RegExpExecArray | null = null;
  for (const m of before.slice(0, cardAt).matchAll(HOVER_OPEN)) open = m;
  if (!open) return null;
  const words = before.slice(open.index + open[0].length, cardAt);
  return { start: open.index, end: imgStart + imgLength + closing[0].length, text: words.replace(/<[^>]+>/g, "").trim() };
}

/** The value of an attribute in one tag, or null when it has none. */
export function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return m ? decode(m[1] ?? m[2] ?? m[3] ?? "") : null;
}

/** The tag with this attribute set (added when missing). Other attributes keep their place and spelling. */
export function withAttr(tag: string, name: string, value: string): string {
  const pair = `${name}="${escapeAttr(value)}"`;
  const re = new RegExp(`(\\s)${name}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`, "i");
  if (re.test(tag)) return tag.replace(re, (_, space: string) => `${space}${pair}`);
  return tag.replace(/\s*\/?>$/, (end) => ` ${pair}${end.trim() === "/>" ? " />" : ">"}`);
}

/** The tag without this attribute. */
export function withoutAttr(tag: string, name: string): string {
  return tag.replace(new RegExp(`\\s${name}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`, "i"), "");
}

/** Put a new tag where image number `index` was. */
export function replaceImage(html: string, index: number, tag: string): string {
  const img = findImages(html)[index];
  return img ? html.slice(0, img.start) + tag + html.slice(img.start + img.tag.length) : html;
}

/**
 * Take image number `index` out. A paragraph or figure that held only that picture goes with it,
 * so deleting a picture does not leave an empty gap behind.
 */
export function removeImage(html: string, index: number): string {
  const img = findImages(html)[index];
  if (!img) return html;
  const end = img.start + img.tag.length;
  // A hover picture takes its link with it: the words stay, as plain text, and nothing is left to hover.
  const hover = hoverLink(html, img.start, img.tag.length);
  if (hover) {
    const open = HOVER_OPEN.exec(html.slice(hover.start));
    HOVER_OPEN.lastIndex = 0;
    const words = html.slice(hover.start + (open?.[0].length ?? 0), img.start - CARD_OPEN.length);
    return html.slice(0, hover.start) + words + html.slice(hover.end);
  }
  const before = html.slice(0, img.start);
  const after = html.slice(end);
  for (const wrapper of ["p", "figure", "div"]) {
    const open = new RegExp(`<${wrapper}(?:\\s[^>]*)?>\\s*$`, "i").exec(before);
    const close = new RegExp(`^\\s*</${wrapper}>`, "i").exec(after);
    if (open && close) return before.slice(0, open.index) + after.slice(close[0].length);
  }
  return before + after;
}

/** A picture added at the end of the HTML, in its own paragraph. */
export function appendImage(html: string, src: string, alt = ""): string {
  const tag = `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}">`;
  return `${html}${html && !html.endsWith("\n") ? "\n" : ""}<p>${tag}</p>`;
}

export function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function decode(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
