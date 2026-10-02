"use client";

import { useState, useTransition } from "react";
import { ArrowRightCircle } from "lucide-react";
import { promoteStudents } from "@/lib/actions/intakes";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { useTerms } from "@/components/school/SchoolProvider";

export type PromoteStudent = { enrolment_id: string; full_name: string };
export type PromoteTarget = { id: string; label: string; course_name: string; default_price: number };

export function PromoteButton({
  sourceIntakeId,
  students,
  targets,
}: {
  sourceIntakeId: string;
  students: PromoteStudent[];
  targets: PromoteTarget[];
}) {
  const t = useTerms();
  const noun = t.intake.one.toLowerCase();
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const target = targets.find((x) => x.id === targetId);

  function openDialog() {
    setError(null);
    setResult(null);
    setTargetId("");
    setSelected(new Set(students.map((s) => s.enrolment_id)));
    setOpen(true);
  }

  function toggle(id: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await promoteStudents(sourceIntakeId, {
        target_intake_id: targetId,
        enrolment_ids: [...selected],
      });
      if (res.ok) setResult(res.message ?? "Done.");
      else setError(res.message ?? "Something went wrong.");
    });
  }

  return (
    <>
      <Button icon={<ArrowRightCircle />} onClick={openDialog} disabled={students.length === 0}>
        Move students on
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Move students to another ${noun}`} size="lg">
        {result ? (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-ink-mid">{result}</p>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <FieldGroup label={`Move to`} htmlFor="promote_target">
              <select
                id="promote_target"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className={inputClass}
              >
                <option value="">Choose a {noun}…</option>
                {targets.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.course_name} — {x.label}
                  </option>
                ))}
              </select>
            </FieldGroup>

            <fieldset className="flex max-h-56 flex-col gap-1.5 overflow-y-auto rounded-md border border-line-soft p-3">
              <legend className="px-1 text-[12.5px] font-semibold text-ink-mid">
                Students ({selected.size} of {students.length})
              </legend>
              {students.map((s) => (
                <label key={s.enrolment_id} className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={selected.has(s.enrolment_id)}
                    onChange={() => toggle(s.enrolment_id)}
                  />
                  {s.full_name}
                </label>
              ))}
            </fieldset>

            <p className="text-xs text-ink-soft">
              Each student is enrolled in the new {noun}
              {target && target.default_price > 0
                ? ` and charged its default price ($${target.default_price.toFixed(2)})`
                : ""}
              . Their current enrolment is marked completed. Unpaid balances stay where they are.
            </p>

            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={submit}
                disabled={pending || !targetId || selected.size === 0}
              >
                {pending ? "Moving…" : `Move ${selected.size}`}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
