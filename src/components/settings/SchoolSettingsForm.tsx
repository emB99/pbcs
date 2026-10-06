"use client";

import { useActionState, useState } from "react";
import { School, Hash, Mail, Phone, MapPin } from "lucide-react";
import { updateSchoolSettings } from "@/lib/actions/school";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { Button } from "@/components/ui/Button";
import { DEFAULT_TERMS, TERM_KEYS, type TerminologyOverrides } from "@/lib/terminology";
import type { SchoolSettings, SchoolType } from "@/lib/types";

const TERM_LABELS: Record<(typeof TERM_KEYS)[number], string> = {
  course: "Course",
  intake: "Intake",
  subject: "Subject",
  instructor: "Teaching staff",
  enrolment: "Enrolment",
  term: "Term",
  guardian: "Guardian",
};

export function SchoolSettingsForm({ settings }: { settings: SchoolSettings }) {
  const [state, formAction, pending] = useActionState(updateSchoolSettings, undefined);
  const [type, setType] = useState<SchoolType>(settings.school_type);
  const errors = (state && "errors" in state && state.errors) || {};
  const overrides = (settings.terminology ?? {}) as TerminologyOverrides;
  const defaults = DEFAULT_TERMS[type];

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <FieldGroup label="School name" htmlFor="name" error={errors.name?.[0]}>
        <IconField icon={<School />} id="name" name="name" required defaultValue={settings.name} />
      </FieldGroup>

      <FieldGroup label="Type of school" htmlFor="school_type">
        <select
          id="school_type"
          name="school_type"
          value={type}
          onChange={(e) => setType(e.target.value as SchoolType)}
          className={inputClass}
        >
          <option value="college">College / training centre</option>
          <option value="k12">Primary / secondary school</option>
        </select>
        <p className="text-xs text-ink-soft">
          Changes the default wording across the app. Your data is not affected.
        </p>
      </FieldGroup>

      <FieldGroup
        label="Student number prefix"
        htmlFor="student_number_prefix"
        error={errors.student_number_prefix?.[0]}
      >
        <IconField
          icon={<Hash />}
          id="student_number_prefix"
          name="student_number_prefix"
          required
          maxLength={8}
          defaultValue={settings.student_number_prefix}
        />
      </FieldGroup>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldGroup label="School email" htmlFor="email" error={errors.email?.[0]}>
          <IconField icon={<Mail />} id="email" name="email" type="email" defaultValue={settings.email ?? ""} />
        </FieldGroup>
        <FieldGroup label="School phone" htmlFor="phone">
          <IconField icon={<Phone />} id="phone" name="phone" defaultValue={settings.phone ?? ""} />
        </FieldGroup>
      </div>

      <FieldGroup label="Address" htmlFor="address">
        <IconField icon={<MapPin />} id="address" name="address" defaultValue={settings.address ?? ""} />
      </FieldGroup>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[12.5px] font-semibold text-ink-mid">Wording</legend>
        <p className="text-xs text-ink-soft">
          Leave blank to use the default for your type of school.
        </p>
        <div className="grid grid-cols-[1fr_1fr_1fr] items-center gap-2 text-[11.5px] text-ink-soft">
          <span />
          <span>Singular</span>
          <span>Plural</span>
          {TERM_KEYS.map((key) => (
            <div key={key} className="contents">
              <span className="text-[12.5px] font-semibold text-ink-mid">{TERM_LABELS[key]}</span>
              <input
                name={`term_${key}_one`}
                aria-label={`${TERM_LABELS[key]} singular`}
                placeholder={defaults[key].one}
                defaultValue={overrides[key]?.one ?? ""}
                maxLength={40}
                className={inputClass}
              />
              <input
                name={`term_${key}_many`}
                aria-label={`${TERM_LABELS[key]} plural`}
                placeholder={defaults[key].many}
                defaultValue={overrides[key]?.many ?? ""}
                maxLength={40}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </fieldset>

      {state && "message" in state && state.message && (
        <p className="text-xs text-danger">{state.message}</p>
      )}
      {state && "saved" in state && <p className="text-xs text-success-ink">Saved.</p>}

      <div>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
