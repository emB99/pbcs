"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  variant = "primary",
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  variant?: "primary" | "danger";
  onConfirm: () => Promise<{ ok: boolean; message?: string }>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClose() {
    setError(null);
    onClose();
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await onConfirm();
      if (result.ok) {
        handleClose();
      } else {
        setError(result.message ?? "Something went wrong. Try again.");
      }
    });
  }

  return (
    <Dialog open={open} onClose={handleClose} title={title}>
      <div className="flex flex-col gap-3">
        {description && <p className="text-[13px] text-ink-mid">{description}</p>}
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" onClick={handleClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant={variant} onClick={handleConfirm} disabled={pending}>
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
