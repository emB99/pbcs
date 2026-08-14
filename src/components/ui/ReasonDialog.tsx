"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FieldGroup } from "@/components/ui/FieldGroup";

/** Used for "Reverse this" and any action that requires a written reason. */
export function ReasonDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: (reason: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClose() {
    setReason("");
    setError(null);
    onClose();
  }

  function handleSubmit() {
    if (reason.trim().length === 0) {
      setError("A reason is required.");
      return;
    }
    startTransition(async () => {
      const result = await onConfirm(reason.trim());
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
        <FieldGroup label="Reason" error={error ?? undefined}>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            autoFocus
            className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus-visible:border-crust"
          />
        </FieldGroup>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" onClick={handleClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleSubmit} disabled={pending}>
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
