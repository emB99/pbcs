"use client";

import { useActionState, useState } from "react";
import { School, Hash, GraduationCap, Building2 } from "lucide-react";
import { completeSetup } from "@/lib/actions/setup";
import { FieldGroup } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { SchoolType } from "@/lib/types";

const TYPES: { value: SchoolType; label: string; blurb: string; icon: typeof School }[] = [
  {
    value: "college",
    label: "College / training centre",
    blurb: "Courses, intakes and modules. Lecturers teach cohorts.",
    icon: Building2,
  },
  {
    value: "k12",
    label: "Primary / secondary school",
    blurb: "Grade levels, classes, subjects and terms. Teachers and guardians.",
    icon: GraduationCap,
  },
];

export function SetupForm({ email }: { email?: string }) {
  const [state, formAction, pending] = useActionState(completeSetup, undefined);
  const [type, setType] = useState<SchoolType>("college");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Set up your school</h2>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          You&apos;ll be the owner{email ? ` (${email})` : ""}. You can change all of this later.
        </p>
      </div>

      <FieldGroup label="School name" htmlFor="name" error={state?.errors?.name?.[0]}>
        <IconField icon={<School />} id="name" name="name" required />
      </FieldGroup>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[12.5px] font-semibold text-ink-mid">Type of school</legend>
        {TYPES.map((t) => {
          const Icon = t.icon;
          return (
            <label
              key={t.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border bg-surface p-3 transition-colors",
                type === t.value ? "border-brand bg-brand-tint" : "border-line hover:bg-surface-2",
              )}
            >
              <input
                type="radio"
                name="school_type"
                value={t.value}
                checked={type === t.value}
                onChange={() => setType(t.value)}
                className="sr-only"
              />
              <Icon className="mt-0.5 h-5 w-5 flex-none text-brand-deep" strokeWidth={1.7} />
              <span>
                <b className="block text-[13px] font-semibold">{t.label}</b>
                <span className="text-xs text-ink-mid">{t.blurb}</span>
              </span>
            </label>
          );
        })}
        {state?.errors?.school_type && (
          <p className="text-xs text-danger">{state.errors.school_type[0]}</p>
        )}
      </fieldset>

      <FieldGroup
        label="Student number prefix"
        htmlFor="student_number_prefix"
        error={state?.errors?.student_number_prefix?.[0]}
      >
        <IconField
          icon={<Hash />}
          id="student_number_prefix"
          name="student_number_prefix"
          defaultValue="S"
          maxLength={8}
        />
      </FieldGroup>

      {state?.message && <p className="text-xs text-danger">{state.message}</p>}

      <Button type="submit" variant="primary" fullWidth center disabled={pending}>
        {pending ? "Setting up…" : "Create school"}
      </Button>
    </form>
  );
}
