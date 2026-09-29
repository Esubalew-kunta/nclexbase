import type { CaseStudy } from "@/lib/types";

/*
 * Original NCLEX-style mock content written for this prototype.
 * It is not copied from the production question bank.
 */

export const CASES: CaseStudy[] = [
  /* ---------------------------------------------------------------- */
  {
    id: "next-gen-case-1",
    title: "Case Study: Adult Health #1",
    subject: "adult-health",
    intro: "The nurse is caring for a 68-year-old client in the emergency department.",
    tabs: [
      {
        label: "Nurses' Notes",
        content: {
          kind: "notes",
          heading: "Emergency Department",
          entries: [
            {
              time: "1400",
              html: "The client is brought in by their daughter for 3 days of productive cough with rust-colored sputum, fever, and new confusion since this morning. The daughter reports the client has &ldquo;barely eaten or had anything to drink&rdquo; for 2 days. The client is oriented to person only and is restless. Skin is warm and flushed; capillary refill is 4 seconds. Crackles are auscultated in the right lower lobe. The client last voided this morning, a small amount of dark urine.",
            },
          ],
        },
      },
      {
        label: "History and Physical",
        content: {
          kind: "text",
          html: "<p><b>Medical history:</b> type 2 diabetes mellitus (metformin 1,000 mg twice daily), hypertension (lisinopril 20 mg daily). Former smoker, 30 pack-years; quit 5 years ago.</p><p><b>Social:</b> lives with daughter; independent with activities of daily living at baseline.</p><p><b>Allergies:</b> no known drug allergies.</p>",
        },
      },
      {
        label: "Vital Signs",
        content: {
          kind: "table",
          headers: ["", "1400"],
          rows: [
            ["T", "102.4 F (39.1 C)"],
            ["P", "118"],
            ["RR", "28"],
            ["BP", "88/50 (MAP 63)"],
            ["Pulse oximetry reading", "89% on room air"],
            ["Pain", "3/10 chest pain with coughing"],
          ],
        },
      },
      {
        label: "Laboratory Results",
        content: {
          kind: "table",
          headers: ["Laboratory Test", "Reference Range", "1415"],
          rows: [
            ["White blood cell count", "5,000–10,000/mm³", "18,500/mm³"],
            ["Lactate", "0.5–2.2 mmol/L", "4.2 mmol/L"],
            ["Glucose", "70–110 mg/dL", "248 mg/dL"],
            ["Creatinine", "0.6–1.2 mg/dL", "1.9 mg/dL"],
            ["Sodium", "135–145 mEq/L", "147 mEq/L"],
            ["Procalcitonin", "< 0.5 ng/mL", "3.1 ng/mL"],
          ],
        },
      },
    ],
    items: [
      {
        id: "c1-i1",
        type: "highlight",
        subject: "adult-health",
        system: "Immune / Infectious Disease",
        topic: "Sepsis",
        stem: "Click to highlight the findings that require <b>immediate</b> follow-up by the nurse.",
        headers: ["Body System", "Findings"],
        rows: [
          { label: "Neurological", segments: ["Oriented to person only;", "pupils equal and reactive to light"] },
          { label: "Respiratory", segments: ["crackles in right lower lobe;", "pulse oximetry 89% on room air"] },
          { label: "Cardiovascular", segments: ["heart rate 118/min;", "blood pressure 88/50 mm Hg;", "capillary refill 4 seconds"] },
          { label: "Renal", segments: ["small amount of dark urine this morning;", "denies dysuria"] },
          { label: "Integumentary", segments: ["skin warm and flushed;", "no pressure injuries noted"] },
          { label: "Psychosocial", segments: ["lives with daughter;", "former smoker"] },
        ],
        answers: ["0-0", "1-1", "2-0", "2-1", "2-2", "3-0", "4-0"],
        avgPercent: 64,
        linkedVideo: "Sepsis",
        linkedSheet: "Sepsis",
        rationale: {
          explanation:
            "<p>This client shows signs of <b>sepsis with hypoperfusion</b>. New confusion, hypoxemia, tachycardia, hypotension, delayed capillary refill, and low urine output all point to poor tissue perfusion and need immediate follow-up.</p><p>Warm, flushed skin is typical of early (warm) septic shock, when widespread vasodilation lowers systemic vascular resistance.</p><p>Crackles in the right lower lobe are expected with pneumonia. They should be monitored but are not the most urgent finding here.</p>",
          takeaway: [
            "Acute confusion, hypotension, tachycardia, and low urine output in a client with infection signal sepsis-induced hypoperfusion.",
          ],
        },
      },
      {
        id: "c1-i2",
        type: "matrix",
        subject: "adult-health",
        system: "Immune / Infectious Disease",
        topic: "Sepsis",
        stem: "For each finding, click to specify whether it is consistent with <b>pneumonia</b>, <b>sepsis</b>, or <b>both</b>.",
        rowHeader: "Finding",
        columns: ["Pneumonia", "Sepsis", "Both"],
        rows: [
          "Temperature 102.4 F (39.1 C)",
          "Crackles in right lower lobe",
          "Lactate 4.2 mmol/L",
          "Blood pressure 88/50 mm Hg",
          "Rust-colored sputum",
          "White blood cell count 18,500/mm³",
        ],
        answers: [2, 0, 1, 1, 0, 2],
        avgPercent: 58,
        linkedVideo: "Sepsis",
        rationale: {
          explanation:
            "<p><b>Fever</b> and <b>leukocytosis</b> occur with both a localized infection and the systemic response to it.</p><p><b>Crackles</b> and <b>rust-colored sputum</b> come from alveolar consolidation, so they point to pneumonia specifically.</p><p><b>Elevated lactate</b> and <b>hypotension</b> reflect systemic hypoperfusion and anaerobic metabolism, so they point to sepsis.</p>",
          takeaway: ["Lactate above 2 mmol/L with hypotension marks the progression from localized infection to sepsis."],
        },
      },
      {
        id: "c1-i3",
        type: "dropdown",
        subject: "adult-health",
        system: "Immune / Infectious Disease",
        topic: "Sepsis",
        stem: "Complete the following sentence by choosing from the lists of options.",
        template: "The client is at highest risk for developing {0} as evidenced by the client's {1}.",
        blanks: [
          { options: ["septic shock", "pulmonary embolism", "diabetic ketoacidosis", "acute asthma exacerbation"], answer: 0 },
          { options: ["blood pressure and lactate level", "blood glucose level", "sodium level", "smoking history"], answer: 0 },
        ],
        avgPercent: 71,
        linkedVideo: "Sepsis",
        rationale: {
          explanation:
            "<p>A MAP below 65 mm Hg together with lactate above 2 mmol/L shows that sepsis is progressing toward <b>septic shock</b>. Without aggressive fluid resuscitation and antibiotics, organ dysfunction will worsen.</p><p>The glucose of 248 mg/dL is a stress response, and without ketones or acidosis it does not suggest DKA.</p>",
          takeaway: ["MAP < 65 mm Hg plus lactate > 2 mmol/L means septic shock is imminent."],
        },
      },
      {
        id: "c1-i4",
        type: "sata",
        subject: "adult-health",
        system: "Immune / Infectious Disease",
        topic: "Sepsis",
        stem: "Which prescriptions should the nurse anticipate? <b>Select all that apply.</b>",
        options: [
          "Obtain blood cultures before starting antibiotics.",
          "Administer a 30 mL/kg IV crystalloid bolus.",
          "Administer broad-spectrum IV antibiotics within 1 hour.",
          "Apply supplemental oxygen to keep SpO₂ at 92% or higher.",
          "Continue metformin with the next meal.",
          "Restrict oral fluids to 1 liter per day.",
          "Place the client in Trendelenburg position.",
        ],
        answers: [0, 1, 2, 3],
        avgPercent: 62,
        linkedVideo: "Sepsis",
        linkedSheet: "Sepsis",
        rationale: {
          explanation:
            "<p>The <b>sepsis 1-hour bundle</b> includes measuring lactate, drawing blood cultures before antibiotics, giving broad-spectrum antibiotics, and giving 30 mL/kg of crystalloid for hypotension or lactate of 4 mmol/L or higher.</p><p>Oxygen corrects the hypoxemia (89% on room air).</p>",
          incorrect: [
            { label: "Metformin", text: "Hold metformin: elevated creatinine and hypoperfusion raise the risk of lactic acidosis." },
            { label: "Fluid restriction", text: "The client is volume depleted and needs fluids, not restriction." },
            { label: "Trendelenburg", text: "No longer recommended. It impairs ventilation and does not reliably improve perfusion." },
          ],
          takeaway: ["Cultures, then antibiotics within 1 hour, plus 30 mL/kg crystalloid for hypotension or lactate ≥ 4."],
        },
      },
      {
        id: "c1-i5",
        type: "bowtie",
        subject: "adult-health",
        system: "Immune / Infectious Disease",
        topic: "Sepsis",
        stem: "Complete the diagram by dragging from the choices below to specify what condition the client is most likely experiencing, 2 actions the nurse should take to address that condition, and 2 parameters the nurse should monitor to assess the client's progress.",
        conditions: ["Sepsis", "Pulmonary embolism", "Heart failure exacerbation", "Diabetic ketoacidosis"],
        actions: [
          "Administer IV fluid bolus",
          "Administer prescribed IV antibiotics",
          "Administer IV furosemide",
          "Prepare for thrombolytic therapy",
          "Start insulin infusion per DKA protocol",
        ],
        parameters: ["Serum lactate", "Mean arterial pressure", "Serum potassium", "D-dimer", "Urine ketones"],
        answer: { condition: 0, actions: [0, 1], parameters: [0, 1] },
        avgPercent: 66,
        linkedVideo: "Sepsis",
        rationale: {
          explanation:
            "<p>Infection plus hypotension, tachycardia, altered mental status, and elevated lactate indicates <b>sepsis</b>.</p><p>Treatment centers on restoring perfusion with <b>IV fluids</b> and controlling the source with <b>antibiotics</b>. The best markers of response are <b>MAP</b> (goal 65 mm Hg or higher) and <b>lactate clearance</b>.</p>",
          takeaway: ["Trend MAP and lactate to judge how the client is responding to sepsis resuscitation."],
        },
      },
      {
        id: "c1-i6",
        type: "matrix",
        subject: "adult-health",
        system: "Immune / Infectious Disease",
        topic: "Sepsis",
        stem: "Three hours after treatment began, the nurse reassesses the client. For each finding, click to specify whether the client's condition has <b>improved</b> or <b>not improved</b>.",
        rowHeader: "Assessment Finding",
        columns: ["Improved", "Not Improved"],
        rows: [
          "Mean arterial pressure 72 mm Hg",
          "Lactate 1.8 mmol/L",
          "Oriented to person, place, and time",
          "Urine output 15 mL/hr",
          "Pulse oximetry 88% on 2 L nasal cannula",
          "Heart rate 96/min",
        ],
        answers: [0, 0, 0, 1, 1, 0],
        avgPercent: 73,
        rationale: {
          explanation:
            "<p>MAP above 65 mm Hg, normalized lactate, a return to baseline orientation, and a falling heart rate all show better perfusion.</p><p>Urine output below 0.5 mL/kg/hr (about 35 mL/hr for 70 kg) and worsening oxygenation despite supplemental oxygen show ongoing organ dysfunction. Report these to the provider.</p>",
          takeaway: ["Evaluate sepsis response by perfusion: MAP, lactate, mentation, and urine output."],
        },
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: "next-gen-case-37",
    title: "Case Study: Maternal & Newborn Health #1",
    subject: "maternal-and-newborn-health",
    intro: "The nurse is caring for a 29-year-old client at 34 weeks gestation in the prenatal clinic.",
    tabs: [
      {
        label: "Nurses' Notes",
        content: {
          kind: "notes",
          heading: "Prenatal Clinic",
          entries: [
            {
              time: "0930",
              html: "G1P0 at 34 weeks gestation reports a 7/10 headache unrelieved by acetaminophen and &ldquo;seeing spots&rdquo; since last night. Face and hands are swollen; the client states her rings feel tight. Denies contractions, vaginal bleeding, or leaking fluid. Reports active fetal movement. Deep tendon reflexes 3+ bilaterally with 1 beat of clonus. Fetal heart rate 140/min with moderate variability.",
            },
          ],
        },
      },
      {
        label: "Vital Signs",
        content: {
          kind: "table",
          headers: ["", "0930", "0945"],
          rows: [
            ["T", "98.6 F (37 C)", "—"],
            ["P", "92", "90"],
            ["RR", "18", "18"],
            ["BP", "168/112", "166/110"],
            ["Pulse oximetry reading", "98% on room air", "98% on room air"],
          ],
        },
      },
      {
        label: "Laboratory Results",
        content: {
          kind: "table",
          headers: ["Laboratory Test", "Reference Range", "1000"],
          rows: [
            ["Urine protein (dipstick)", "Negative", "3+"],
            ["Platelets", "150,000–400,000/mm³", "95,000/mm³"],
            ["AST", "0–35 units/L", "88 units/L"],
            ["ALT", "4–36 units/L", "92 units/L"],
            ["Creatinine", "0.6–1.1 mg/dL", "1.0 mg/dL"],
            ["Hemoglobin", "11–16 g/dL", "11.8 g/dL"],
          ],
        },
      },
    ],
    items: [
      {
        id: "c2-i1",
        type: "selectN",
        n: 4,
        subject: "maternal-and-newborn-health",
        system: "Antepartum",
        topic: "Preeclampsia",
        stem: "Select the <b>4</b> findings that require <b>immediate</b> follow-up.",
        options: [
          "Blood pressure",
          "Headache",
          "Visual disturbance",
          "Platelet count",
          "Fetal heart rate",
          "Hemoglobin",
          "Respiratory rate",
          "Fetal movement",
        ],
        answers: [0, 1, 2, 3],
        avgPercent: 69,
        linkedVideo: "Preeclampsia",
        linkedSheet: "Preeclampsia",
        rationale: {
          explanation:
            "<p>Two blood pressures of 160/110 mm Hg or higher taken 15 minutes apart, new headache, visual disturbances, and a platelet count below 100,000/mm³ are all <b>severe features of preeclampsia</b>.</p><p>A fetal heart rate of 140/min with moderate variability is reassuring, and the hemoglobin and respiratory rate are within normal limits.</p>",
          takeaway: ["Severe-range BP, headache, visual changes, and thrombocytopenia define preeclampsia with severe features."],
        },
      },
      {
        id: "c2-i2",
        type: "dragCloze",
        subject: "maternal-and-newborn-health",
        system: "Antepartum",
        topic: "Preeclampsia",
        stem: "Drag options from the choices below to fill in each blank in the following sentence.",
        template: "The client is most likely experiencing {0}, which places the client at greatest risk for {1}.",
        choices: [
          "preeclampsia with severe features",
          "gestational hypertension",
          "preterm labor",
          "an eclamptic seizure",
          "postpartum hemorrhage",
          "gestational diabetes",
        ],
        answers: [0, 3],
        avgPercent: 74,
        linkedVideo: "Preeclampsia",
        rationale: {
          explanation:
            "<p>Hypertension with proteinuria after 20 weeks plus severe features (severe-range BP, headache, visual changes, thrombocytopenia, elevated liver enzymes) is <b>preeclampsia with severe features</b>.</p><p>Hyperreflexia with clonus, headache, and visual disturbances point to cerebral irritability, which puts this client at greatest risk for an <b>eclamptic seizure</b>.</p>",
          takeaway: ["Hyperreflexia and clonus in preeclampsia are warning signs of impending eclampsia."],
        },
      },
      {
        id: "c2-i3",
        type: "matrix",
        subject: "maternal-and-newborn-health",
        system: "Antepartum",
        topic: "Preeclampsia",
        stem: "For each potential intervention, click to specify whether the intervention is <b>anticipated</b> or <b>not anticipated</b> for the care of the client.",
        rowHeader: "Potential Intervention",
        columns: ["Anticipated", "Not Anticipated"],
        rows: [
          "Administer a magnesium sulfate IV loading dose.",
          "Administer IV labetalol.",
          "Place the client in a quiet, dimly lit room.",
          "Administer methylergonovine IM.",
          "Encourage the client to ambulate in the hallway.",
          "Insert an indwelling urinary catheter to measure hourly output.",
        ],
        answers: [0, 0, 0, 1, 1, 0],
        avgPercent: 61,
        linkedVideo: "Preeclampsia",
        linkedSheet: "OB Medications",
        rationale: {
          explanation:
            "<p><b>Magnesium sulfate</b> prevents seizures, and <b>IV labetalol</b> treats severe-range hypertension. A low-stimulation environment lowers seizure risk, and hourly urine output monitors for magnesium toxicity and renal function.</p>",
          incorrect: [
            { label: "Methylergonovine", text: "Contraindicated in hypertension because it causes vasoconstriction." },
            { label: "Ambulation", text: "Seizure precautions and a low-stimulation environment are required." },
          ],
          takeaway: ["Preeclampsia with severe features: magnesium sulfate for seizures, antihypertensives for BP, low stimulation."],
        },
      },
      {
        id: "c2-i4",
        type: "mcq",
        subject: "maternal-and-newborn-health",
        system: "Antepartum",
        topic: "Magnesium Sulfate",
        stem: "The client is receiving magnesium sulfate at 2 g/hr. Which finding requires the nurse to stop the infusion?",
        options: [
          "Respiratory rate of 10/min",
          "Deep tendon reflexes of 2+",
          "Urine output of 40 mL/hr",
          "Serum magnesium level of 5.5 mg/dL",
        ],
        answer: 0,
        avgPercent: 78,
        linkedSheet: "OB Medications",
        rationale: {
          explanation:
            "<p>A respiratory rate below 12/min is a sign of <b>magnesium toxicity</b>. Stop the infusion, notify the provider, and have <b>calcium gluconate</b> available.</p><p>DTRs of 2+, urine output of 30 mL/hr or more, and a magnesium level of 4–7 mg/dL are expected therapeutic findings.</p>",
          takeaway: ["Magnesium toxicity: RR < 12, absent DTRs, urine output < 30 mL/hr. The antidote is calcium gluconate."],
        },
      },
      {
        id: "c2-i5",
        type: "sata",
        subject: "maternal-and-newborn-health",
        system: "Antepartum",
        topic: "Preeclampsia",
        stem: "Which findings indicate that treatment has been effective? <b>Select all that apply.</b>",
        options: [
          "Blood pressure 142/92 mm Hg",
          "Client reports headache has resolved",
          "Deep tendon reflexes 2+ without clonus",
          "Urine output 20 mL/hr",
          "Respiratory rate 11/min",
          "Platelet count 80,000/mm³",
        ],
        answers: [0, 1, 2],
        avgPercent: 67,
        rationale: {
          explanation:
            "<p>A blood pressure below the severe range, a resolved headache, and normal reflexes without clonus show that the client is responding to treatment.</p><p>Oliguria and a respiratory rate below 12 suggest magnesium toxicity, and a falling platelet count shows the disease is progressing.</p>",
          takeaway: ["Evaluate preeclampsia treatment by BP, neurologic symptoms, and reflexes, while watching for magnesium toxicity."],
        },
      },
      {
        id: "c2-i6",
        type: "matrix",
        subject: "maternal-and-newborn-health",
        system: "Postpartum",
        topic: "Discharge Teaching",
        stem: "The client delivers and is preparing for discharge. For each client statement, click to specify whether it indicates the teaching was <b>effective</b> or <b>ineffective</b>.",
        rowHeader: "Client Statement",
        columns: ["Effective", "Ineffective"],
        rows: [
          "“I will check my blood pressure at home and call if it is 160/110 or higher.”",
          "“Now that my baby is born, preeclampsia can't come back.”",
          "“I will call if I get a severe headache or start seeing spots again.”",
          "“Shortness of breath is normal after delivery, so I won't worry about it.”",
          "“I should have my blood pressure checked again within a week.”",
        ],
        answers: [0, 1, 0, 1, 0],
        avgPercent: 81,
        rationale: {
          explanation:
            "<p>Preeclampsia can occur or worsen up to <b>6 weeks postpartum</b>. Clients should monitor BP, report severe headache or visual changes, and follow up within 3–10 days.</p><p>Shortness of breath may indicate pulmonary edema and must be reported right away.</p>",
          takeaway: ["Postpartum preeclampsia is possible for up to 6 weeks after delivery."],
        },
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    id: "next-gen-case-28",
    title: "Case Study: Child Health #1",
    subject: "child-health",
    intro: "The nurse is caring for an 18-month-old client in the pediatric emergency department.",
    tabs: [
      {
        label: "Nurses' Notes",
        content: {
          kind: "notes",
          heading: "Pediatric Emergency Department",
          entries: [
            {
              time: "1100",
              html: "Parent reports vomiting and diarrhea for 2 days with 6 watery stools today and 2 wet diapers in the past 24 hours. The child is lethargic but arousable and cries without tears. Mucous membranes are dry. Capillary refill is 3 seconds; peripheral pulses 1+. Weight 10.2 kg (11 kg at a clinic visit last week).",
            },
          ],
        },
      },
      {
        label: "Vital Signs",
        content: {
          kind: "table",
          headers: ["", "1100"],
          rows: [
            ["T", "100.8 F (38.2 C)"],
            ["P", "160"],
            ["RR", "34"],
            ["BP", "84/50"],
            ["Pulse oximetry reading", "99% on room air"],
          ],
        },
      },
      {
        label: "Laboratory Results",
        content: {
          kind: "table",
          headers: ["Laboratory Test", "Reference Range", "1130"],
          rows: [
            ["Sodium", "135–145 mEq/L", "132 mEq/L"],
            ["Potassium", "3.5–5.0 mEq/L", "3.1 mEq/L"],
            ["BUN", "5–18 mg/dL", "24 mg/dL"],
            ["Glucose", "70–100 mg/dL", "68 mg/dL"],
            ["Urine specific gravity", "1.005–1.030", "1.030"],
          ],
        },
      },
    ],
    items: [
      {
        id: "c3-i1",
        type: "highlight",
        subject: "child-health",
        system: "Gastrointestinal",
        topic: "Dehydration",
        stem: "Click to highlight the findings that indicate <b>dehydration</b>.",
        headers: ["Body System", "Findings"],
        rows: [
          { label: "Neurological", segments: ["Lethargic but arousable;", "cries without tears"] },
          { label: "Cardiovascular", segments: ["heart rate 160/min;", "capillary refill 3 seconds;", "peripheral pulses 1+"] },
          { label: "Gastrointestinal", segments: ["6 watery stools today;", "abdomen soft and nondistended"] },
          { label: "Genitourinary", segments: ["2 wet diapers in 24 hours"] },
          { label: "Integumentary", segments: ["mucous membranes dry;", "no rashes noted"] },
        ],
        answers: ["0-0", "0-1", "1-0", "1-1", "1-2", "3-0", "4-0"],
        avgPercent: 72,
        linkedVideo: "Dehydration",
        linkedSheet: "Pediatric Dehydration",
        rationale: {
          explanation:
            "<p>Lethargy, absent tears, tachycardia, delayed capillary refill, weak pulses, decreased urine output, and dry mucous membranes are classic signs of <b>fluid volume deficit</b> in children.</p><p>The watery stools are the cause of the fluid loss rather than a sign of dehydration.</p>",
          takeaway: ["In children, tachycardia is an early sign of dehydration. Hypotension is a late, ominous sign."],
        },
      },
      {
        id: "c3-i2",
        type: "dropdown",
        subject: "child-health",
        system: "Gastrointestinal",
        topic: "Dehydration",
        stem: "Complete the following sentence by choosing from the lists of options.",
        template: "The client is experiencing {0} dehydration, as evidenced by {1}.",
        blanks: [
          { options: ["mild", "moderate", "severe"], answer: 1 },
          {
            options: [
              "a 7% weight loss and decreased urine output",
              "a sodium level of 132 mEq/L",
              "a temperature of 100.8 F",
              "a respiratory rate of 34/min",
            ],
            answer: 0,
          },
        ],
        avgPercent: 63,
        rationale: {
          explanation:
            "<p>The child lost 0.8 kg of 11 kg, which is about <b>7%</b> of body weight. A 6–9% loss is <b>moderate</b> dehydration and matches the tachycardia, delayed capillary refill, and oliguria.</p>",
          takeaway: ["Mild < 5%, moderate 6–9%, severe ≥ 10% body weight loss."],
        },
      },
      {
        id: "c3-i3",
        type: "mcq",
        subject: "child-health",
        system: "Gastrointestinal",
        topic: "Dehydration",
        stem: "Which prescription should the nurse implement <b>first</b>?",
        options: [
          "Administer a 20 mL/kg IV bolus of 0.9% sodium chloride.",
          "Administer ondansetron orally.",
          "Obtain a stool specimen for culture.",
          "Offer clear apple juice in small sips.",
        ],
        answer: 0,
        avgPercent: 70,
        rationale: {
          explanation:
            "<p>Lethargy, tachycardia, and delayed capillary refill mean the child is poorly perfused. Restoring circulating volume with an <b>isotonic IV bolus</b> comes first.</p><p>Ondansetron and a stool culture can follow. Apple juice is high in sugar, low in sodium, and can make diarrhea worse.</p>",
          takeaway: ["Circulation first: an isotonic bolus of 20 mL/kg for a poorly perfused child."],
        },
      },
      {
        id: "c3-i4",
        type: "dragCloze",
        subject: "child-health",
        system: "Gastrointestinal",
        topic: "Dosage Calculation",
        stem: "Drag the option from the choices below to fill in the blank in the following sentence.",
        template: "For the prescribed 20 mL/kg bolus, the nurse should administer {0} of 0.9% sodium chloride.",
        choices: ["102 mL", "204 mL", "510 mL", "20 mL"],
        answers: [1],
        avgPercent: 88,
        rationale: {
          explanation: "<p>20 mL/kg × 10.2 kg = <b>204 mL</b>. Always use the current weight.</p>",
          takeaway: ["Calculate pediatric fluid boluses from the current weight."],
        },
      },
      {
        id: "c3-i5",
        type: "matrix",
        subject: "child-health",
        system: "Gastrointestinal",
        topic: "Dehydration",
        stem: "For each potential intervention, click to specify whether the intervention is <b>anticipated</b> or <b>not anticipated</b>.",
        rowHeader: "Potential Intervention",
        columns: ["Anticipated", "Not Anticipated"],
        rows: [
          "Add potassium chloride to maintenance fluids after the child voids.",
          "Limit the diet to bananas, rice, applesauce, and toast.",
          "Weigh diapers to measure output.",
          "Offer oral rehydration solution once vomiting subsides.",
          "Administer loperamide to slow diarrhea.",
          "Implement contact precautions.",
        ],
        answers: [0, 1, 0, 0, 1, 0],
        avgPercent: 66,
        rationale: {
          explanation:
            "<p>Confirm renal function (voiding) before adding potassium. Weighing diapers gives accurate output (1 g = 1 mL). Oral rehydration solution is the preferred route once vomiting subsides. Contact precautions are used for infectious diarrhea in diapered children.</p>",
          incorrect: [
            { label: "BRAT diet", text: "Not recommended because it is low in protein and energy. Resume a regular diet as tolerated." },
            { label: "Loperamide", text: "Antidiarrheals are not recommended for young children with acute gastroenteritis." },
          ],
          takeaway: ["Never add potassium to IV fluids until the child has voided."],
        },
      },
      {
        id: "c3-i6",
        type: "sata",
        subject: "child-health",
        system: "Gastrointestinal",
        topic: "Dehydration",
        stem: "Which findings indicate that the child's hydration status is improving? <b>Select all that apply.</b>",
        options: [
          "Heart rate 118/min",
          "Capillary refill less than 2 seconds",
          "Tears present when crying",
          "Urine specific gravity 1.032",
          "1 wet diaper in 8 hours",
          "Moist mucous membranes",
        ],
        answers: [0, 1, 2, 5],
        avgPercent: 77,
        rationale: {
          explanation:
            "<p>A normalizing heart rate, brisk capillary refill, tears, and moist mucous membranes show that hydration is improving.</p><p>Concentrated urine and low diaper counts show the child is still volume depleted.</p>",
          takeaway: ["Evaluate rehydration by heart rate, perfusion, tears, mucous membranes, and urine output."],
        },
      },
    ],
  },
];

export const caseById = (id: string) => CASES.find((c) => c.id === id);

/** Catalog of case-study rows shown on list pages (mirrors live numbering). */
export interface CaseRow {
  number: number;
  id: string;
  title: string;
  subject: string;
  free: boolean;
  /** Only rows with authored content are playable in the prototype. */
  playable: boolean;
}

const range = (subject: string, label: string, start: number, count: number, freeCount: number): CaseRow[] =>
  Array.from({ length: count }, (_, i) => {
    const number = start + i;
    const id = `next-gen-case-${number}`;
    return {
      number,
      id,
      title: `Case Study: ${label} #${i + 1}`,
      subject,
      free: i < freeCount,
      playable: Boolean(caseById(id)),
    };
  });

export const CASE_ROWS: CaseRow[] = [
  ...range("adult-health", "Adult Health", 1, 27, 3),
  ...range("child-health", "Child Health", 28, 9, 2),
  ...range("maternal-and-newborn-health", "Maternal & Newborn Health", 37, 12, 2),
  ...range("mental-health", "Mental Health", 49, 2, 1),
];
