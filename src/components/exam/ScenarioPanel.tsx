"use client";

import clsx from "clsx";
import type { CaseStudy, TabContent } from "@/lib/types";
import { Html } from "./items/shared";

export function ScenarioPanel({
  caseStudy,
  index,
  showBanner,
  tab,
  onTab,
}: {
  caseStudy: CaseStudy;
  index: number;
  showBanner: boolean;
  tab: number;
  onTab: (i: number) => void;
}) {
  const active = caseStudy.tabs[tab] ?? caseStudy.tabs[0];
  return (
    <div>
      {showBanner && (
        <div className="mb-6 bg-exam-panel px-2.5 py-2">
          The following scenario applies to the next <b>{caseStudy.items.length}</b> items.
        </div>
      )}
      <p className="font-bold">
        Item {index + 1} of {caseStudy.items.length}
      </p>
      <p>{caseStudy.intro}</p>

      <div role="tablist" className="mt-3 flex flex-wrap gap-1">
        {caseStudy.tabs.map((t, i) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={i === tab}
            onClick={() => onTab(i)}
            className={clsx(
              "relative -mb-px rounded-t border px-4 py-1.5 font-bold",
              i === tab ? "z-10 border-[#d6d6d6] border-b-white bg-white" : "border-[#d6d6d6] bg-exam-tab hover:bg-[#dedede]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="rounded-b rounded-tr border border-[#d6d6d6] p-3">
        <TabBody content={active.content} />
      </div>
    </div>
  );
}

function TabBody({ content }: { content: TabContent }) {
  switch (content.kind) {
    case "text":
      return <Html html={content.html} className="prose-exam block leading-6" />;
    case "notes":
      return (
        <div>
          {content.heading && <p className="mb-2 font-bold">{content.heading}</p>}
          {content.entries.map((e) => (
            <div key={e.time} className="grid grid-cols-[64px_1fr] gap-2 leading-6">
              <b>{e.time}:</b>
              <Html html={e.html} />
            </div>
          ))}
        </div>
      );
    case "table":
      return (
        <table className="border-collapse">
          {content.headers && (
            <thead>
              <tr className="bg-[#e8f1fb]">
                {content.headers.map((h, i) => (
                  <th key={i} className="border border-[#d6d6d6] px-2 py-1 text-left font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {content.rows.map((row, r) => (
              <tr key={r} className={r % 2 === 0 ? "bg-[#f2f2f2]" : "bg-white"}>
                {row.map((cell, c) => (
                  <td key={c} className={clsx("border border-[#d6d6d6] px-2 py-1 align-top", c === 0 && "font-bold")}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}
