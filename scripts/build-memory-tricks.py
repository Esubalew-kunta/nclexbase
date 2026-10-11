"""Builds the seed Memory Trick PDFs and their manifest.

Writes public/assets/memory-tricks/<id>.pdf (NCLEXBase cheatsheet template: white logo strip,
deep teal title band, warm gold accent strip, black body text) and src/data/memoryTricks.json,
which the app reads. The content below is original study material written for this prototype.

Run from web/:  python scripts/build-memory-tricks.py
"""

import json
import pathlib
from datetime import date

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "assets" / "memory-tricks"
MANIFEST = ROOT / "src" / "data" / "memoryTricks.json"
MARK = ROOT / "public" / "assets" / "brand" / "nclexbase-mark-gold.png"
WORDMARK = ROOT / "public" / "assets" / "brand" / "nclexbase-wordmark.png"

TEAL, TEAL_DARK, GOLD = HexColor("#0E5A5C"), HexColor("#094448"), HexColor("#C9A34E")
PALE, LINE, MUTED, BLACK = HexColor("#E8F2F2"), HexColor("#D9E3E3"), HexColor("#647779"), HexColor("#000000")

# system=None means the trick covers the whole subject ("General").
TRICKS = [
    {
        "id": "mt-ah-heart-failure", "subject": "adult-health", "system": "Cardiovascular", "access": "free",
        "title": "Left vs Right Heart Failure", "hook": "Left = Lungs, Right = Rest of the body",
        "points": [
            ("Left-sided failure backs up into the LUNGS", "Crackles, dyspnea, orthopnea, pink frothy sputum, cough."),
            ("Right-sided failure backs up into the REST of the body", "JVD, dependent edema, weight gain, hepatomegaly, ascites."),
            ("Daily weight is the best fluid indicator", "A gain of 1 kg (2.2 lb) is roughly 1 L of retained fluid."),
        ],
        "tip": "Report a weight gain of more than 2-3 lb in a day or 5 lb in a week.",
    },
    {
        "id": "mt-ah-glucose", "subject": "adult-health", "system": "Endocrine", "access": "free",
        "title": "Hypo vs Hyperglycemia", "hook": "Cold and clammy, need some candy. Hot and dry, sugar high.",
        "points": [
            ("Hypoglycemia (cold and clammy)", "Shaky, sweaty, pale, irritable, confused, tachycardic."),
            ("Hyperglycemia (hot and dry)", "Polyuria, polydipsia, polyphagia, dry skin, fruity breath in DKA."),
            ("Rule of 15 for a conscious client", "Give 15 g fast-acting carbohydrate, recheck in 15 minutes."),
        ],
        "tip": "When in doubt and the client is symptomatic, treat as low glucose first.",
    },
    {
        "id": "mt-ah-abg", "subject": "adult-health", "system": None, "access": "premium",
        "title": "Reading ABGs with ROME", "hook": "Respiratory Opposite, Metabolic Equal",
        "points": [
            ("Respiratory Opposite", "pH and PaCO2 move in opposite directions (pH down, CO2 up = respiratory acidosis)."),
            ("Metabolic Equal", "pH and HCO3 move in the same direction (pH down, HCO3 down = metabolic acidosis)."),
            ("Normal ranges", "pH 7.35-7.45, PaCO2 35-45 mm Hg, HCO3 22-26 mEq/L."),
        ],
        "tip": "Look at pH first, then decide which value (CO2 or HCO3) explains it.",
    },
    {
        "id": "mt-ch-tof", "subject": "child-health", "system": "Cardiovascular", "access": "free",
        "title": "Tetralogy of Fallot", "hook": "Think PROVe",
        "points": [
            ("P - Pulmonary stenosis", "Narrowed outflow from the right ventricle."),
            ("R - Right ventricular hypertrophy", "The right ventricle thickens from pumping against resistance."),
            ("O - Overriding aorta", "The aorta sits over the septal defect."),
            ("Ve - Ventricular septal defect", "A hole between the ventricles lets blood shunt right to left."),
        ],
        "tip": "During a 'tet spell', place the child in a knee-chest position.",
    },
    {
        "id": "mt-ch-precautions", "subject": "child-health", "system": "Immune / Infectious Disease", "access": "premium",
        "title": "Airborne Precautions", "hook": "My Chicken Hez TB",
        "points": [
            ("My - Measles", "Rubeola spreads by airborne droplet nuclei."),
            ("Chicken - Chickenpox (varicella)", "Airborne and contact until all lesions crust over."),
            ("Hez - Herpes zoster (disseminated)", "Disseminated shingles needs airborne precautions."),
            ("TB - Tuberculosis", "Negative-pressure room and an N95 respirator."),
        ],
        "tip": "Airborne = private negative-pressure room, door closed, N95 for staff.",
    },
    {
        "id": "mt-fu-acid-base", "subject": "fundamentals", "system": "Fluid, Electrolytes, and Acid-Base Balance", "access": "free",
        "title": "Acid-Base with ROME", "hook": "Respiratory Opposite, Metabolic Equal",
        "points": [
            ("Respiratory acidosis", "pH low, PaCO2 high: hypoventilation, COPD, opioid overdose."),
            ("Respiratory alkalosis", "pH high, PaCO2 low: hyperventilation, anxiety, early sepsis."),
            ("Metabolic acidosis / alkalosis", "pH and HCO3 move together: DKA and diarrhea (acidosis), vomiting and NG suction (alkalosis)."),
        ],
        "tip": "Kussmaul respirations are the body blowing off CO2 to correct metabolic acidosis.",
    },
    {
        "id": "mt-fu-fire", "subject": "fundamentals", "system": "Safety and Infection Control", "access": "free",
        "title": "Fire Safety", "hook": "RACE, then PASS",
        "points": [
            ("R - Rescue", "Move clients in immediate danger."),
            ("A - Alarm", "Activate the alarm and call for help."),
            ("C - Contain", "Close doors and windows to confine the fire."),
            ("E - Extinguish / Evacuate", "Use the extinguisher if the fire is small, or evacuate."),
            ("PASS", "Pull the pin, Aim at the base, Squeeze the handle, Sweep side to side."),
        ],
        "tip": "Rescue always comes first.",
    },
    {
        "id": "mt-mn-fhr", "subject": "maternal-and-newborn-health", "system": "Labor & Delivery", "access": "free",
        "title": "Fetal Heart Rate Patterns", "hook": "VEAL CHOP",
        "points": [
            ("V - Variable decelerations = C - Cord compression", "Reposition the client; check for cord prolapse."),
            ("E - Early decelerations = H - Head compression", "Usually benign; keep monitoring."),
            ("A - Accelerations = O - OK", "Reassuring fetal oxygenation."),
            ("L - Late decelerations = P - Placental insufficiency", "Stop oxytocin, turn to the side, give IV fluids, notify the provider."),
        ],
        "tip": "Late decelerations are never reassuring.",
    },
    {
        "id": "mt-mn-magnesium", "subject": "maternal-and-newborn-health", "system": "Antepartum", "access": "premium",
        "title": "Magnesium Sulfate Toxicity", "hook": "Check the 'reflexes, respirations, urine' trio",
        "points": [
            ("Reflexes", "Loss of deep tendon reflexes is an early sign of toxicity."),
            ("Respirations", "Respiratory rate below 12/min is a warning sign."),
            ("Urine", "Output below 30 mL/hr lets magnesium build up."),
            ("Antidote", "Calcium gluconate at the bedside."),
        ],
        "tip": "Stop the infusion first, then notify the provider.",
    },
    {
        "id": "mt-mn-postpartum", "subject": "maternal-and-newborn-health", "system": "Postpartum", "access": "free",
        "title": "Postpartum Assessment", "hook": "BUBBLE-E",
        "points": [
            ("B - Breasts", "Soft, filling, or engorged; nipple condition."),
            ("U - Uterus", "Firm, midline fundus; boggy means massage."),
            ("B - Bladder", "A full bladder displaces the uterus and raises bleeding risk."),
            ("B - Bowel", "Bowel sounds, flatus, first stool."),
            ("L - Lochia", "Rubra, then serosa, then alba; note amount and clots."),
            ("E - Episiotomy and Emotions", "REEDA for the perineum; screen for postpartum mood changes."),
        ],
        "tip": "A uterus displaced to one side usually means a full bladder.",
    },
    {
        "id": "mt-mh-lithium", "subject": "mental-health", "system": "Mood and Personality Disorders", "access": "free",
        "title": "Lithium Safety", "hook": "Salt and water keep lithium steady",
        "points": [
            ("Therapeutic range", "About 0.6-1.2 mEq/L; levels above 1.5 mEq/L suggest toxicity."),
            ("Keep sodium and fluids steady", "Low sodium or dehydration raises lithium levels."),
            ("Early toxicity", "Nausea, vomiting, diarrhea, and a coarse hand tremor."),
        ],
        "tip": "Hold the dose and report vomiting, diarrhea, or heavy sweating.",
    },
    {
        "id": "mt-mh-communication", "subject": "mental-health", "system": "Foundations and Therapeutic Communication", "access": "premium",
        "title": "Therapeutic Communication", "hook": "Feelings first, no 'why'",
        "points": [
            ("Focus on feelings", "Reflect and clarify what the client is experiencing."),
            ("Avoid 'why' questions", "They sound judgmental and make clients defensive."),
            ("Avoid false reassurance", "'Everything will be fine' shuts the conversation down."),
        ],
        "tip": "On the exam, pick the answer that keeps the client talking about their feelings.",
    },
    {
        "id": "mt-ph-suffixes", "subject": "pharmacology", "system": "Cardiovascular", "access": "free",
        "title": "Cardiac Drug Suffixes", "hook": "Know the ending, know the class",
        "points": [
            ("-olol: beta blockers", "Check apical pulse and BP; hold for bradycardia."),
            ("-pril: ACE inhibitors", "Watch for dry cough, angioedema, and high potassium."),
            ("-sartan: ARBs", "Like ACE inhibitors but without the cough."),
            ("-dipine: calcium channel blockers", "Watch for hypotension and peripheral edema."),
        ],
        "tip": "Hold antihypertensives and report when the client is hypotensive.",
    },
    {
        "id": "mt-ph-anticoagulants", "subject": "pharmacology", "system": "Hematologic / Oncologic", "access": "premium",
        "title": "Anticoagulant Labs and Antidotes", "hook": "WarPT and HepPTT",
        "points": [
            ("Warfarin: PT / INR", "Antidote is vitamin K."),
            ("Heparin: aPTT", "Antidote is protamine sulfate."),
            ("Bleeding precautions", "Soft toothbrush, electric razor, watch for black stools and bruising."),
        ],
        "tip": "Check the right lab before each dose and report any signs of bleeding.",
    },
    {
        "id": "mt-mc-delegation", "subject": "management-of-care", "system": "Assignment and Delegation", "access": "free",
        "title": "What the RN Cannot Delegate", "hook": "You can't delegate what you EAT",
        "points": [
            ("E - Evaluate", "Evaluating a client's response stays with the RN."),
            ("A - Assess", "Initial and ongoing assessment stays with the RN."),
            ("T - Teach", "Client teaching stays with the RN."),
            ("+ Unstable clients", "Assign unstable or unpredictable clients to the RN."),
        ],
        "tip": "Stable, routine, predictable tasks can go to assistive personnel.",
    },
    {
        "id": "mt-mc-priorities", "subject": "management-of-care", "system": "Prioritization", "access": "free",
        "title": "Who Do You See First?", "hook": "ABCs, then Acute, Actual, Unstable",
        "points": [
            ("Airway, Breathing, Circulation", "Physiological threats come first."),
            ("Acute over chronic", "A new change outranks a long-standing problem."),
            ("Actual over potential", "A real problem outranks a risk."),
            ("Unstable over stable", "Unexpected findings outrank expected ones."),
        ],
        "tip": "An expected finding for the diagnosis is rarely the priority.",
    },
]

