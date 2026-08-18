"use client";

import { useActionState } from "react";
import { User, Phone, Mail, IdCard, MapPin } from "lucide-react";
import { FieldGroup, textareaClass } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { FormState, Student } from "@/lib/types";

export function StudentForm({
  action,
  defaultValues,
  submitLabel,
  bare = false,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: Partial<Student>;
  submitLabel: string;
  /** Skip the outer Card — used when already rendered inside a Dialog. */
  bare?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state?.errors ?? {};

  const fields = (
    <form action={formAction} className={bare ? "flex flex-col gap-4" : "flex flex-col gap-4 p-6"}>
      <FieldGroup label="Full name" htmlFor="full_name" error={errors.full_name?.[0]}>
        <IconField
          icon={<User />}
          id="full_name"
          name="full_name"
          required
          defaultValue={defaultValues?.full_name}
        />
      </FieldGroup>

      <FieldGroup label="Phone" htmlFor="phone" error={errors.phone?.[0]}>
        <IconField
          icon={<Phone />}
          id="phone"
          name="phone"
          required
          defaultValue={defaultValues?.phone}
        />
      </FieldGroup>

      <FieldGroup label="Email" htmlFor="email" error={errors.email?.[0]}>
        <IconField
          icon={<Mail />}
          id="email"
          name="email"
          type="email"
          placeholder="Optional"
          defaultValue={defaultValues?.email ?? ""}
        />
      </FieldGroup>

      <FieldGroup label="National ID" htmlFor="national_id" error={errors.national_id?.[0]}>
        <IconField
          icon={<IdCard />}
          id="national_id"
          name="national_id"
          placeholder="Optional"
          defaultValue={defaultValues?.national_id ?? ""}
        />
      </FieldGroup>

      <FieldGroup label="Address" htmlFor="address" error={errors.address?.[0]}>
        <div className="relative">
          <span className="pointer-events-none absolute top-3.5 left-4 text-ink-soft [&>svg]:h-4 [&>svg]:w-4">
            <MapPin />
          </span>
          <textarea
            id="address"
            name="address"
            rows={2}
            placeholder="Optional"
            defaultValue={defaultValues?.address ?? ""}
            className={`${textareaClass} pl-[38px]`}
          />
        </div>
      </FieldGroup>

      <FieldGroup label="Notes" htmlFor="notes" error={errors.notes?.[0]}>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Optional"
          defaultValue={defaultValues?.notes ?? ""}
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
