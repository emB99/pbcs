"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Dialog({
  open,
  onClose,
  title,
  children,
  size = "sm",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** "sm" (420px) for confirms/reasons, "lg" (560px) for multi-field forms. */
  size?: "sm" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      className={cn(
        "m-auto max-h-[85vh] rounded-lg border border-line bg-surface p-0 shadow-[0_24px_48px_-16px_rgba(31,27,22,0.35)] backdrop:bg-ink/40",
        size === "lg" ? "w-[min(560px,92vw)]" : "w-[min(420px,90vw)]",
      )}
    >
      <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-soft hover:text-ink"
        >
          <X className="h-[18px] w-[18px]" />
        </button>
      </div>
      <div className="max-h-[calc(85vh-57px)] overflow-y-auto px-5 py-4">{children}</div>
    </dialog>
  );
}
