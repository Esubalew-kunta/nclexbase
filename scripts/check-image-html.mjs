// Checks the text edits the admin's Images box makes to a question's HTML (src/lib/admin/imageHtml.ts).
// The point of that module is that only the touched <img> changes: this proves it on awkward input.
// Run by `npm run build`.
import assert from "node:assert/strict";
import { appendImage, attr, findImages, removeImage, replaceImage, withAttr, withoutAttr } from "../src/lib/admin/imageHtml.ts";

const cases = [];
const test = (name, fn) => cases.push([name, fn]);

const A = '<img src="/assets/cases/a.png" alt="Virchow\'s triad">';
const B = "<img src='/assets/cases/b.png' alt='' width=\"300\">";

test("finds every image, in order, with src and alt", () => {
  const html = `<p>One</p><p>${A}</p><p>Two ${B} end</p>`;
  const found = findImages(html);
  assert.equal(found.length, 2);
  assert.deepEqual(found.map((i) => i.src), ["/assets/cases/a.png", "/assets/cases/b.png"]);
  assert.equal(found[0].alt, "Virchow's triad");
  assert.equal(html.slice(found[1].start, found[1].start + found[1].tag.length), B);
});

test("a > inside a quoted attribute does not end the tag", () => {
  const html = '<p><img alt="a > b" src="/x.png"></p>';
  const [img] = findImages(html);
  assert.equal(img.tag, '<img alt="a > b" src="/x.png">');
  assert.equal(img.src, "/x.png");
});

test("text without pictures has none, and other tags starting with img are not pictures", () => {
  assert.equal(findImages("<p>No picture</p><imgx src='a'>").length, 0);
});

test("replacing one picture changes those bytes and nothing else", () => {
  const html = `<p>Before</p>\n<p>${A}</p>\n<p>${B}</p>\n<ul><li>After</li></ul>`;
  const out = replaceImage(html, 1, '<img src="/assets/media/new.png" alt="">');
  assert.equal(out, html.replace(B, '<img src="/assets/media/new.png" alt="">'));
});

test("withAttr changes the value in place and adds a missing attribute", () => {
  assert.equal(withAttr(A, "src", "/new.png"), '<img src="/new.png" alt="Virchow\'s triad">');
  assert.equal(withAttr('<img src="/a.png">', "alt", 'say "hi"'), '<img src="/a.png" alt="say &quot;hi&quot;">');
  assert.equal(withAttr('<img src="/a.png" />', "alt", "x"), '<img src="/a.png" alt="x" />');
  assert.equal(attr(withAttr('<img src="/a.png">', "alt", 'say "hi" & <go>'), "alt"), 'say "hi" & <go>');
});

test("withoutAttr drops only that attribute", () => {
  assert.equal(withoutAttr(B, "width"), "<img src='/assets/cases/b.png' alt=''>");
  assert.equal(withoutAttr(B, "height"), B);
});

test("removing a picture that is alone in its paragraph removes the paragraph", () => {
  assert.equal(removeImage(`<p>Intro</p><p>${A}</p><p>Outro</p>`, 0), "<p>Intro</p><p>Outro</p>");
  assert.equal(removeImage(`<p>Intro</p>\n<p class="fig">\n  ${A}\n</p>\n<p>Outro</p>`, 0), "<p>Intro</p>\n\n<p>Outro</p>");
});

test("removing a picture from the middle of a sentence keeps the sentence", () => {
  assert.equal(removeImage(`<p>See ${A} below</p>`, 0), "<p>See  below</p>");
});

test("removing the second picture leaves the first alone", () => {
  assert.equal(removeImage(`<p>${A}</p><p>${B}</p>`, 1), `<p>${A}</p>`);
});

test("removing from the end of a figure with a caption keeps the caption", () => {
  const html = `<figure>${A}<figcaption>Triad</figcaption></figure>`;
  assert.equal(removeImage(html, 0), "<figure><figcaption>Triad</figcaption></figure>");
});

test("an index that is not there changes nothing", () => {
  assert.equal(removeImage(`<p>${A}</p>`, 3), `<p>${A}</p>`);
  assert.equal(replaceImage(`<p>${A}</p>`, 3, "<img>"), `<p>${A}</p>`);
});

test("a picture is added at the end in its own paragraph, with the address escaped", () => {
  assert.equal(appendImage("<p>Text</p>", "/assets/media/a.png"), '<p>Text</p>\n<p><img src="/assets/media/a.png" alt=""></p>');
  assert.equal(appendImage("", "/a.png", 'q"'), '<p><img src="/a.png" alt="q&quot;"></p>');
});

let failed = 0;
for (const [name, fn] of cases) {
  try {
    fn();
  } catch (e) {
    failed++;
    console.error(`check-image-html: FAILED ${name}\n${e.message}`);
  }
}
if (failed) process.exit(1);
console.log(`check-image-html: ok (${cases.length} checks)`);
