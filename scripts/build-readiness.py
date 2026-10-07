"""
Builds src/data/live/readiness-exam1.json from the captured CAT Readiness Exam 1 review pages.

Inputs (local research captures, not committed):
  research/data/readiness/exam1-review-final.json  - review-mode DOM per question (answers + rationale)
  research/data/readiness/exam1.jsonl              - exam-mode DOM per question (case panels)
  research/data/readiness/results-page.txt         - results page text (subject / system per question)

Usage: python web/scripts/build-readiness.py
"""
import hashlib
import json
import re
import sys
from pathlib import Path

import lxml.html as H

ROOT = Path(__file__).resolve().parents[2]
RES = ROOT / "research" / "data" / "readiness"
OUT = ROOT / "web" / "src" / "data" / "live" / "readiness-exam1.json"

CHECK = "dce063"  # green check icon
CROSS = "f9ae09"  # red x icon

SUBJECTS = {
    "Adult Health": "adult-health",
    "Child Health": "child-health",
    "Fundamentals": "fundamentals",
    "Maternal & Newborn Health": "maternal-and-newborn-health",
    "Mental Health": "mental-health",
    "Pharmacology": "pharmacology",
    "Management of Care": "management-of-care",
}

# Dropdown / drag blanks whose correct choice is not shown in the review DOM
# (the student's pick was wrong). Resolved from the written rationale.
MANUAL = {
    37: {1: "fever and leukocytosis"},
    76: {0: "excess mucus", 1: "cystic fibrosis"},
    79: {0: "provide a high-protein diet", 1: "administer pancreatic enzyme replacement therapy (PERT)"},
}


def norm(s):
    return re.sub(r"\s+", " ", (s or "").replace("\xa0", " ")).strip()


def text(e):
    return norm(e.text_content())


def icon(e):
    """'ok' / 'x' / None for a score icon <img> inside element e."""
    img = e if e.tag == "img" else e.find(".//img")
    if img is None:
        return None
    src = img.get("src") or ""
    if not src:
        return None
    h = hashlib.md5(src.encode()).hexdigest()[:6]
    return "ok" if h == CHECK else "x" if h == CROSS else None


def clean(e):
    """Return clean inner HTML: bold/italic/underline spans become tags, styles and classes are dropped."""
    e = H.fromstring(H.tostring(e))
    for bad in e.xpath('.//script|.//iframe|.//style|.//svg|.//*[contains(@class,"videoContainer")]|.//img[contains(@class,"video-thumb")]'):
        bad.drop_tree()
    for img in e.xpath(".//img"):
        if not img.get("src") or img.get("src", "").startswith("data:"):
            img.drop_tree()
    for sp in e.xpath(".//span"):
        style = (sp.get("style") or "").replace(" ", "")
        inner = sp
        tags = []
        if "font-weight:700" in style or "font-weight:bold" in style:
            tags.append("b")
        if "font-style:italic" in style:
            tags.append("i")
        if "text-decoration:underline" in style or "text-decoration-line:underline" in style:
            tags.append("u")
        if tags:
            sp.tag = tags[0]
            for t in tags[1:]:
                wrap = H.Element(t)
                wrap.text = sp.text
                wrap.extend(list(sp))
                sp.text = None
                for c in list(sp):
                    sp.remove(c)
                sp.append(wrap)
        else:
            sp.drop_tag()
    for a in e.xpath(".//a"):
        a.drop_tag()
    for el in e.iter():
        for attr in ("style", "class", "dir", "id", "data-vimeo-id", "color", "width", "height"):
            if attr in el.attrib and not (el.tag == "img" and attr in ("width", "height")):
                del el.attrib[attr]
    html = (e.text or "") + "".join(H.tostring(c, encoding="unicode") for c in e)
    html = html.replace("\xa0", " ").replace("&#160;", " ")
    html = re.sub(r"<p>\s*<br>\s*</p>", "", html)
    html = re.sub(r"(<br>\s*){2,}", "<br>", html)
    return norm(html)


def results_breakdown():
    t = (RES / "results-page.txt").read_text(encoding="utf-8")
    t = t[t.index("Question Breakdown") :]
    out = {}
    pos = 0
    for n in range(1, 86):
        m = re.compile(rf"(?:Case Study[A-Za-z &]+?(?:\d+ / \d+)\d+m \d+s)?{n}(Adult Health|Child Health|Fundamentals|Maternal & Newborn Health|Mental Health|Pharmacology|Management of Care)").search(t, pos)
        subj = m.group(1)
        rest = t[m.end() :]
        sm = re.match(r"(.*?)(\d+ / \d+)(\d+m \d+s|\d+s|\d+m)", rest)
        out[n] = {"subject": SUBJECTS[subj], "system": sm.group(1).strip(), "pts": sm.group(2)}
        pos = m.end() + len(sm.group(0))
    return out


