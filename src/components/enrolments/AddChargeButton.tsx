"use client";

import { useState, useTransition } from "react";
import { DollarSign, MessageSquare } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FieldGroup } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { recordCharge } from "@/lib/actions/transactions";

/** Materials/ingredients fee, or any other one-off charge — just another charge row. */
export function AddChargeButton({ enrolmentId, courseName }: { enrolmentId: string; courseName: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClose() {
    setAmount("");
    setNote("");
    setError(null);
    setOpen(false);
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await recordCharge({ enrolment_id: enrolmentId, amount, note });
      if (result.ok) {
        handleClose();
      } else {
        setError(result.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="text-[11.5px] font-semibold text-ink-soft hover:text-ink hover:underline"
      >
        Add a charge
      </button>
      <Dialog open={open} onClose={handleClose} title={`Add a charge — ${courseName}`}>
        <div className="flex flex-col gap-3">
          <FieldGroup label="Amount (USD)">
            <IconField
              icon={<DollarSign />}
              inputMode="decimal"
              placeholder="e.g. materials fee"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Note">
            <IconField
              icon={<MessageSquare />}
              placeholder="e.g. Ingredients — Wedding Cakes module"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </FieldGroup>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" onClick={handleClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSubmit} disabled={pending}>
              {pending ? "Saving…" : "Add charge"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
