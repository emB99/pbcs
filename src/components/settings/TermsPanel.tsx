"use client";

import { useState, useTransition } from "react";
import { Lock, LockOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { saveTerm, setTermLocked, deleteTerm } from "@/lib/actions/terms";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { Tag } from "@/components/ui/Tag";
import { useTerms, useFormat } from "@/components/school/SchoolProvider";

import type { Term } from "@/lib/types";

type Draft = { id: string | null; name: string; academic_year: string; start_date: string; end_date: string };

export function TermsPanel({ terms }: { terms: Term[] }) {
  const t = useTerms();
  const fmt = useFormat();
  const noun = t.term.one.toLowerCase();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Term | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setError(null);
    startTransition(async () => {
      const { id, ...fields } = draft;
      const result = await saveTerm(id, fields);
      if (result.ok) setDraft(null);
      else setError(result.message ?? "Could not save.");
    });
  }

  function toggleLock(term: Term) {
    setError(null);
    startTransition(async () => {
      const result = await setTermLocked(term.id, !term.results_locked);
      if (!result.ok) setError(result.message ?? "Could not update.");
    });
  }

  const thisYear = String(new Date().getFullYear());

  return (
    <div className="flex flex-col gap-3 px-6 pb-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-ink-soft">
          {t.term.many} group results by period. Locking a {noun} stops further edits to its results.
          Optional for colleges that grade once per course.
        </p>
        <Button
          variant="primary"
          icon={<Plus />}
          onClick={() => {
            setError(null);
            setDraft({ id: null, name: "", academic_year: thisYear, start_date: "", end_date: "" });
          }}
        >
          Add {noun}
        </Button>
      </div>

      {error && !draft && <p className="text-xs text-danger">{error}</p>}

      {terms.length === 0 ? (
        <EmptyState message={`No ${t.term.many.toLowerCase()} yet.`} />
      ) : (
        <ul className="flex flex-col divide-y divide-line-soft rounded-md border border-line-soft">
          {terms.map((term) => (
            <li key={term.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-semibold">{term.name}</span>
                  <span className="text-[12px] text-ink-soft">{term.academic_year}</span>
                  {term.results_locked && <Tag variant="due">Results locked</Tag>}
                </div>
                <div className="text-[12px] text-ink-soft">
                  {fmt.date(term.start_date)} – {fmt.date(term.end_date)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleLock(term)}
                disabled={pending}
                className="text-ink-soft hover:text-ink"
                aria-label={term.results_locked ? `Unlock ${term.name}` : `Lock ${term.name}`}
                title={term.results_locked ? "Unlock results" : "Lock results"}
              >
                {term.results_locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setDraft({
                    id: term.id,
                    name: term.name,
                    academic_year: term.academic_year,
                    start_date: term.start_date,
                    end_date: term.end_date,
                  });
                }}
                className="text-ink-soft hover:text-ink"
                aria-label={`Edit ${term.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeleting(term)}
                className="text-ink-soft hover:text-danger"
                aria-label={`Delete ${term.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? `Edit ${noun}` : `Add ${noun}`}
        size="lg"
      >
        {draft && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
              <FieldGroup label="Name" htmlFor="term_name">
                <input
                  id="term_name"
                  required
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. Term 1"
                  className={inputClass}
                />
              </FieldGroup>
              <FieldGroup label="Academic year" htmlFor="term_year">
                <input
                  id="term_year"
                  required
                  value={draft.academic_year}
                  onChange={(e) => setDraft({ ...draft, academic_year: e.target.value })}
                  className={inputClass}
                />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
              <FieldGroup label="Starts" htmlFor="term_start">
                <input
                  id="term_start"
                  type="date"
                  required
                  value={draft.start_date}
                  onChange={(e) => setDraft({ ...draft, start_date: e.target.value })}
                  className={inputClass}
                />
              </FieldGroup>
              <FieldGroup label="Ends" htmlFor="term_end">
                <input
                  id="term_end"
                  type="date"
                  required
                  value={draft.end_date}
                  onChange={(e) => setDraft({ ...draft, end_date: e.target.value })}
                  className={inputClass}
                />
              </FieldGroup>
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Delete this ${noun}?`}
        description={`"${deleting?.name ?? ""}" will be removed. This only works if no results are recorded against it.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteTerm(deleting!.id)}
      />
    </div>
  );
}
