"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import {
  setIntakeSubjectTeacher,
  syncIntakeSubjects,
  removeIntakeSubject,
} from "@/lib/actions/intake-subjects";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTerms } from "@/components/school/SchoolProvider";

export type IntakeSubjectRow = {
  id: string;
  subject_name: string;
  subject_code: string | null;
  instructor_id: string | null;
};

export function IntakeSubjectsCard({
  intakeId,
  rows,
  instructors,
  missingCount,
}: {
  intakeId: string;
  rows: IntakeSubjectRow[];
  instructors: { id: string; full_name: string }[];
  /** Active course subjects this intake does not have yet. */
  missingCount: number;
}) {
  const t = useTerms();
  const [removing, setRemoving] = useState<IntakeSubjectRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function assign(rowId: string, instructorId: string) {
    setError(null);
    startTransition(async () => {
      const result = await setIntakeSubjectTeacher(intakeId, rowId, instructorId || null);
      if (!result.ok) setError(result.message ?? "Could not save.");
    });
  }

  function addMissing() {
    setError(null);
    startTransition(async () => {
      const result = await syncIntakeSubjects(intakeId);
      if (!result.ok) setError(result.message ?? "Could not add.");
    });
  }

  return (
    <div className="flex flex-col">
      {missingCount > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-line-soft bg-butter px-5 py-2.5 text-[12.5px] text-butter-ink">
          <span>
            {missingCount} {missingCount === 1 ? t.subject.one.toLowerCase() : t.subject.many.toLowerCase()} on
            the {t.course.one.toLowerCase()} {missingCount === 1 ? "is" : "are"} not on this{" "}
            {t.intake.one.toLowerCase()} yet.
          </span>
          <Button icon={<Plus />} onClick={addMissing} disabled={pending}>
            Add {missingCount === 1 ? "it" : "them"}
          </Button>
        </div>
      )}

      {error && <p className="px-5 pt-3 text-xs text-danger">{error}</p>}

      {rows.length === 0 ? (
        <EmptyState
          message={`No ${t.subject.many.toLowerCase()} yet. Add them on the ${t.course.one.toLowerCase()} page.`}
        />
      ) : (
        <ul className="flex flex-col">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-3 border-t border-line-soft px-5 py-3 first:border-t-0"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[13.5px] font-semibold">{r.subject_name}</span>
                {r.subject_code && <span className="ml-2 text-[12px] text-ink-soft">{r.subject_code}</span>}
              </div>
              <Link
                href={`/intakes/${intakeId}/subjects/${r.id}`}
                className="flex items-center gap-1.5 text-[12.5px] font-semibold text-crust-deep hover:underline"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Marks
              </Link>
              <select
                aria-label={`${t.instructor.one} for ${r.subject_name}`}
                value={r.instructor_id ?? ""}
                disabled={pending}
                onChange={(e) => assign(r.id, e.target.value)}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px]"
              >
                <option value="">Unassigned</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.full_name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setRemoving(r)}
                className="text-ink-soft hover:text-danger"
                aria-label={`Remove ${r.subject_name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={`Remove this ${t.subject.one.toLowerCase()}?`}
        description={`"${removing?.subject_name ?? ""}" will be taken off this ${t.intake.one.toLowerCase()}.`}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => removeIntakeSubject(intakeId, removing!.id)}
      />
    </div>
  );
}
