"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Archive } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { archiveInstructor } from "@/lib/actions/instructors";

export function InstructorRowActions({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-3">
      <Link href={`/instructors/${id}/edit`} className="text-ink-soft hover:text-ink" aria-label={`Edit ${name}`}>
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-ink-soft hover:text-danger"
        aria-label={`Archive ${name}`}
      >
        <Archive className="h-4 w-4" />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Archive this instructor?"
        description={`"${name}" will drop off the active list. Nothing is deleted.`}
        confirmLabel="Archive"
        variant="danger"
        onConfirm={() => archiveInstructor(id)}
      />
    </div>
  );
}
