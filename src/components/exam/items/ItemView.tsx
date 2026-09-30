"use client";

import type { Answer, Item } from "@/lib/types";
import { ChoiceItem } from "./ChoiceItem";
import { MatrixItem, MatrixMultiItemView } from "./MatrixItem";
import { DragTopNItemView } from "./DragTopNItem";
import { DragClozeItemView, DropdownClozeItemView } from "./ClozeItems";
import { HighlightItemView } from "./HighlightItem";
import { BowtieItemView } from "./BowtieItem";

export function ItemView(props: { item: Item; answer: Answer; onChange: (a: Answer) => void; locked: boolean; reveal: boolean }) {
  const { item, ...rest } = props;
  switch (item.type) {
    case "mcq":
    case "sata":
    case "selectN":
      return <ChoiceItem item={item} {...rest} />;
    case "matrix":
      return <MatrixItem item={item} {...rest} />;
    case "dragCloze":
      return <DragClozeItemView item={item} {...rest} />;
    case "dropdown":
      return <DropdownClozeItemView item={item} {...rest} />;
    case "highlight":
      return <HighlightItemView item={item} {...rest} />;
    case "bowtie":
      return <BowtieItemView item={item} {...rest} />;
    case "dragTopN":
      return <DragTopNItemView item={item} {...rest} />;
    case "matrixMulti":
      return <MatrixMultiItemView item={item} {...rest} />;
  }
}
