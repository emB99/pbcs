"use client";

import { useActionState } from "react";
import { User, Phone, Mail, IdCard, MapPin, Users, Heart, Activity } from "lucide-react";
import { FieldGroup, inputClass, textareaClass } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { IconSelect } from "@/components/ui/IconSelect";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useSchoolType, useTerms } from "@/components/school/SchoolProvider";
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
  const t = useTerms();
  const isK12 = useSchoolType() === "k12";
  const isEdit = defaultValues !== undefined;
  const guardianLabel = t.guardian.one;

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

      <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
        <FieldGroup label="Date of birth" htmlFor="date_of_birth" error={errors.date_of_birth?.[0]}>
          <input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            defaultValue={defaultValues?.date_of_birth ?? ""}
            className={inputClass}
          />
        </FieldGroup>
        <FieldGroup label="Gender" htmlFor="gender" error={errors.gender?.[0]}>
          <IconSelect icon={<Users />} id="gender" name="gender" defaultValue={defaultValues?.gender ?? ""}>
            <option value="">Not specified</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </IconSelect>
        </FieldGroup>
      </div>

      <FieldGroup label="Phone" htmlFor="phone" error={errors.phone?.[0]}>
        <IconField
          icon={<Phone />}
          id="phone"
          name="phone"
          placeholder={isK12 ? "Optional" : undefined}
          defaultValue={defaultValues?.phone ?? ""}
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

      {isEdit && (
        <FieldGroup label="Status" htmlFor="status" error={errors.status?.[0]}>
          <IconSelect icon={<Activity />} id="status" name="status" defaultValue={defaultValues?.status ?? "active"}>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="graduated">Graduated</option>
            <option value="withdrawn">Withdrawn</option>
          </IconSelect>
        </FieldGroup>
      )}

      {!isEdit && (
        <fieldset className="flex flex-col gap-3 rounded-md border border-line-soft bg-surface-2 p-4">
          <legend className="px-1 text-[12.5px] font-semibold text-ink-mid">
            {guardianLabel}
            {isK12 ? "" : " (optional)"}
          </legend>
          <FieldGroup label="Name" htmlFor="guardian_full_name" error={errors.guardian_full_name?.[0]}>
            <IconField icon={<Heart />} id="guardian_full_name" name="guardian_full_name" required={isK12} />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
            <FieldGroup label="Relationship" htmlFor="guardian_relationship">
              <IconField
                icon={<Users />}
                id="guardian_relationship"
                name="guardian_relationship"
                placeholder="e.g. Mother"
              />
            </FieldGroup>
            <FieldGroup label="Phone" htmlFor="guardian_phone" error={errors.guardian_phone?.[0]}>
              <IconField icon={<Phone />} id="guardian_phone" name="guardian_phone" />
            </FieldGroup>
          </div>
          <FieldGroup label="Email" htmlFor="guardian_email" error={errors.guardian_email?.[0]}>
            <IconField icon={<Mail />} id="guardian_email" name="guardian_email" type="email" placeholder="Optional" />
          </FieldGroup>
        </fieldset>
      )}

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
