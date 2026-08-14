"use client";

import { useActionState } from "react";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { Button } from "@/components/ui/Button";
import { createIntake } from "@/lib/actions/intakes";
import type { Course, Instructor } from "@/lib/types";

export function IntakeForm({
  courses,
  instructors,
}: {
  courses: Course[];
  instructors: Instructor[];
}) {
  const [state, formAction, pending] = useActionState(createIntake, undefined);
  const errors = state?.errors ?? {};

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <FieldGroup label="Course" htmlFor="course_id" error={errors.course_id?.[0]}>
        <select id="course_id" name="course_id" required className={inputClass}>
          <option value="">Choose a course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FieldGroup>

      <FieldGroup label="Label" htmlFor="label" error={errors.label?.[0]}>
        <input
          id="label"
          name="label"
          placeholder='e.g. "Jan 2026" — leave blank to derive from the start date'
          className={inputClass}
        />
      </FieldGroup>

      <div className="grid grid-cols-2 gap-4">
        <FieldGroup label="Start date" htmlFor="start_date" error={errors.start_date?.[0]}>
          <input id="start_date" name="start_date" type="date" required className={inputClass} />
        </FieldGroup>
        <FieldGroup label="End date" htmlFor="end_date" error={errors.end_date?.[0]}>
          <input id="end_date" name="end_date" type="date" className={inputClass} />
        </FieldGroup>
      </div>

      <FieldGroup label="Instructor" htmlFor="instructor_id" error={errors.instructor_id?.[0]}>
        <select id="instructor_id" name="instructor_id" className={inputClass}>
          <option value="">Unassigned</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.full_name}
            </option>
          ))}
        </select>
      </FieldGroup>

      <FieldGroup label="Capacity" htmlFor="capacity" error={errors.capacity?.[0]}>
        <input
          id="capacity"
          name="capacity"
          inputMode="numeric"
          placeholder="Optional"
          className={inputClass}
        />
      </FieldGroup>

      {state?.message && <p className="text-xs text-danger">{state.message}</p>}

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Saving…" : "Create intake"}
      </Button>
    </form>
  );
}