SUBJECT_NAMES = {
    "adult-health": "Adult Health", "child-health": "Child Health", "fundamentals": "Fundamentals",
    "maternal-and-newborn-health": "Maternal & Newborn Health", "mental-health": "Mental Health",
    "pharmacology": "Pharmacology", "management-of-care": "Management of Care",
}


def wrap(c, text, font, size, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = f"{cur} {w}".strip()
        if c.stringWidth(t, font, size) <= width:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur:
        lines.append(cur)
    return lines


def small(src, height):
    """Downscaled PNG copy so each PDF stays small (the source logo files are large)."""
    from PIL import Image
    im = Image.open(src)
    im = im.resize((round(im.width * height / im.height), height), Image.LANCZOS)
    buf = __import__("io").BytesIO(); im.save(buf, "PNG"); buf.seek(0)
    return ImageReader(buf)


def build(t):
    path = OUT_DIR / f"{t['id']}.pdf"
    W, H = letter
    c = canvas.Canvas(str(path), pagesize=letter)
    c.setTitle(f"{t['title']} | NCLEXBase.com Memory Trick")
    c.setAuthor("NCLEXBase.com")
    m = 48

    # White logo strip
    mark, word = small(MARK, 108), small(WORDMARK, 57)
    c.drawImage(mark, m, H - 72, width=36 * 387 / 373, height=36, mask="auto")
    c.drawImage(word, m + 44, H - 63, width=19 * 868 / 120, height=19, mask="auto")
    c.setFillColor(TEAL); c.setFont("Helvetica-Bold", 9)
    c.drawRightString(W - m, H - 58, "MEMORY TRICK")

    # Teal title band + gold accent strip
    c.setFillColor(TEAL); c.rect(0, H - 150, W, 66, stroke=0, fill=1)
    c.setFillColor(GOLD); c.rect(0, H - 156, W, 6, stroke=0, fill=1)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 24)
    c.drawString(m, H - 118, t["title"])
    sub = SUBJECT_NAMES[t["subject"]] + (f"  |  {t['system']}" if t["system"] else "  |  General")
    c.setFont("Helvetica", 11); c.drawString(m, H - 138, sub)

    # Hook box
    y = H - 200
    c.setFillColor(PALE); c.setStrokeColor(LINE); c.roundRect(m, y - 40, W - 2 * m, 56, 6, stroke=1, fill=1)
    c.setFillColor(GOLD); c.rect(m, y - 40, 5, 56, stroke=0, fill=1)
    c.setFillColor(MUTED); c.setFont("Helvetica-Bold", 8); c.drawString(m + 18, y + 2, "REMEMBER IT AS")
    c.setFillColor(BLACK); c.setFont("Helvetica-Bold", 17); c.drawString(m + 18, y - 22, t["hook"])

    # Points
    y -= 80
    for head, body in t["points"]:
        c.setFillColor(TEAL); c.circle(m + 5, y + 4, 3.5, stroke=0, fill=1)
        c.setFillColor(BLACK); c.setFont("Helvetica-Bold", 12.5)
        for ln in wrap(c, head, "Helvetica-Bold", 12.5, W - 2 * m - 20):
            c.drawString(m + 18, y, ln); y -= 16
        c.setFont("Helvetica", 11.5)
        for ln in wrap(c, body, "Helvetica", 11.5, W - 2 * m - 20):
            c.drawString(m + 18, y, ln); y -= 15
        y -= 12

    # Nurse tip
    y -= 6
    c.setStrokeColor(GOLD); c.setLineWidth(1.2); c.line(m, y, W - m, y); y -= 22
    c.setFillColor(TEAL); c.setFont("Helvetica-Bold", 10); c.drawString(m, y, "NURSE TIP"); y -= 17
    c.setFillColor(BLACK); c.setFont("Helvetica", 11.5)
    for ln in wrap(c, t["tip"], "Helvetica", 11.5, W - 2 * m):
        c.drawString(m, y, ln); y -= 15

    # Footer
    c.setFillColor(TEAL_DARK); c.rect(0, 0, W, 30, stroke=0, fill=1)
    c.setFillColor(white); c.setFont("Helvetica", 8.5)
    c.drawString(m, 11, "NCLEXBase.com  |  Memory tricks are study aids. Always follow current clinical guidelines.")
    c.setFillColor(GOLD); c.drawRightString(W - m, 11, "NCLEX® prep")
    c.showPage(); c.save()
    return path


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    today = date(2026, 10, 11).isoformat()
    manifest = []
    for order, t in enumerate(TRICKS):
        p = build(t)
        manifest.append({
            "id": t["id"], "title": t["title"], "subject": t["subject"], "system": t["system"],
            "description": t["hook"], "access": t["access"], "status": "published", "order": order,
            "file": {"url": f"/assets/memory-tricks/{p.name}", "name": p.name, "pages": 1, "sizeKb": max(1, round(p.stat().st_size / 1024))},
            "updatedAt": today,
        })
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(manifest)} PDFs and {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
