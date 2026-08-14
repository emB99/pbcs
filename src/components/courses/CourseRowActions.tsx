"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Archive } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { archiveCourse } from "@/lib/actions/courses";

export function CourseRowActions({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-3">
      <Link
        href={`/courses/${id}/edit`}
        className="text-ink-soft hover:text-ink"
        aria-label={`Edit ${name}`}
      >
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
        title="Archive this course?"
        description={`"${name}" will drop off the active list. Nothing is deleted — you can still see it on any intake or enrolment it's already used on.`}
        confirmLabel="Archive"
        variant="danger"
        onConfirm={() => archiveCourse(id)}
      />
    </div>
  );
}
