"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Save } from "lucide-react";
import { saveGrades } from "@/lib/actions/grades";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { Tag } from "@/components/ui/Tag";
import { useTerms } from "@/components/school/SchoolProvider";
import type { GradeBand } from "@/lib/types";

export type GradebookStudent = { enrolment_id: string; student_id: string; full_name: string; student_number: string };
export type GradebookTerm = { id: string; name: string; academic_year: string; results_locked: boolean };
type Cell = { mark: string; grade: string; comment: string };

const inputBase =
  "rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] outline-none focus-visible:border-crust disabled:bg-surface-2 disabled:text-ink-mid";

function bandFor(bands: GradeBand[], mark: string): GradeBand | undefined {
  if (mark.trim() === "" || Number.isNaN(Number(mark))) return undefined;
  const value = Number(mark);
  return [...bands].sort((a, b) => b.min_mark - a.min_mark).find((b) => b.min_mark <= value);
}

export function Gradebook({
  intakeSubjectId,
  basePath,
  terms,
  termId,
  students,
  initial,
  bands,
  canOverrideLock,
}: {
  intakeSubjectId: string;
  /** Page path used for the term picker, e.g. /teach/<id>. */
  basePath: string;
  terms: GradebookTerm[];
  /** null = the single "final" grade used by schools without terms. */
  termId: string | null;
  students: GradebookStudent[];
  initial: Record<string, Cell>;
  bands: GradeBand[];
  canOverrideLock: boolean;
}) {
  const router = useRouter();
  const t = useTerms();
  const [cells, setCells] = useState<Record<string, Cell>>(() =>
    Object.fromEntries(students.map((s) => [s.enrolment_id, initial[s.enrolment_id] ?? { mark: "", grade: "", comment: "" }])),
  );
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const term = terms.find((x) => x.id === termId) ?? null;
  const locked = term?.results_locked ?? false;
  const readOnly = locked && !canOverrideLock;
  const gradeLabels = useMemo(
    () => [...bands].sort((a, b) => b.min_mark - a.min_mark).map((b) => b.grade),
    [bands],
  );

  function change(id: string, patch: Partial<Cell>) {
    setCells((cur) => ({ ...cur, [id]: { ...cur[id], ...patch } }));
    setDirty(true);
    setMessage(null);
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveGrades({
        intake_subject_id: intakeSubjectId,
        term_id: termId,
        rows: students.map((s) => {
          const c = cells[s.enrolment_id];
          // A typed mark decides the grade (the database derives it); only keep a
          // hand-picked grade when there is no mark.
          return { enrolment_id: s.enrolment_id, mark: c.mark, grade: c.mark.trim() === "" ? c.grade : "", comment: c.comment };
        }),
      });
      if (result.ok) {
        setDirty(false);
        setMessage({ ok: true, text: "Saved." });
        router.refresh();
      } else {
        setMessage({ ok: false, text: result.message ?? "Could not save." });
      }
    });
  }

  const marked = students
    .map((s) => cells[s.enrolment_id].mark)
    .filter((m) => m.trim() !== "" && !Number.isNaN(Number(m)))
    .map(Number);
  const average = marked.length > 0 ? marked.reduce((a, b) => a + b, 0) / marked.length : null;
  const graded = students.filter((s) => cells[s.enrolment_id].mark.trim() !== "" || cells[s.enrolment_id].grade !== "").length;

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-5 py-3">
        {terms.length > 0 ? (
          <label className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-mid">
            {t.term.one}
            <select
              value={termId ?? "final"}
              onChange={(e) => router.push(`${basePath}?term=${e.target.value}`)}
              disabled={pending}
              className={inputBase}
            >
              {terms.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} {x.academic_year}
                  {x.results_locked ? " (locked)" : ""}
                </option>
              ))}
              <option value="final">Final grade (no {t.term.one.toLowerCase()})</option>
            </select>
          </label>
        ) : (
          <span className="text-[12.5px] font-semibold text-ink-mid">Final grade</span>
        )}
        {locked && (
          <span className="flex items-center gap-1.5 text-[12px] text-butter-ink">
            <Lock className="h-3.5 w-3.5" />
            {readOnly ? "Results are locked" : "Locked, but you can still edit"}
          </span>
        )}
        <div className="min-w-3 flex-1" />
        <span className="text-[12px] text-ink-soft">
          {graded}/{students.length} graded
          {average !== null && ` · average ${average.toFixed(1)}`}
        </span>
        {!readOnly && (
          <Button variant="primary" icon={<Save />} onClick={save} disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save marks"}
          </Button>
        )}
      </div>

      {message && (
        <p className={`px-5 pt-3 text-xs ${message.ok ? "text-sage-ink" : "text-danger"}`}>{message.text}</p>
      )}

      {students.length === 0 ? (
        <EmptyState message={`No students are enrolled in this ${t.intake.one.toLowerCase()} yet.`} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="text-[11px] font-semibold tracking-[0.05em] text-ink-soft uppercase">
                <th className="px-5 py-2.5">Student</th>
                <th className="px-2 py-2.5">Mark (0–100)</th>
                <th className="px-2 py-2.5">Grade</th>
                <th className="px-2 py-2.5">Comment</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const c = cells[s.enrolment_id];
                const band = bandFor(bands, c.mark);
                const shownGrade = band ? band.grade : c.grade;
                const passing = (band ?? bands.find((b) => b.grade === c.grade))?.is_pass;
                return (
                  <tr key={s.enrolment_id} className="border-t border-line-soft">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <AvatarInitials id={s.student_id} name={s.full_name} size="sm" />
                        <div>
                          <div className="font-semibold">{s.full_name}</div>
                          <div className="text-[11px] text-ink-soft">{s.student_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <input
                        inputMode="decimal"
                        aria-label={`Mark for ${s.full_name}`}
                        value={c.mark}
                        disabled={readOnly || pending}
                        onChange={(e) => change(s.enrolment_id, { mark: e.target.value })}
                        className={`${inputBase} w-24 tabular-nums`}
                      />
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`Grade for ${s.full_name}`}
                          value={shownGrade}
                          disabled={readOnly || pending || band !== undefined}
                          onChange={(e) => change(s.enrolment_id, { grade: e.target.value })}
                          className={`${inputBase} w-32`}
                        >
                          <option value="">—</option>
                          {gradeLabels.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                        {shownGrade && passing !== undefined && (
                          <Tag variant={passing ? "ok" : "late"}>{passing ? "Pass" : "Fail"}</Tag>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <input
                        aria-label={`Comment for ${s.full_name}`}
                        value={c.comment}
                        maxLength={500}
                        disabled={readOnly || pending}
                        onChange={(e) => change(s.enrolment_id, { comment: e.target.value })}
                        className={`${inputBase} w-full min-w-[160px]`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
