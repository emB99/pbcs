"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { completeEnrolment } from "@/lib/actions/enrolments";

export function CompleteButton({
  enrolmentId,
  studentName,
}: {
  enrolmentId: string;
  studentName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="text-[11.5px] font-semibold text-success-ink hover:underline"
      >
        Mark completed
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Mark as completed?"
        description={`${studentName} finished this enrolment. Any balance stays on the books.`}
        confirmLabel="Mark completed"
        onConfirm={() => completeEnrolment(enrolmentId)}
      />
    </>
  );
}
