"use client";

import { useActionState } from "react";
import { BookOpen, Tag, ChefHat, Users } from "lucide-react";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { IconSelect } from "@/components/ui/IconSelect";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createIntake } from "@/lib/actions/intakes";
import type { Course, Instructor } from "@/lib/types";

export function IntakeForm({
  courses,
  instructors,
  bare = false,
}: {
  courses: Course[];
  instructors: Instructor[];
  /** Skip the outer Card — used when already rendered inside a Dialog. */
  bare?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createIntake, undefined);
  const errors = state?.errors ?? {};

  const fields = (
    <form action={formAction} className={bare ? "flex flex-col gap-4" : "flex flex-col gap-4 p-6"}>
      <FieldGroup label="Course" htmlFor="course_id" error={errors.course_id?.[0]}>
        <IconSelect icon={<BookOpen />} id="course_id" name="course_id" required defaultValue="">
          <option value="">Choose a course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </IconSelect>
      </FieldGroup>

      <FieldGroup label="Label" htmlFor="label" error={errors.label?.[0]}>
        <IconField
          icon={<Tag />}
          id="label"
          name="label"
          placeholder='e.g. "Jan 2026" — leave blank to derive from the start date'
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
        <IconSelect icon={<ChefHat />} id="instructor_id" name="instructor_id" defaultValue="">
          <option value="">Unassigned</option>
          {instructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.full_name}
            </option>
          ))}
        </IconSelect>
      </FieldGroup>

      <FieldGroup label="Capacity" htmlFor="capacity" error={errors.capacity?.[0]}>
        <IconField
          icon={<Users />}
          id="capacity"
          name="capacity"
          inputMode="numeric"
          placeholder="Optional"
        />
      </FieldGroup>

      {state?.message && <p className="text-xs text-danger">{state.message}</p>}

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Saving…" : "Create intake"}
      </Button>
    </form>
  );

  if (bare) return fields;
  return <Card className="max-w-lg">{fields}</Card>;
}
