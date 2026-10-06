"use client";

import { useActionState, useMemo, useState } from "react";
import { User, Phone, Banknote, MessageSquare, CalendarDays, Presentation, Users } from "lucide-react";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";
import { IconField } from "@/components/ui/IconField";
import { IconSelect } from "@/components/ui/IconSelect";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { createEnrolment } from "@/lib/actions/enrolments";

import { useSchoolType, useTerms, useFormat } from "@/components/school/SchoolProvider";
import { a } from "@/lib/terminology";

export type EnrolStudentOption = {
  id: string;
  full_name: string;
  phone: string | null;
  student_number: string;
};
export type EnrolIntakeOption = {
  id: string;
  intake_label: string;
  course_name: string;
  course_kind: "short_course" | "programme" | null;
  course_default_price: number;
  start_date: string;
  end_date: string | null;
  instructor_name: string | null;
  capacity: number | null;
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
  const t = useTerms();
  const fmt = useFormat();
  const isK12 = useSchoolType() === "k12";
  const [state, formAction, pending] = useActionState(createEnrolment, undefined);
  const errors = state?.errors ?? {};

  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [planOn, setPlanOn] = useState(false);
  const [intakeId, setIntakeId] = useState(initialIntakeId ?? "");
  const selectedIntake = useMemo(
    () => intakes.find((i) => i.id === intakeId),
    [intakes, intakeId],
  );
  const [price, setPrice] = useState(
    selectedIntake ? String(selectedIntake.course_default_price) : "",
  );
  const [priceTouched, setPriceTouched] = useState(false);

  // Grouped by course so the picker reads as "Course > its intakes" rather
  // than a flat list you have to parse label-by-label.
  const groupedIntakes = useMemo(() => {
    const groups = new Map<string, EnrolIntakeOption[]>();
    for (const intake of intakes) {
      const list = groups.get(intake.course_name) ?? [];
      list.push(intake);
      groups.set(intake.course_name, list);
    }
    return [...groups.entries()];
  }, [intakes]);

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
    <Card className="max-w-lg">
      <form action={formAction} className="flex flex-col gap-4 p-6">
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
            <IconSelect
              icon={<User />}
              id="student_id"
              name="student_id"
              defaultValue={initialStudentId ?? ""}
            >
              <option value="">Choose a student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} — {s.student_number}
                </option>
              ))}
            </IconSelect>
          </FieldGroup>
        ) : (
          <div className="flex flex-col gap-4 rounded-[10px] border border-line-soft bg-surface-2 p-3.5">
            <FieldGroup
              label="Full name"
              htmlFor="new_student_full_name"
              error={errors.new_student_full_name?.[0]}
            >
              <IconField icon={<User />} id="new_student_full_name" name="new_student_full_name" required />
            </FieldGroup>
            <FieldGroup label="Phone" htmlFor="new_student_phone" error={errors.new_student_phone?.[0]}>
              <IconField
                icon={<Phone />}
                id="new_student_phone"
                name="new_student_phone"
                placeholder={isK12 ? "Optional" : undefined}
                required={!isK12}
              />
            </FieldGroup>
            {isK12 && (
              <>
                <FieldGroup
                  label={`${t.guardian.one} name`}
                  htmlFor="new_guardian_full_name"
                  error={errors.new_guardian_full_name?.[0]}
                >
                  <IconField icon={<User />} id="new_guardian_full_name" name="new_guardian_full_name" required />
                </FieldGroup>
                <FieldGroup
                  label={`${t.guardian.one} phone`}
                  htmlFor="new_guardian_phone"
                  error={errors.new_guardian_phone?.[0]}
                >
                  <IconField icon={<Phone />} id="new_guardian_phone" name="new_guardian_phone" required />
                </FieldGroup>
              </>
            )}
          </div>
        )}

        <FieldGroup label={t.intake.one} htmlFor="intake_id" error={errors.intake_id?.[0]}>
          <IconSelect
            icon={<CalendarDays />}
            id="intake_id"
            name="intake_id"
            value={intakeId}
            onChange={(e) => handleIntakeChange(e.target.value)}
          >
            <option value="">Choose {a(t.intake.one)}…</option>
            {groupedIntakes.map(([courseName, group]) => (
              <optgroup key={courseName} label={courseName}>
                {group.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.intake_label}
                  </option>
                ))}
              </optgroup>
            ))}
          </IconSelect>
        </FieldGroup>

        {selectedIntake && (
          <div className="flex flex-col gap-2 rounded-[10px] border border-line-soft bg-surface-2 p-3.5 text-[12.5px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-ink">{selectedIntake.course_name}</span>
              {selectedIntake.course_kind && (
                <Tag variant={selectedIntake.course_kind === "programme" ? "due" : "ok"}>
                  {selectedIntake.course_kind === "programme" ? "Programme" : "Short course"}
                </Tag>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-ink-soft">
              <CalendarDays className="h-3.5 w-3.5 flex-none" />
              {fmt.date(selectedIntake.start_date)}
              {selectedIntake.end_date ? ` – ${fmt.date(selectedIntake.end_date)}` : ""}
            </div>
            <div className="flex items-center gap-1.5 text-ink-soft">
              <Presentation className="h-3.5 w-3.5 flex-none" />
              {selectedIntake.instructor_name ?? `No ${t.instructor.one.toLowerCase()} assigned`}
            </div>
            {selectedIntake.capacity !== null && (
              <div className="flex items-center gap-1.5 text-ink-soft">
                <Users className="h-3.5 w-3.5 flex-none" />
                Capacity: {selectedIntake.capacity}
              </div>
            )}
          </div>
        )}

        <FieldGroup label={`Agreed price (${fmt.currency})`} htmlFor="agreed_price" error={errors.agreed_price?.[0]}>
          <IconField
            icon={<Banknote />}
            id="agreed_price"
            name="agreed_price"
            inputMode="decimal"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              setPriceTouched(true);
            }}
          />
        </FieldGroup>

        {priceDiffers && (
          <FieldGroup
            label={`Why does the price differ from the ${t.course.one.toLowerCase()} default?`}
            htmlFor="price_note"
            error={errors.price_note?.[0]}
          >
            <IconField
              icon={<MessageSquare />}
              id="price_note"
              name="price_note"
              placeholder="e.g. sibling discount, early-bird rate"
            />
          </FieldGroup>
        )}

        <div className="flex flex-col gap-3 rounded-md border border-line-soft p-3.5">
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input
              type="checkbox"
              name="plan_enabled"
              checked={planOn}
              onChange={(e) => setPlanOn(e.target.checked)}
            />
            Pay in instalments
          </label>
          {planOn && (
            <div className="grid grid-cols-3 gap-3 max-[520px]:grid-cols-1">
              <FieldGroup label="Instalments" htmlFor="plan_count" error={errors.count?.[0]}>
                <input
                  id="plan_count"
                  name="plan_count"
                  type="number"
                  min={1}
                  max={36}
                  defaultValue={3}
                  required
                  className={inputClass}
                />
              </FieldGroup>
              <FieldGroup label="How often" htmlFor="plan_frequency" error={errors.frequency?.[0]}>
                <select id="plan_frequency" name="plan_frequency" defaultValue="monthly" className={inputClass}>
                  <option value="weekly">Every week</option>
                  <option value="fortnightly">Every two weeks</option>
                  <option value="monthly">Every month</option>
                </select>
              </FieldGroup>
              <FieldGroup label="First due" htmlFor="plan_first_due" error={errors.first_due?.[0]}>
                <input
                  id="plan_first_due"
                  name="plan_first_due"
                  type="date"
                  defaultValue={fmt.today()}
                  required
                  className={inputClass}
                />
              </FieldGroup>
            </div>
          )}
          {planOn && (
            <p className="text-xs text-ink-soft">
              The agreed price is split into equal parts. You can change each instalment on the student page.
            </p>
          )}
        </div>

        {state?.message && <p className="text-xs text-danger">{state.message}</p>}
        {/* A safety net: never let a validation error vanish just because no field shows it. */}
        {!state?.message && Object.keys(errors).length > 0 && (
          <p className="text-xs text-danger">Please check: {[...new Set(Object.values(errors).flat())].join(" ")}</p>
        )}

        <Button type="submit" variant="primary" disabled={pending || !intakeId}>
          {pending ? "Enrolling…" : "Enrol"}
        </Button>
      </form>
    </Card>
  );
}
