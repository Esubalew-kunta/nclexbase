"use client";

import clsx from "clsx";
import type { MatrixItem as Matrix } from "@/lib/types";
import { ExamCheck, Mark, type ItemProps } from "./shared";

export function MatrixItem({ item, answer, onChange, locked, reveal }: ItemProps<Matrix>) {
  const cells = answer.type === "matrix" ? answer.cells : item.rows.map(() => null);
  const set = (row: number, col: number) => {
    if (locked) return;
    const next = [...cells];
    next[row] = col;
    onChange({ type: "matrix", cells: next });
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full max-w-[640px] border-collapse border border-[#d0d0d0]">
          <thead>
            <tr className="bg-[#e8f1fb]">
              {reveal && <th className="w-8 border border-[#d0d0d0]" />}
              <th className="border border-[#d0d0d0] px-2 py-1.5 text-left font-bold">{item.rowHeader}</th>
              {item.columns.map((c) => (
                <th key={c} className="border border-[#d0d0d0] px-2 py-1.5 text-center font-bold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {item.rows.map((row, r) => (
              <tr key={r} className={r % 2 === 0 ? "bg-[#f2f2f2]" : "bg-white"}>
                {reveal && (
                  <td className="border border-[#d0d0d0] text-center">
                    <Mark show correct={cells[r] === item.answers[r]} />
                  </td>
                )}
                <td className="border border-[#d0d0d0] px-2 py-1.5">
                  {r + 1}. {row}
                </td>
                {item.columns.map((_, c) => {
                  const on = cells[r] === c;
                  const isAnswer = item.answers[r] === c;
                  return (
                    <td
                      key={c}
                      className={clsx("border border-[#d0d0d0] text-center", reveal && isAnswer && "bg-[#e3f4e1]")}
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={`${row}: ${item.columns[c]}`}
                        disabled={locked}
                        onClick={() => set(r, c)}
                        className="inline-flex p-3 disabled:cursor-default"
                      >
                        <ExamCheck checked={on} round disabled={locked} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!locked && <p className="mt-4">Note: Each row must have 1 response option selected.</p>}
    </div>
  );
}
