/*
 * Hero artwork, drawn in code.
 *
 * There is no photography here and that is a positioning decision, not a shortage. Four
 * reasons, the last of which settles it:
 *
 *  - every competitor in this category leads with a smiling student in scrubs, so a site with
 *    no faces is instantly distinguishable;
 *  - stock photographs of nurses fail *with nurses* — the scrubs are wrong, the stethoscope is
 *    worn wrong, nobody carries a clipboard — and one wrong detail costs more credibility with
 *    this audience than the picture buys;
 *  - weight, on mobile data, with no image optimisation under `output: "export"`;
 *  - a stock photo of a smiling graduate in the hero *is* a testimonial. We have refused to
 *    invent testimonials in words; it is the same claim in picture form.
 *
 * What replaces it is the exam's own geometry. The NGN item types are a visual language only
 * this exam has — a bowtie has a shape, a matrix has a grid — and nobody in the category has
 * used them as imagery. It is original artwork we own outright, it weighs nothing, and drawing
 * it correctly is itself a credential: only someone who knows this exam draws a bowtie.
 *
 * Everything below is inline SVG with `currentColor` or explicit token colours, so it inherits
 * the type's colour and costs no request.
 */

/**
 * The bowtie item, as line art rather than UI: three columns of boxes — potential actions, the
 * condition at the centre, parameters to monitor — joined into the silhouette the name comes
 * from.
 *
 * Used twice and differently: cropped off the edge of a dark field at 4x as an environment
 * (v1), and at display scale as the subject itself (v3). Cropped rather than contained on
 * purpose — a contained graphic is a decoration, a cropped one is a place.
 */
export function Bowtie({ className, strokeWidth = 1 }: { className?: string; strokeWidth?: number }) {
  // A 2-3-2 grid: two action boxes, the condition, two parameter boxes, plus the connectors
  // that make the bow. Coordinates are plain numbers so the shape stays editable by hand.
  const left = [26, 104];
  const right = [26, 104];

  return (
    <svg viewBox="0 0 420 180" fill="none" aria-hidden className={className} preserveAspectRatio="xMidYMid meet">
      <g stroke="currentColor" strokeWidth={strokeWidth}>
        {/* Actions, left */}
        {left.map((y) => (
          <rect key={`a${y}`} x="1" y={y} width="118" height="50" rx="4" />
        ))}
        {/* The condition, centre — the one box with a rule under it. */}
        <rect x="151" y="65" width="118" height="50" rx="4" />
        {/* Parameters, right */}
        {right.map((y) => (
          <rect key={`p${y}`} x="301" y={y} width="118" height="50" rx="4" />
        ))}

        {/* The bow: every action reaches the condition, the condition reaches every parameter. */}
        {left.map((y) => (
          <path key={`la${y}`} d={`M119 ${y + 25} L151 90`} />
        ))}
        {right.map((y) => (
          <path key={`rp${y}`} d={`M269 90 L301 ${y + 25}`} />
        ))}
      </g>
      {/* The centre box is the answer that drives the other four, so it is the only filled one. */}
      <rect x="151" y="65" width="118" height="50" rx="4" fill="currentColor" fillOpacity="0.12" />
    </svg>
  );
}

/**
 * The other item types, reduced to pure diagram: a matrix as a dot grid, a cloze sentence with
 * filled slots, a highlight passage with one line struck, select-N as rules with two marked.
 *
 * Shown together they make a countable, verifiable claim — the exam asks in these ways and you
 * will have seen all of them — which is a specific number that is not a content count.
 */
