"use client";

import { useActionState, useMemo, useState } from "react";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { createEnrolment } from "@/lib/actions/enrolments";

export type EnrolStudentOption = { id: string; full_name: string; phone: string };
export type EnrolIntakeOption = {
  id: string;
  label: string;
  course_default_price: number;
};

export function EnrolForm({
  students,
  intakes,
  initialStudentId,
  initialIntakeId,
}: {
  students: EnrolStudentOption[];
  intakes: EnrolIntakeOption[];
  initialStudentId?: string;
  initialIntakeId?: string;
}) {
  const [state, formAction, pending] = useActionState(createEnrolment, undefined);
  const errors = state?.errors ?? {};

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [intakeId, setIntakeId] = useState(initialIntakeId ?? "");
  const selectedIntake = useMemo(
    () => intakes.find((i) => i.id === intakeId),
    [intakes, intakeId],
  );
  const [price, setPrice] = useState(
    selectedIntake ? String(selectedIntake.course_default_price) : "",
  );
  const [priceTouched, setPriceTouched] = useState(false);

  function handleIntakeChange(id: string) {
    setIntakeId(id);
    if (!priceTouched) {
      const intake = intakes.find((i) => i.id === id);
      setPrice(intake ? String(intake.course_default_price) : "");
    }
  }

  const priceDiffers =
    selectedIntake && price.trim() !== "" && Number(price) !== Number(selectedIntake.course_default_price);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="mode" value={mode} />

      <FieldGroup label="Student" htmlFor="mode-toggle">
        <SegmentedControl
          name="mode-toggle"
          value={mode}
          onChange={setMode}
          options={[
            { label: "Existing student", value: "existing" },
            { label: "New student", value: "new" },
          ]}
        />
      </FieldGroup>

      {mode === "existing" ? (
        <FieldGroup label="Choose student" htmlFor="student_id" error={errors.student_id?.[0]}>
          <select
            id="student_id"
            name="student_id"
            defaultValue={initialStudentId ?? ""}
            className={inputClass}
          >
            <option value="">Choose a student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} — {s.phone}
              </option>
            ))}
          </select>
        </FieldGroup>
      ) : (
        <div className="flex flex-col gap-4 rounded-md border border-line-soft bg-surface-2 p-3.5">
          <FieldGroup
            label="Full name"
            htmlFor="new_student_full_name"
            error={errors.new_student_full_name?.[0]}
          >
            <input id="new_student_full_name" name="new_student_full_name" required className={inputClass} />
          </FieldGroup>
          <FieldGroup label="Phone" htmlFor="new_student_phone" error={errors.new_student_phone?.[0]}>
            <input id="new_student_phone" name="new_student_phone" required className={inputClass} />
          </FieldGroup>
        </div>
      )}

      <FieldGroup label="Intake" htmlFor="intake_id" error={errors.intake_id?.[0]}>
        <select
          id="intake_id"
          name="intake_id"
          value={intakeId}
          onChange={(e) => handleIntakeChange(e.target.value)}
          className={inputClass}
        >
          <option value="">Choose an intake…</option>
          {intakes.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label}
            </option>
          ))}
        </select>
      </FieldGroup>

      <FieldGroup label="Agreed price (USD)" htmlFor="agreed_price" error={errors.agreed_price?.[0]}>
        <input
          id="agreed_price"
          name="agreed_price"
          inputMode="decimal"
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
            setPriceTouched(true);
          }}
          className={inputClass}
        />
      </FieldGroup>

      {priceDiffers && (
        <FieldGroup
          label="Why does the price differ from the course default?"
          htmlFor="price_note"
          error={errors.price_note?.[0]}
        >
          <input
            id="price_note"
            name="price_note"
            placeholder="e.g. sibling discount, early-bird rate"
            className={inputClass}
          />
        </FieldGroup>
      )}

      {state?.message && <p className="text-xs text-danger">{state.message}</p>}

      <Button type="submit" variant="primary" disabled={pending || !intakeId}>
        {pending ? "Enrolling…" : "Enrol"}
      </Button>
    </form>
  );
}
