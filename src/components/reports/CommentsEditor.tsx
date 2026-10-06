"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, Save } from "lucide-react";
import { saveReportComments } from "@/lib/actions/reports";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { textareaClass } from "@/components/ui/FieldGroup";
import { useTerms } from "@/components/school/SchoolProvider";

export type CommentStudent = { enrolment_id: string; student_id: string; full_name: string; student_number: string };
export type CommentTerm = { id: string; name: string; academic_year: string; results_locked: boolean };
type Cell = { teacher: string; head: string };

export function CommentsEditor({
  basePath,
  terms,
  termId,
  students,
  initial,
  canEditHead,
  canOverrideLock,
}: {
  basePath: string;
  terms: CommentTerm[];
  termId: string | null;
  students: CommentStudent[];
  initial: Record<string, Cell>;
  canEditHead: boolean;
  canOverrideLock: boolean;
}) {
  const router = useRouter();
  const t = useTerms();
  const [cells, setCells] = useState<Record<string, Cell>>(() =>
    Object.fromEntries(students.map((s) => [s.enrolment_id, initial[s.enrolment_id] ?? { teacher: "", head: "" }])),
  );
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const term = terms.find((x) => x.id === termId) ?? null;
  const locked = term?.results_locked ?? false;
  const readOnly = locked && !canOverrideLock;

  function change(id: string, patch: Partial<Cell>) {
    setCells((cur) => ({ ...cur, [id]: { ...cur[id], ...patch } }));
    setDirty(true);
    setMessage(null);
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveReportComments({
        term_id: termId,
        rows: students.map((s) => ({
          enrolment_id: s.enrolment_id,
          class_teacher_comment: cells[s.enrolment_id].teacher,
          ...(canEditHead ? { head_comment: cells[s.enrolment_id].head } : {}),
        })),
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
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px]"
            >
              {terms.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} {x.academic_year}
                  {x.results_locked ? " (locked)" : ""}
                </option>
              ))}
              <option value="final">Final results</option>
            </select>
          </label>
        ) : (
          <span className="text-[12.5px] font-semibold text-ink-mid">Final results</span>
        )}
        {locked && (
          <span className="flex items-center gap-1.5 text-[12px] text-warning-ink">
            <Lock className="h-3.5 w-3.5" />
            {readOnly ? "Locked" : "Locked, but you can still edit"}
          </span>
        )}
        <div className="min-w-3 flex-1" />
        {!readOnly && (
          <Button variant="primary" icon={<Save />} onClick={save} disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save comments"}
          </Button>
        )}
      </div>

      {message && (
        <p className={`px-5 pt-3 text-xs ${message.ok ? "text-success-ink" : "text-danger"}`}>{message.text}</p>
      )}

      {students.length === 0 ? (
        <EmptyState message={`No active students in this ${t.intake.one.toLowerCase()}.`} />
      ) : (
        <ul className="flex flex-col">
          {students.map((s) => {
            const c = cells[s.enrolment_id];
            return (
              <li key={s.enrolment_id} className="border-t border-line-soft px-5 py-4 first:border-t-0">
                <div className="mb-2 flex items-center gap-2.5">
                  <AvatarInitials id={s.student_id} name={s.full_name} size="sm" />
                  <div>
                    <div className="text-[13.5px] font-semibold">{s.full_name}</div>
                    <div className="text-[11px] text-ink-soft">{s.student_number}</div>
                  </div>
                </div>
                <div className={`grid gap-3 ${canEditHead ? "sm:grid-cols-2" : ""}`}>
                  <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-ink-mid">
                    {t.instructor.one} comment
                    <textarea
                      rows={2}
                      value={c.teacher}
                      maxLength={1000}
                      disabled={readOnly || pending}
                      onChange={(e) => change(s.enrolment_id, { teacher: e.target.value })}
                      className={`${textareaClass} font-normal`}
                    />
                  </label>
                  {canEditHead && (
                    <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-ink-mid">
                      Head&apos;s comment
                      <textarea
                        rows={2}
                        value={c.head}
                        maxLength={1000}
                        disabled={readOnly || pending}
                        onChange={(e) => change(s.enrolment_id, { head: e.target.value })}
                        className={`${textareaClass} font-normal`}
                      />
                    </label>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
