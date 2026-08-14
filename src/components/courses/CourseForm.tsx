"use client";

import { useActionState } from "react";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { Button } from "@/components/ui/Button";
import type { FormState } from "@/lib/types";
import type { Course } from "@/lib/types";

export function CourseForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<Course>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state?.errors ?? {};

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <FieldGroup label="Course name" htmlFor="name" error={errors.name?.[0]}>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className={inputClass}
        />
      </FieldGroup>

      <FieldGroup label="Kind" htmlFor="kind" error={errors.kind?.[0]}>
        <select
          id="kind"
          name="kind"
          defaultValue={defaultValues?.kind ?? "short_course"}
          className={inputClass}
        >
          <option value="short_course">Short course</option>
          <option value="programme">Programme</option>
        </select>
      </FieldGroup>

      <FieldGroup label="Default price (USD)" htmlFor="default_price" error={errors.default_price?.[0]}>
        <input
          id="default_price"
          name="default_price"
          inputMode="decimal"
          placeholder="0"
          defaultValue={defaultValues?.default_price ?? "0"}
          className={inputClass}
        />
      </FieldGroup>

      <FieldGroup label="Default length (weeks)" htmlFor="default_weeks" error={errors.default_weeks?.[0]}>
        <input
          id="default_weeks"
          name="default_weeks"
          inputMode="numeric"
          placeholder="Optional"
          defaultValue={defaultValues?.default_weeks ?? ""}
          className={inputClass}
        />
      </FieldGroup>

      <FieldGroup label="Description" htmlFor="description" error={errors.description?.[0]}>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Optional"
          defaultValue={defaultValues?.description ?? ""}
          className={inputClass}
        />
      </FieldGroup>

      {state?.message && <p className="text-xs text-danger">{state.message}</p>}

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
