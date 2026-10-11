"use client";

import type { MatrixItem as Matrix, MatrixMultiItem } from "@/lib/types";
import { Mark, NativeInput, tableCls, tdCls, thCls, type ItemProps } from "./shared";

/** Single-response matrix (radio per row). */
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
      <table className={`${tableCls} w-full`}>
        <tbody>
          <tr>
            <td className={`${thCls} text-left`}>{item.rowHeader}</td>
            {item.columns.map((c) => (
              <td key={c} className={thCls}>
                {c}
              </td>
            ))}
          </tr>
          {item.rows.map((row, r) => (
            <tr key={r} className={r % 2 === 0 ? "bg-background" : "bg-white"}>
              <td className={`${tdCls} text-left`}>
                {r + 1}. {row}
              </td>
              {item.columns.map((_, c) => {
                const on = cells[r] === c;
                const isAnswer = item.answers[r] === c;
                return (
                  <td key={c} className={tdCls}>
                    <span className="inline-flex items-center">
                      <Mark show={reveal && (on || isAnswer)} correct={on ? isAnswer : true} className="-mr-1" />
                      <NativeInput type="radio" checked={on} disabled={locked} onChange={() => set(r, c)} label={`${row}: ${item.columns[c]}`} />
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6">Note: Each row must have 1 response option selected.</p>
    </div>
  );
}

/** Multiple-response matrix (checkboxes; each column needs at least one). */
export function MatrixMultiItemView({ item, answer, onChange, locked, reveal }: ItemProps<MatrixMultiItem>) {
  const cells = answer.type === "matrixMulti" ? answer.cells : item.rows.map(() => []);
  const toggle = (row: number, col: number) => {
    if (locked) return;
    const next = cells.map((c) => [...c]);
    next[row] = next[row].includes(col) ? next[row].filter((x) => x !== col) : [...next[row], col];
    onChange({ type: "matrixMulti", cells: next });
  };
  return (
    <div>
      <table className={`${tableCls} w-full`}>
        <tbody>
          <tr>
            <td className={`${thCls} text-left`}>{item.rowHeader}</td>
            {item.columns.map((c) => (
              <td key={c} className={thCls}>
                {c}
              </td>
            ))}
          </tr>
          {item.rows.map((row, r) => (
            <tr key={r} className={r % 2 === 0 ? "bg-background" : "bg-white"}>
              <td className={`${tdCls} text-left`}>{row}</td>
              {item.columns.map((_, c) => {
                const on = cells[r]?.includes(c);
                const isAnswer = item.answers[r].includes(c);
                return (
                  <td key={c} className={tdCls}>
                    <span className="inline-flex items-center">
                      <Mark show={reveal && (on || isAnswer)} correct={on ? isAnswer : true} className="-mr-1" />
                      <NativeInput type="checkbox" checked={Boolean(on)} disabled={locked} onChange={() => toggle(r, c)} label={`${row}: ${item.columns[c]}`} />
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-6">Note: Each column must have at least 1 response option selected.</p>
    </div>
  );
}
