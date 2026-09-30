"use client";

import clsx from "clsx";
import { useState } from "react";
import type { DragTopNItem } from "@/lib/types";
import { Mark, type ItemProps } from "./shared";

/** "Drag the top N findings ... to the box on the right." Two bordered columns; click or drag to move. */
export function DragTopNItemView({ item, answer, onChange, locked, reveal }: ItemProps<DragTopNItem>) {
  const chosen = answer.type === "dragTopN" ? answer.chosen : [];
  const [over, setOver] = useState(false);
  const add = (i: number) => !locked && !chosen.includes(i) && chosen.length < item.n && onChange({ type: "dragTopN", chosen: [...chosen, i] });
  const remove = (i: number) => !locked && onChange({ type: "dragTopN", chosen: chosen.filter((c) => c !== i) });

  const box = "flex min-h-[62px] w-full items-center px-2.5 text-left";
  return (
    <div className="grid max-w-[672px] grid-cols-2 gap-6">
      <div className="border border-black">
        <div className="flex h-[70px] items-center justify-center border-b border-black bg-[#e8f2ff] font-bold">{item.sourceLabel}</div>
        <div className="space-y-1 p-2">
          {item.options.map((o, i) => {
            const used = chosen.includes(i);
            return (
              <button
                key={i}
                type="button"
                draggable={!locked && !used}
                onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
                disabled={locked || used}
                onClick={() => add(i)}
                className={clsx(box, used ? "bg-white text-transparent" : "bg-[#e8f2ff] hover:bg-[#d8e8f8]", !locked && !used && "cursor-grab")}
              >
                {o}
              </button>
            );
          })}
        </div>
      </div>
      <div
        className={clsx("border border-black", over && "outline-2 outline-[#0b62b5]")}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          add(Number(e.dataTransfer.getData("text/plain")));
        }}
      >
        <div className="flex h-[70px] items-center justify-center border-b border-black bg-[#e8f2ff] font-bold">{item.targetLabel}</div>
        <div className="space-y-1 p-2">
          {Array.from({ length: item.n }).map((_, k) => {
            const i = chosen[k];
            const filled = i !== undefined;
            return (
              <div key={k} className="flex items-center gap-1">
                {reveal && filled && <Mark show correct={item.answers.includes(i)} />}
                <button
                  type="button"
                  disabled={locked || !filled}
                  onClick={() => filled && remove(i)}
                  className={clsx(box, filled ? "border border-[#0b62b5] bg-white" : "bg-[#e8f2ff]")}
                >
                  {filled ? item.options[i] : ""}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