def stem_parts(left):
    """(lead_html, main_el) for the left side of a review layout."""
    stem = left.xpath('.//*[@id="highlightable-stem"]')
    stem = stem[0] if stem else left
    lead = None
    main = None
    for d in stem.xpath("./div"):
        if d.get("type") is None and (d.xpath('.//div[@type]') == []) and "fr-view" in (d.get("class") or ""):
            lead = d
        elif d.get("type") is not None:
            main = d
        elif lead is None and d.xpath(".//*[@type]") == [] and d.xpath(".//p"):
            lead = d
    if main is None:
        inner = [d for d in stem.xpath(".//div[@type]") if d is not stem]
        main = inner[0] if inner else None
        if lead is None:
            cands = [d for d in stem.xpath(".//div[contains(@class,'fr-view')]") if d.get("type") is None]
            lead = cands[0] if cands else None
    return stem, lead, main


def options_of(form):
    opts = []
    for sp in form.findall("span"):
        label = sp.xpath('./span[contains(@class,"fr-view")]')
        opts.append({"text": text(label[0]) if label else text(sp), "icon": icon(sp.find(".//div/img")) if sp.find(".//div/img") is not None else None, "checked": sp.find(".//input").get("checked") is not None})
    return opts


def explanation_of(expl):
    box = expl.xpath('.//*[@id="highlightable-text"]')
    if not box:
        return ""
    html = clean(box[0])
    return html


def avg_percent(expl_text):
    flat = re.sub(r"\s+", "", expl_text)
    m = re.search(r"AnsweredCorrectly(\d+)%", flat)
    if m:
        return int(m.group(1))
    m = re.search(r"AvgPointsScored([\d.]+)/(\d+)", flat)
    if m:
        return round(float(m.group(1)) / float(m.group(2)) * 100)
    return 60


