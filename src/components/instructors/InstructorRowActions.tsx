"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Archive } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { archiveInstructor } from "@/lib/actions/instructors";
import { PortalAccessButton } from "@/components/instructors/PortalAccessButton";
import { useTerms } from "@/components/school/SchoolProvider";

export function InstructorRowActions({
  id,
  name,
  email,
  hasAccess,
}: {
  id: string;
  name: string;
  email: string | null;
  hasAccess: boolean;
}) {
  const t = useTerms();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-3">
      <PortalAccessButton id={id} name={name} email={email} hasAccess={hasAccess} />
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
        title={`Archive this ${t.instructor.one.toLowerCase()}?`}
        description={`"${name}" will drop off the active list. Nothing is deleted.`}
        confirmLabel="Archive"
        variant="danger"
        onConfirm={() => archiveInstructor(id)}
      />
    </div>
  );
}
