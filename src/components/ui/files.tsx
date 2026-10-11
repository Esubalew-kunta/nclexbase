"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { Download, ExternalLink } from "lucide-react";
import { useFileUrl } from "@/lib/admin/files";
import type { FileRef } from "@/lib/admin/types";
import { Modal } from "./primitives";

/** Link to a PDF that may be a public file or an admin upload kept in IndexedDB. */
export function FileLink({ file, download, className, children, label }: { file: FileRef; download?: boolean; className: string; children: ReactNode; label?: string }) {
  const { href } = useFileUrl(file.url);
  return (
    <a
      href={href ?? undefined}
      download={download ? file.name : undefined}
      target={download ? undefined : "_blank"}
      rel="noreferrer"
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      className={clsx(className, !href && "pointer-events-none opacity-50")}
    >
      {children}
    </a>
  );
}

export function PdfFrame({ file, title, className = "h-[70dvh]" }: { file: FileRef; title: string; className?: string }) {
  const { href, missing } = useFileUrl(file.url);
  if (missing) return <p className="p-10 text-center text-muted">This file could not be loaded.</p>;
  return href ? <iframe src={`${href}#view=FitH`} title={title} className={clsx("w-full bg-background", className)} /> : <div className={clsx("w-full animate-pulse bg-background", className)} />;
}

/** PDF viewer modal with Open / Download actions. */
export function PdfModal({ file, title, caption, onClose }: { file: FileRef | null; title: string; caption?: ReactNode; onClose: () => void }) {
  return (
    <Modal
      open={Boolean(file)}
      onClose={onClose}
      title={title}
      width={900}
      footer={
        file && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-sm text-muted">{caption}</p>
            <div className="flex gap-2">
              <FileLink file={file} className="flex h-[42px] items-center gap-2 rounded-[64px] border border-primary px-4 font-semibold text-primary hover:bg-primary-light">
                <ExternalLink className="size-4" />
                Open
              </FileLink>
              <FileLink file={file} download className="flex h-[42px] items-center gap-2 rounded-[64px] bg-primary px-4 font-semibold text-white shadow-press hover:bg-primary-hover">
                <Download className="size-4" />
                Download
              </FileLink>
            </div>
          </div>
        )
      }
    >
      {file && <PdfFrame file={file} title={title} />}
    </Modal>
  );
}