def convert(rec, meta, panel_map):
    q = rec["q"]
    typ = rec["type"]
    root = H.fromstring(rec["html"])
    left, expl = root[0], root[2]
    stem, lead, main = stem_parts(left)
    out = {"q": q, "subject": meta["subject"], "system": meta["system"], "avgPercent": avg_percent(root.text_content()), "explanation": explanation_of(expl)}
    lead_txt = text(lead) if lead is not None else ""
    form = left.find(".//form")

    def question_html():
        # last fr-view inside the main block
        blocks = main.xpath('.//div[@type and contains(@class,"fr-view")]') if main is not None else []
        return clean(blocks[-1]) if blocks else ""

    if typ == "multipleChoice":
        o = options_of(form)
        out.update(type="mcq", lead=lead_txt, stem=question_html(), options=[x["text"] for x in o], answer=[i for i, x in enumerate(o) if x["icon"] == "ok"][0])
    elif typ == "multipleResponse":
        o = options_of(form)
        out.update(type="sata", lead=lead_txt, stem=question_html(), options=[x["text"] for x in o], answers=[i for i, x in enumerate(o) if x["icon"] == "ok"])
    elif typ == "multipleResponseSelectN":
        o = options_of(form)
        ans = [i for i, x in enumerate(o) if x["icon"] == "ok"]
        out.update(type="selectN", lead=lead_txt, stem=question_html(), n=len(ans), options=[x["text"] for x in o], answers=ans)
    elif typ in ("matrixMultipleChoice", "matrix"):
        block = main.xpath('.//div[@type and contains(@class,"fr-view")]')[-1]
        table = block.find(".//table")
        rows = table.findall(".//tr")
        header = [text(c) for c in rows[0].findall("td")]
        body = []
        for tr in rows[1:]:
            tds = tr.findall("td")
            body.append((text(tds[0]), [icon(td) for td in tds[1:]]))
        pre = block.xpath("./*[not(self::table)]")
        tmp = H.fromstring("<div></div>")
        for p in pre:
            if p.xpath(".//table") == []:
                tmp.append(H.fromstring(H.tostring(p)))
        stem_html = clean(tmp)
        if typ == "matrixMultipleChoice":
            out.update(type="matrix", lead=lead_txt, stem=stem_html, rowHeader=header[0], columns=header[1:], rows=[re.sub(r"^\d+\.\s*", "", r[0]) for r in body], answers=[r[1].index("ok") for r in body])
        else:
            out.update(type="matrixMulti", lead=lead_txt, stem=stem_html, rowHeader=header[0], columns=header[1:], rows=[r[0] for r in body], answers=[[i for i, x in enumerate(r[1]) if x == "ok"] for r in body])
    elif typ == "fillInTheBlank":
        m = re.search(r"Correct Answer:\s*([^\s<]+)", H.tostring(left, encoding="unicode"))
        out.update(type="fitb", lead=lead_txt, stem=question_html().replace("<br>", "").strip(), answer=m.group(1))
        out["stem"] = re.sub(r"<input[^>]*>", "", out["stem"])
    elif typ == "highlight":
        block = main.xpath('.//div[@type and contains(@class,"fr-view")]')[-1]
        spans = block.xpath('.//span[contains(@class,"fr-highlight")]')
        answers = []
        for i, sp in enumerate(spans):
            if "fr-highlight-correct" in (sp.get("class") or ""):
                answers.append(str(i))
            sp.set("data-h", str(i))
            sp.set("class", "hl")
        html = clean_keep_hl(block)
        out.update(type="highlightText", lead=lead_txt, html=html, answers=answers)
        out["stem"] = ""
    elif typ == "dragAndDropCloze":
        blocks = stem.xpath('.//p[.//span[contains(@class,"dnd-input-container")]]')
        tp = blocks[0]
        blanks = tp.xpath('.//span[contains(@class,"dnd-input-container")]')
        # draggable words: index by text
        words = []
        placed = {}
        for d in left.xpath('.//div[@data-rbd-draggable-id]'):
            if d.xpath("./ancestor::div[@data-rbd-draggable-id]"):
                continue
            w = text(d)
            ic = icon(d.find(".//img")) if d.find(".//img") is not None else None
            zone = d.xpath('./ancestor::div[@data-rbd-droppable-id]')[0].get("data-rbd-droppable-id")
            words.append({"text": w, "icon": ic, "zone": zone})
        # template: replace blanks by {k}
        for k, b in enumerate(blanks):
            tail = b.tail
            marker = H.Element("span")
            marker.text = "{%d}" % k
            marker.tail = tail
            b.getparent().replace(b, marker)
        template = text(tp)
        stem_ps = [p for p in stem.xpath(".//p") if p is not tp and text(p)]
        stem_html = "".join(f"<p>{clean(p)}</p>" for p in stem_ps)
        choices = [w["text"] for w in words]
        answers = [None] * len(blanks)
        for i, w in enumerate(words):
            if w["icon"] == "ok":
                m = re.match(r"drag-target-(\d+)-", w["zone"])
                if m:
                    answers[int(m.group(1))] = i
        loose = [i for i, w in enumerate(words) if w["icon"] == "ok" and not w["zone"].startswith("drag-target")]
        empties = [k for k, a in enumerate(answers) if a is None]
        manual = MANUAL.get(q)
        if manual:
            for k, wtxt in manual.items():
                answers[k] = choices.index(wtxt)
        else:
            if len(loose) == len(empties):
                for k, i in zip(empties, loose):
                    answers[k] = i
        assert None not in answers, (q, choices, answers)
        out.update(type="dragCloze", lead="" if lead_txt and lead_txt[:40] in template + stem_html else lead_txt, stem=stem_html, template=template, choices=choices, answers=answers)
    elif typ in ("dropdown", "dropdownRationale"):
        blocks = stem.xpath('.//p[.//select]')
        tp = blocks[0]
        sels = tp.xpath(".//select")
        blanks = []
        for k, sel in enumerate(sels):
            opts = [text(o) for o in sel.findall("option")[1:]]
            wrap = sel.getparent()
            ic = icon(wrap.find("img")) if wrap.find("img") is not None else None
            # the capture selected option 1 for every blank
            ans = 0 if ic == "ok" else None
            blanks.append({"options": opts, "answer": ans})
            marker = H.Element("span")
            marker.text = "{%d}" % k
            marker.tail = wrap.tail
            outer = wrap.getparent()
            target = outer if outer.get("class") and "dropdown-score-wrapper" in outer.get("class") else wrap
            marker.tail = target.tail
            target.getparent().replace(target, marker)
        manual = MANUAL.get(q, {})
        for k, wtxt in manual.items():
            blanks[k]["answer"] = blanks[k]["options"].index(wtxt)
        assert all(b["answer"] is not None for b in blanks), (q, blanks)
        template = text(tp)
        stem_ps = [p for p in stem.xpath(".//p") if p is not tp and text(p)]
        stem_html = "".join(f"<p>{clean(p)}</p>" for p in stem_ps)
        out.update(type="dropdown", lead="" if lead_txt and lead_txt[:40] in template + text(stem) else lead_txt, stem=stem_html, template=template, blanks=blanks)
    elif typ == "bowtie":
        groups = {0: [], 1: [], 2: []}
        for d in left.xpath('.//div[@data-rbd-draggable-id]'):
            zone = d.xpath('./ancestor::div[@data-rbd-droppable-id]')[0].get("data-rbd-droppable-id")
            g = int(re.search(r"-(\d+)$", zone).group(1))
            groups[g].append({"text": text(d), "icon": icon(d.find(".//img")), "zone": zone})
        actions = [x["text"] for x in groups[0]]
        conds = [x["text"] for x in groups[1]]
        params = [x["text"] for x in groups[2]]
        ok = lambda g: [i for i, x in enumerate(groups[g]) if x["icon"] == "ok"]
        out.update(
            type="bowtie",
            lead=lead_txt,
            stem=clean(stem.xpath(".//p")[-1]) if False else "",
            conditions=conds,
            actions=actions,
            parameters=params,
            answer={"condition": ok(1)[0], "actions": ok(0), "parameters": ok(2)},
        )
        ps = [text(p) for p in stem.xpath(".//p") if text(p)]
        out["lead"] = ps[0] if len(ps) > 1 else ""
        out["stem"] = "<p>" + ps[-1] + "</p>"
    else:
        raise SystemExit(f"unhandled type {typ} at q{q}")
    return out