export function ItemGlyph({ kind, className }: { kind: "matrix" | "cloze" | "highlight" | "selectN"; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4 } as const;

  if (kind === "matrix") {
    return (
      <svg viewBox="0 0 64 48" aria-hidden className={className}>
        <g {...common}>
          <path d="M1 13h62M23 1v46M43 1v46" />
          <rect x="1" y="1" width="62" height="46" rx="3" />
        </g>
        {/* One answered cell per row: the shape of a matrix is "one choice across". */}
        {[20, 33].map((y, i) => (
          <circle key={y} cx={i === 0 ? 33 : 53} cy={y} r="3.4" fill="currentColor" />
        ))}
      </svg>
    );
  }

  if (kind === "cloze") {
    return (
      <svg viewBox="0 0 64 48" aria-hidden className={className}>
        <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M4 14h16M40 14h20M4 28h30M50 28h10" />
        </g>
        {/* The two dropped-in words. */}
        <rect x="24" y="8" width="12" height="12" rx="2.5" fill="currentColor" fillOpacity="0.9" />
        <rect x="38" y="22" width="8" height="12" rx="2.5" fill="currentColor" fillOpacity="0.9" />
      </svg>
    );
  }

  if (kind === "highlight") {
    return (
      <svg viewBox="0 0 64 48" aria-hidden className={className}>
        <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55">
          <path d="M4 10h56M4 32h44M4 40h30" />
        </g>
        {/* The chosen finding, struck through the passage. */}
        <rect x="4" y="16" width="48" height="10" rx="2.5" fill="currentColor" fillOpacity="0.9" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 48" aria-hidden className={className}>
      {[6, 20, 34].map((y) => (
        <g key={y}>
          <rect x="4" y={y} width="10" height="10" rx="2.5" {...common} />
          <path d="M20 0h40" transform={`translate(0 ${y + 5})`} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
        </g>
      ))}
      {/* Two of three selected — "select all that apply" is never all of them. */}
      {[6, 34].map((y) => (
        <path key={`t${y}`} d={`M6.5 ${y + 5.5} l2.4 2.6 l4.6 -5.4`} stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      ))}
    </svg>
  );
}

/**
 * A patient's vital signs across four readings, deteriorating.
 *
 * The numbers *are* the image: no sparkline, no chart furniture, tabular figures and hairline
 * rules, so it reads as a real flowsheet rather than a dashboard. The two values that have
 * tipped out of range are the only warm colour on the page, which is what makes them land.
 */
const VITALS = [
  { label: "Blood pressure", values: ["128/76", "116/70", "104/62", "86/48"], alertFrom: 3 },
  { label: "Heart rate", values: ["88", "96", "112", "131"], alertFrom: 3 },
  { label: "Respirations", values: ["18", "20", "24", "28"], alertFrom: 4 },
  { label: "Temperature", values: ["37.1", "37.4", "38.2", "38.9"], alertFrom: 4 },
  { label: "SpO₂", values: ["97%", "96%", "94%", "91%"], alertFrom: 4 },
];

const TIMES = ["0800", "1000", "1200", "1400"];

export function VitalsFlowsheet({ className }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-card border border-line bg-surface ${className ?? ""}`}>
      {/* The chart's own tab row. Vital signs is the open one. */}
      <div className="flex gap-1 border-b border-line bg-background px-3 pt-3">
        {["Nurses' Notes", "Vital Signs", "Laboratory Results"].map((tab) => (
          <span
            key={tab}
            className={`rounded-t-md px-3 py-2 text-xs font-semibold ${
              tab === "Vital Signs" ? "border border-line border-b-surface bg-surface text-ink" : "text-muted"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      <table className="w-full border-collapse text-left font-exam">
        <thead>
          <tr>
            <th className="px-4 pt-4 pb-2 text-[11px] font-bold tracking-wider text-faint uppercase">Finding</th>
            {TIMES.map((time) => (
              <th key={time} className="px-3 pt-4 pb-2 text-right text-[11px] font-bold tracking-wider text-faint uppercase tabular-nums">
                {time}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VITALS.map((row) => (
            <tr key={row.label} className="border-t border-line">
              <td className="px-4 py-2.5 text-[13px] whitespace-nowrap text-exam-ink">{row.label}</td>
              {row.values.map((value, index) => {
                // Only the last reading of the first two rows is out of range. Two warm values
                // on the whole page; a chart lit up in red says nothing.
                const alert = index + 1 >= row.alertFrom && index === row.values.length - 1 && row.alertFrom <= 3;
                return (
                  <td
                    key={`${row.label}-${TIMES[index]}`}
                    className={`px-3 py-2.5 text-right text-[13px] tabular-nums ${
                      alert ? "font-bold text-clay" : "text-exam-ink"
                    }`}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The sliver of the chart that sits behind the question card in v1: enough of a tab row and two
 * rows of readings to be recognisable, and no more. Partly occluded on purpose.
 */
export function ChartSliver({ className }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-card border border-line bg-surface/90 ${className ?? ""}`}>
      <div className="flex gap-1 border-b border-line bg-background px-3 pt-2.5">
        {["Nurses' Notes", "Vital Signs"].map((tab) => (
          <span
            key={tab}
            className={`rounded-t-md px-2.5 py-1.5 text-[11px] font-semibold ${
              tab === "Vital Signs" ? "border border-line border-b-surface bg-surface text-ink" : "text-muted"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>
      <table className="w-full border-collapse text-left font-exam">
        <tbody>
          {VITALS.slice(0, 3).map((row) => (
            <tr key={row.label} className="border-t border-line first:border-0">
              <td className="px-3.5 py-2 text-[12px] whitespace-nowrap text-muted">{row.label}</td>
              {row.values.slice(0, 3).map((value, index) => (
                <td key={`${row.label}-${index}`} className="px-3 py-2 text-right text-[12px] tabular-nums text-exam-ink">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
