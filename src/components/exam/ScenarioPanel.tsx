"use client";

import clsx from "clsx";
import type { CaseStudy, TabContent } from "@/lib/types";
import { Html } from "./items/shared";

/**
 * Left pane of a case study. Tabs unlock as the case progresses (item.tabs),
 * styled like the live Pearson look: rounded-top gray tabs, white active tab.
 */
export function ScenarioPanel({
  caseStudy,
  index,
  showBanner,
  visibleTabs,
  tab,
  onTab,
}: {
  caseStudy: CaseStudy;
  index: number;
  showBanner: boolean;
  visibleTabs: number;
  tab: number;
  onTab: (i: number) => void;
}) {
  const tabs = caseStudy.tabs.slice(0, Math.max(1, visibleTabs));
  const activeIndex = Math.min(tab, tabs.length - 1);
  const active = tabs[activeIndex];
  return (
    <div>
      <div className={clsx("pt-6", caseStudy.exhibit ? "pb-2" : "pb-4")}>
        {!caseStudy.exhibit && showBanner && (
          <div className="mb-6 bg-[#eee] px-2.5 py-2">
            The following scenario applies to the next <b>{caseStudy.items.length}</b> items.
          </div>
        )}
        {!caseStudy.exhibit && (
          <>
            <p>
              <strong>
                Item {index + 1} of {caseStudy.items.length}
              </strong>
            </p>
            <p>{caseStudy.intro}</p>
          </>
        )}
      </div>

      <div role="tablist" className="flex">
        {tabs.map((t, i) => {
          const on = i === activeIndex;
          return (
            <div key={t.label} className="flex">
              <button
                role="tab"
                aria-selected={on}
                onClick={() => onTab(i)}
                className={clsx(
                  "mr-1 flex cursor-pointer items-center justify-center rounded-t-lg border-x border-t border-[#e0e0e0] px-4 py-2 text-center leading-4 font-bold",
                  on ? "relative z-10 bg-white shadow-[0_1px_0_0_#fff]" : "bg-[#eee] hover:bg-[#e4e4e4]",
                )}
              >
                {t.label}
              </button>
            </div>
          );
        })}
      </div>
      <div role="tabpanel" className="rounded-tr-lg rounded-b-lg border border-[#e0e0e0] p-3">
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
        <div className="leading-6">
          {content.heading && <p className="mb-2 font-bold">{content.heading}</p>}
          {content.entries.map((e) => (
            <div key={e.time} className="grid grid-cols-[64px_1fr] gap-2">
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
              <tr className="bg-[#e8f2ff]">
                {content.headers.map((h, i) => (
                  <th key={i} className="border border-[#ddd] px-2 py-1 text-left font-bold">
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
                  <td key={c} className={clsx("border border-[#ddd] px-2 py-1 align-top", c === 0 && "font-bold")}>
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