def clean_keep_hl(block):
    """Like clean() but keeps span.hl[data-h] as highlightable segments."""
    block = H.fromstring(H.tostring(block))
    for bad in block.xpath(".//script|.//style|.//svg"):
        bad.drop_tree()
    for img in block.xpath(".//img"):
        img.drop_tree()
    for sp in block.xpath(".//span[not(@data-h)]"):
        style = (sp.get("style") or "").replace(" ", "")
        if "font-weight:700" in style:
            sp.tag = "b"
        else:
            sp.drop_tag()
    for el in block.iter():
        for attr in list(el.attrib):
            if attr not in ("data-h", "colspan") and not (el.tag == "span" and attr == "class" and el.get("class") == "hl"):
                del el.attrib[attr]
    html = (block.text or "") + "".join(H.tostring(c, encoding="unicode") for c in block)
    return norm(html.replace("\xa0", " "))


def case_panels():
    """Group question numbers into cases and attach tabs from exam-mode captures."""
    recs = {}
    for line in (RES / "exam1.jsonl").read_text(encoding="utf-8").splitlines():
        if line.strip():
            r = json.loads(line)
            if r.get("panel"):
                recs[r["q"]] = r
    return recs


def tabs_of(panel_html):
    p = H.fromstring(panel_html)
    contents = p.xpath('.//div[starts-with(@id,"highlightable-tab-content")]')
    first = contents[0]
    strip = first.getparent().getprevious()
    labels = [text(d) for d in strip.xpath(".//div[not(.//div)]") if text(d)]
    tabs = []
    for lab, c in zip(labels, contents):
        tabs.append({"label": lab, "html": clean(c)})
    intro_el = p.xpath('.//strong[starts-with(normalize-space(.),"Item")]')
    return tabs


def main():
    rev = json.loads((RES / "exam1-review-final.json").read_text(encoding="utf-8"))
    br = results_breakdown()
    panels = case_panels()
    groups = [(15, 20), (35, 40), (55, 60), (75, 80)]
    singles = {28: "exhibit", 64: "exhibit"}
    cases = []
    case_of = {}
    for gi, (a, b) in enumerate(groups):
        qs = [q for q in range(a, b + 1) if q in panels]
        tabs = tabs_of(panels[qs[-1]]["panel"])
        pr = H.fromstring(panels[qs[-1]]["panel"])
        intro = ""
        for p in pr.xpath('.//p[strong]/following-sibling::p[1]'):
            intro = text(p)
            break
        cases.append({"key": f"case-{gi + 1}", "intro": intro, "tabs": tabs, "subject": br[a]["subject"], "system": br[a]["system"]})
        for q in range(a, b + 1):
            case_of[q] = f"case-{gi + 1}"
    for q in singles:
        tabs = tabs_of(panels[q]["panel"])
        key = f"exhibit-{q}"
        cases.append({"key": key, "intro": "", "tabs": tabs, "subject": br[q]["subject"], "system": br[q]["system"]})
        case_of[q] = key

    items = []
    for rec in rev:
        q = rec["q"]
        it = convert(rec, br[q], panels)
        it["case"] = case_of.get(q)
        items.append(it)
    blob = json.dumps({"id": "readiness-exam-1", "cases": cases, "items": items}, ensure_ascii=False)
    # Question images are mirrored locally (public/assets/readiness) instead of hot-linking the CDN.
    img_dir = ROOT / "web" / "public" / "assets" / "readiness"
    local = {p.stem: p.name for p in img_dir.glob("*")} if img_dir.exists() else {}

    def swap(m):
        name = m.group(1)
        return f"/assets/readiness/{local[name]}" if name in local else m.group(0)

    blob = re.sub(r"https://dekni9rgkrcu0\.cloudfront\.net/questionImages/([A-Za-z0-9_-]+)", swap, blob)
    OUT.write_text(blob, encoding="utf-8")
    print("wrote", OUT, len(items), "items", len(cases), "cases")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
