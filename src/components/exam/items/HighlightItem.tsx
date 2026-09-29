"use client";

import clsx from "clsx";
import type { HighlightItem as Highlight } from "@/lib/types";
import type { ItemProps } from "./shared";

export function HighlightItemView({ item, answer, onChange, locked, reveal }: ItemProps<Highlight>) {
  const keys = answer.type === "highlight" ? answer.keys : [];
  const toggle = (key: string) => {
    if (locked) return;
    onChange({ type: "highlight", keys: keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key] });
  };

  return (
    <div>
      <table className="w-full max-w-[680px] border-collapse border border-[#d0d0d0]">
        <thead>
          <tr className="bg-[#e8f1fb]">
            <th className="w-[140px] border border-[#d0d0d0] px-2 py-1.5 text-left font-bold">{item.headers[0]}</th>
            <th className="border border-[#d0d0d0] px-2 py-1.5 text-left font-bold">{item.headers[1]}</th>
          </tr>
        </thead>
        <tbody>
          {item.rows.map((row, r) => (
            <tr key={r} className={r % 2 === 0 ? "bg-[#f2f2f2]" : "bg-white"}>
              <td className="border border-[#d0d0d0] px-2 py-1.5 align-top font-bold">{row.label}</td>
              <td className="border border-[#d0d0d0] px-2 py-1.5">
                {row.segments.map((seg, s) => {
                  const key = `${r}-${s}`;
                  const on = keys.includes(key);
                  const isAnswer = item.answers.includes(key);
                  return (
                    <span key={key}>
                      <button
                        type="button"
                        aria-pressed={on}
                        disabled={locked}
                        onClick={() => toggle(key)}
                        className={clsx(
                          "rounded-sm px-0.5 text-left disabled:cursor-default",
                          on && !reveal && "bg-[#ffe95c]",
                          reveal && on && isAnswer && "bg-[#c8ecc3]",
                          reveal && on && !isAnswer && "bg-[#f8c9c6] line-through decoration-[#d0312d]",
                          reveal && !on && isAnswer && "outline-2 outline-[#2e9d3a] outline-dashed",
                          !locked && !on && "hover:bg-[#fff6b8]",
                        )}
                      >
                        {seg}
                      </button>{" "}
                    </span>
                  );
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {reveal && (
        <p className="mt-3 flex flex-wrap gap-4 text-sm text-[#555]">
          <span><span className="mr-1 inline-block size-3 bg-[#c8ecc3]" />Correctly highlighted</span>
          <span><span className="mr-1 inline-block size-3 bg-[#f8c9c6]" />Incorrectly highlighted</span>
          <span><span className="mr-1 inline-block size-3 outline-2 outline-[#2e9d3a] outline-dashed" />Missed</span>
        </p>
      )}
    </div>
  );
}
