"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import { Btn, Dialog } from "./ui";

/*
 * Crop (and turn) a picture in the browser. The cut is made on a canvas and handed back as a file;
 * nothing is sent anywhere here. The picture has to come from this site, because a canvas will
 * not hand back pixels it drew from another site, and a picture that cannot be cropped says so.
 */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Handle = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const RATIOS: { label: string; value: number | null }[] = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
];

const MIN = 16;
const MAX_VIEW_W = 820;

export function CropDialog({ src, name, onCancel, onApply }: { src: string; name: string; onCancel: () => void; onApply: (blob: Blob, name: string) => void | Promise<void> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  /** The picture at full size, already turned: what the cut is made from. */
  const base = useRef<HTMLCanvasElement | null>(null);
  const original = useRef<{ bitmap: ImageBitmap; type: string } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [rot, setRot] = useState(0);
  const [ratio, setRatio] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ handle: Handle; startX: number; startY: number; from: Rect } | null>(null);

  /** Draw the picture turned by `deg` degrees into the full-size canvas, and select all of it. */
  const draw = (deg: number) => {
    const o = original.current;
    if (!o) return;
    const quarter = deg % 180 !== 0;
    const w = quarter ? o.bitmap.height : o.bitmap.width;
    const h = quarter ? o.bitmap.width : o.bitmap.height;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.translate(w / 2, h / 2);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.drawImage(o.bitmap, -o.bitmap.width / 2, -o.bitmap.height / 2);
    base.current = c;
    setSize({ w, h });
    setRect(fit(w, h, ratio));
  };

  // Load the picture once.
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch(src, { credentials: "same-origin" });
        if (!res.ok) throw new Error("load");
        const blob = await res.blob();
        const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
        if (!live) return;
        original.current = { bitmap, type: blob.type === "image/png" || blob.type === "image/webp" ? blob.type : "image/jpeg" };
        draw(0);
      } catch {
        if (live) setProblem("This picture could not be opened for cropping. If it comes from another site, use Replace instead.");
      }
    })();
    return () => {
      live = false;
      original.current?.bitmap.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Show the turned picture, scaled down to fit.
  const scale = size ? Math.min(1, MAX_VIEW_W / size.w, (typeof window === "undefined" ? 600 : window.innerHeight * 0.55) / size.h) : 1;
  useEffect(() => {
    const view = canvas.current;
    if (!view || !size || !base.current) return;
    view.width = size.w;
    view.height = size.h;
    view.getContext("2d")?.drawImage(base.current, 0, 0);
  }, [size, rot]);

  const turn = (by: number) => {
    const next = (rot + by + 360) % 360;
    setRot(next);
    draw(next);
  };

  const pickRatio = (r: number | null) => {
    setRatio(r);
    if (size) setRect(fit(size.w, size.h, r));
  };

  const begin = (handle: Handle, e: React.PointerEvent) => {
    if (!rect) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { handle, startX: e.clientX, startY: e.clientY, from: rect };
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !size) return;
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;
    setRect(resize(d.from, d.handle, dx, dy, size.w, size.h, ratio));
  };

  const end = () => {
    drag.current = null;
  };

  const apply = async () => {
    const b = base.current;
    const o = original.current;
    if (!b || !o || !rect) return;
    setBusy(true);
    try {
      const out = document.createElement("canvas");
      out.width = Math.round(rect.w);
      out.height = Math.round(rect.h);
      const ctx = out.getContext("2d");
      if (!ctx) throw new Error("canvas");
      if (o.type === "image/jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, out.width, out.height);
      }
      ctx.drawImage(b, Math.round(rect.x), Math.round(rect.y), out.width, out.height, 0, 0, out.width, out.height);
      const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, o.type, 0.92));
      if (!blob) throw new Error("blob");
      await onApply(blob, name);
    } catch {
      setProblem("The cropped picture could not be made. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const s = scale;
  return (
    <Dialog
      open
      onClose={onCancel}
      title="Crop picture"
      width={MAX_VIEW_W + 40}
      footer={
        <>
          <span className="mr-auto self-center text-xs text-muted tabular-nums">{rect ? `${Math.round(rect.w)} × ${Math.round(rect.h)} px` : ""}</span>
          <Btn onClick={onCancel} disabled={busy}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={apply} disabled={busy || !rect || Boolean(problem)}>
            {busy ? "Saving…" : "Use this crop"}
          </Btn>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">Shape</span>
        {RATIOS.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => pickRatio(r.value)}
            aria-pressed={ratio === r.value}
            className={clsx("h-8 cursor-pointer rounded-md border px-2.5 text-sm", ratio === r.value ? "border-primary bg-primary-light font-semibold text-primary" : "border-line hover:border-faint")}
          >
            {r.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-line" />
        <Btn onClick={() => turn(-90)} aria-label="Turn left">
          <RotateCcw className="size-4" />
          Turn left
        </Btn>
        <Btn onClick={() => turn(90)} aria-label="Turn right">
          <RotateCw className="size-4" />
          Turn right
        </Btn>
      </div>
      {problem ? (
        <p className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-sm text-error" role="alert">
          {problem}
        </p>
      ) : (
        <div className="flex justify-center overflow-auto bg-[repeating-conic-gradient(#e5e7eb_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
          <div className="relative select-none" style={{ width: size ? size.w * s : 0, height: size ? size.h * s : 0, touchAction: "none" }} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
            <canvas ref={canvas} className="block" style={{ width: size ? size.w * s : 0, height: size ? size.h * s : 0 }} />
            {rect && size && (
              <>
                {/* Dim everything outside the cut with four bars. */}
                <div className="pointer-events-none absolute inset-x-0 top-0 bg-black/45" style={{ height: rect.y * s }} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/45" style={{ height: (size.h - rect.y - rect.h) * s }} />
                <div className="pointer-events-none absolute left-0 bg-black/45" style={{ top: rect.y * s, height: rect.h * s, width: rect.x * s }} />
                <div className="pointer-events-none absolute right-0 bg-black/45" style={{ top: rect.y * s, height: rect.h * s, width: (size.w - rect.x - rect.w) * s }} />
                <div
                  data-testid="crop-box"
                  onPointerDown={(e) => begin("move", e)}
                  className="absolute cursor-move border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
                  style={{ left: rect.x * s, top: rect.y * s, width: rect.w * s, height: rect.h * s }}
                >
                  {(ratio === null ? (["n", "s", "e", "w", "ne", "nw", "se", "sw"] as Handle[]) : (["ne", "nw", "se", "sw"] as Handle[])).map((h) => (
                    <span key={h} data-handle={h} onPointerDown={(e) => begin(h, e)} className={clsx("absolute size-3.5 rounded-full border-2 border-primary bg-white", HANDLE_POS[h])} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

const HANDLE_POS: Record<string, string> = {
  n: "-top-[7px] left-1/2 -translate-x-1/2 cursor-ns-resize",
  s: "-bottom-[7px] left-1/2 -translate-x-1/2 cursor-ns-resize",
  e: "-right-[7px] top-1/2 -translate-y-1/2 cursor-ew-resize",
  w: "-left-[7px] top-1/2 -translate-y-1/2 cursor-ew-resize",
  ne: "-top-[7px] -right-[7px] cursor-nesw-resize",
  nw: "-top-[7px] -left-[7px] cursor-nwse-resize",
  se: "-bottom-[7px] -right-[7px] cursor-nwse-resize",
  sw: "-bottom-[7px] -left-[7px] cursor-nesw-resize",
};

/** The biggest selection of this shape that fits, centred. With no shape, the whole picture. */
export function fit(W: number, H: number, ratio: number | null): Rect {
  if (ratio === null) return { x: 0, y: 0, w: W, h: H };
  let w = W;
  let h = w / ratio;
  if (h > H) {
    h = H;
    w = h * ratio;
  }
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The selection after a drag of (dx, dy) picture pixels on `handle`, kept inside the picture. */
export function resize(from: Rect, handle: Handle, dx: number, dy: number, W: number, H: number, ratio: number | null): Rect {
  if (handle === "move") {
    return { ...from, x: clamp(from.x + dx, 0, W - from.w), y: clamp(from.y + dy, 0, H - from.h) };
  }

  let left = from.x;
  let top = from.y;
  let right = from.x + from.w;
  let bottom = from.y + from.h;
  if (handle.includes("w")) left = clamp(left + dx, 0, right - MIN);
  if (handle.includes("e")) right = clamp(right + dx, left + MIN, W);
  if (handle.includes("n")) top = clamp(top + dy, 0, bottom - MIN);
  if (handle.includes("s")) bottom = clamp(bottom + dy, top + MIN, H);

  if (ratio !== null && handle.length === 2) {
    // A corner with a fixed shape: the width leads, the height follows, and the opposite corner stays put.
    const anchorX = handle.includes("w") ? from.x + from.w : from.x;
    const anchorY = handle.includes("n") ? from.y + from.h : from.y;
    let w = Math.max(MIN, Math.abs((handle.includes("w") ? left : right) - anchorX));
    let h = w / ratio;
    const maxW = handle.includes("w") ? anchorX : W - anchorX;
    const maxH = handle.includes("n") ? anchorY : H - anchorY;
    if (w > maxW) {
      w = maxW;
      h = w / ratio;
    }
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    return { x: handle.includes("w") ? anchorX - w : anchorX, y: handle.includes("n") ? anchorY - h : anchorY, w, h };
  }

  return { x: left, y: top, w: right - left, h: bottom - top };
}
