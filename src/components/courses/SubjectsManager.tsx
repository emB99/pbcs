"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Archive } from "lucide-react";
import { saveSubject, archiveSubject } from "@/lib/actions/subjects";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { useTerms } from "@/components/school/SchoolProvider";
import type { Subject } from "@/lib/types";

export function SubjectsManager({ courseId, subjects }: { courseId: string; subjects: Subject[] }) {
  const t = useTerms();
  const [editing, setEditing] = useState<{ id: string | null; name: string; code: string } | null>(null);
  const [archiving, setArchiving] = useState<Subject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const noun = t.subject.one.toLowerCase();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    startTransition(async () => {
      const result = await saveSubject(courseId, editing.id, { name: editing.name, code: editing.code });
      if (result.ok) setEditing(null);
      else setError(result.message ?? "Could not save.");
    });
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-end px-5 pt-4">
        <Button
          variant="primary"
          icon={<Plus />}
          onClick={() => {
            setError(null);
            setEditing({ id: null, name: "", code: "" });
          }}
        >
          Add {noun}
        </Button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState message={`No ${t.subject.many.toLowerCase()} yet. New ${t.intake.many.toLowerCase()} start with the ones listed here.`} />
      ) : (
        <ul className="mt-2 flex flex-col">
          {subjects.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 border-t border-line-soft px-5 py-3 first:border-t-0"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[13.5px] font-semibold">{s.name}</span>
                {s.code && <span className="ml-2 text-[12px] text-ink-soft">{s.code}</span>}
              </div>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setEditing({ id: s.id, name: s.name, code: s.code ?? "" });
                }}
                className="text-ink-soft hover:text-ink"
                aria-label={`Edit ${s.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setArchiving(s)}
                className="text-ink-soft hover:text-danger"
                aria-label={`Archive ${s.name}`}
              >
                <Archive className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${noun}` : `Add ${noun}`}
      >
        {editing && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <FieldGroup label="Name" htmlFor="subject_name">
              <input
                id="subject_name"
                required
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className={inputClass}
              />
            </FieldGroup>
            <FieldGroup label="Code" htmlFor="subject_code">
              <input
                id="subject_code"
                value={editing.code}
                onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                placeholder="Optional, e.g. MATH101"
                className={inputClass}
              />
            </FieldGroup>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={archiving !== null}
        onClose={() => setArchiving(null)}
        title={`Archive this ${noun}?`}
        description={`"${archiving?.name ?? ""}" will not be added to new ${t.intake.many.toLowerCase()}. Existing ones keep it.`}
        confirmLabel="Archive"
        variant="danger"
        onConfirm={() => archiveSubject(courseId, archiving!.id)}
      />
    </div>
  );
}
