"use client";

import { useActionState } from "react";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { Button } from "@/components/ui/Button";
import type { FormState, Student } from "@/lib/types";

export function StudentForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<Student>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state?.errors ?? {};

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <FieldGroup label="Full name" htmlFor="full_name" error={errors.full_name?.[0]}>
        <input
          id="full_name"
          name="full_name"
          required
          defaultValue={defaultValues?.full_name}
          className={inputClass}
        />
      </FieldGroup>

      <FieldGroup label="Phone" htmlFor="phone" error={errors.phone?.[0]}>
        <input
          id="phone"
          name="phone"
          required
          defaultValue={defaultValues?.phone}
          className={inputClass}
        />
      </FieldGroup>

      <FieldGroup label="Email" htmlFor="email" error={errors.email?.[0]}>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Optional"
          defaultValue={defaultValues?.email ?? ""}
          className={inputClass}
        />
      </FieldGroup>

      <FieldGroup label="National ID" htmlFor="national_id" error={errors.national_id?.[0]}>
        <input
          id="national_id"
          name="national_id"
          placeholder="Optional"
          defaultValue={defaultValues?.national_id ?? ""}
          className={inputClass}
        />
      </FieldGroup>

      <FieldGroup label="Address" htmlFor="address" error={errors.address?.[0]}>
        <textarea
          id="address"
          name="address"
          rows={2}
          placeholder="Optional"
          defaultValue={defaultValues?.address ?? ""}
          className={inputClass}
        />
      </FieldGroup>

      <FieldGroup label="Notes" htmlFor="notes" error={errors.notes?.[0]}>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Optional"
          defaultValue={defaultValues?.notes ?? ""}
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
