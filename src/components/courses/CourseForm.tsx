"use client";

import { useActionState } from "react";
import { BookOpen, DollarSign, Clock, Layers } from "lucide-react";
import { FieldGroup, textareaClass } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { IconSelect } from "@/components/ui/IconSelect";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { FormState } from "@/lib/types";
import type { Course } from "@/lib/types";

export function CourseForm({
  action,
  defaultValues,
  submitLabel,
  bare = false,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<Course>;
  submitLabel: string;
  /** Skip the outer Card — used when already rendered inside a Dialog. */
  bare?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state?.errors ?? {};

  const fields = (
    <form action={formAction} className={bare ? "flex flex-col gap-4" : "flex flex-col gap-4 p-6"}>
      <FieldGroup label="Course name" htmlFor="name" error={errors.name?.[0]}>
        <IconField icon={<BookOpen />} id="name" name="name" required defaultValue={defaultValues?.name} />
      </FieldGroup>

      <FieldGroup label="Kind" htmlFor="kind" error={errors.kind?.[0]}>
        <IconSelect
          icon={<Layers />}
          id="kind"
          name="kind"
          defaultValue={defaultValues?.kind ?? "short_course"}
        >
          <option value="short_course">Short course</option>
          <option value="programme">Programme</option>
        </IconSelect>
      </FieldGroup>

      <FieldGroup label="Default price (USD)" htmlFor="default_price" error={errors.default_price?.[0]}>
        <IconField
          icon={<DollarSign />}
          id="default_price"
          name="default_price"
          inputMode="decimal"
          placeholder="0"
          defaultValue={defaultValues?.default_price ?? "0"}
        />
      </FieldGroup>

      <FieldGroup label="Default length (weeks)" htmlFor="default_weeks" error={errors.default_weeks?.[0]}>
        <IconField
          icon={<Clock />}
          id="default_weeks"
          name="default_weeks"
          inputMode="numeric"
          placeholder="Optional"
          defaultValue={defaultValues?.default_weeks ?? ""}
        />
      </FieldGroup>

      <FieldGroup label="Description" htmlFor="description" error={errors.description?.[0]}>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Optional"
          defaultValue={defaultValues?.description ?? ""}
          className={textareaClass}
        />
      </FieldGroup>

      {state?.message && <p className="text-xs text-danger">{state.message}</p>}

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );

  if (bare) return fields;
  return <Card className="max-w-lg">{fields}</Card>;
}
