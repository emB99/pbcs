"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { withdrawEnrolment } from "@/lib/actions/enrolments";
import { useFormat } from "@/components/school/SchoolProvider";

export function WithdrawButton({
  enrolmentId,
  studentName,
  balance,
}: {
  enrolmentId: string;
  studentName: string;
  balance: number;
}) {
  const fmt = useFormat();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<"write_off" | "keep_owing">("keep_owing");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClose() {
    setError(null);
    setOpen(false);
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await withdrawEnrolment(enrolmentId, choice);
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
        className="text-[11.5px] font-semibold text-danger hover:underline"
      >
        Withdraw
      </button>
      <Dialog open={open} onClose={handleClose} title={`Withdraw ${studentName}?`}>
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-ink-mid">
            This enrolment has a balance of <strong>{fmt.money(balance)}</strong>. What
            should happen to it?
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-2.5 rounded-md border border-line p-3 text-[13px] has-[:checked]:border-brand has-[:checked]:bg-brand-tint">
              <input
                type="radio"
                name="choice"
                checked={choice === "keep_owing"}
                onChange={() => setChoice("keep_owing")}
                className="mt-0.5"
              />
              <span>
                <b className="block">Keep it owing</b>
                <span className="text-ink-soft">
                  The balance stays on the books; follow up later.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2.5 rounded-md border border-line p-3 text-[13px] has-[:checked]:border-brand has-[:checked]:bg-brand-tint">
              <input
                type="radio"
                name="choice"
                checked={choice === "write_off"}
                onChange={() => setChoice("write_off")}
                className="mt-0.5"
              />
              <span>
                <b className="block">Write it off</b>
                <span className="text-ink-soft">
                  Records an adjustment clearing the balance to zero.
                </span>
              </span>
            </label>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" onClick={handleClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={handleSubmit} disabled={pending}>
              {pending ? "Working…" : "Withdraw"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
