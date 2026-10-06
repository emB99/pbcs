"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOT_ALLOWED, getOfficeContext } from "@/lib/school";
import { insertCharge } from "@/lib/db/transactions";
import { promoteSchema } from "@/lib/validation/academic";
import { intakeSchema } from "@/lib/validation/intakes";
import { fieldErrorsFromZod } from "@/lib/validation/shared";
import type { FormState, DialogResult } from "@/lib/types";

export async function createIntake(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = intakeSchema.safeParse({
    course_id: formData.get("course_id"),
    label: formData.get("label"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
    instructor_id: formData.get("instructor_id"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("intakes")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error || !data) {
    return { message: "Couldn't save the intake. Try again." };
  }

  revalidatePath("/intakes");
  redirect(`/intakes/${data.id}`);
}

/**
 * Moves students on to another intake (e.g. Form 1A -> Form 2A at year end).
 * For each selected active enrolment: enrol in the target at the target
 * course's default price (charging that fee), then mark the old enrolment
 * completed. Students already in the target are skipped. Each student is
 * handled independently, so a failure part-way leaves earlier ones moved.
 */
export async function promoteStudents(
  sourceIntakeId: string,
  input: { target_intake_id: string; enrolment_ids: string[] },
): Promise<DialogResult> {
  const ctx = await getOfficeContext();
  if (!ctx) return { ok: false, message: NOT_ALLOWED };

  const parsed = promoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  if (parsed.data.target_intake_id === sourceIntakeId) {
    return { ok: false, message: "Choose a different destination." };
  }

  const supabase = await createClient();
  const [{ data: target }, { data: source }, { data: enrolments }] = await Promise.all([
    supabase
      .from("intakes")
      .select("id, course:courses(default_price)")
      .eq("id", parsed.data.target_intake_id)
      .maybeSingle(),
    supabase.from("intakes").select("label, start_date").eq("id", sourceIntakeId).maybeSingle(),
    supabase
      .from("enrolments")
      .select("id, student_id")
      .eq("intake_id", sourceIntakeId)
      .eq("status", "enrolled")
      .in("id", parsed.data.enrolment_ids),
  ]);
  if (!target || !source) return { ok: false, message: "Intake not found." };

  const price = Number(target.course?.default_price ?? 0);
  const note = `Moved on from ${source.label || source.start_date}`;
  let moved = 0;
  let skipped = 0;
  let failed = 0;

  for (const e of enrolments ?? []) {
    const { data: created, error } = await supabase
      .from("enrolments")
      .insert({
        student_id: e.student_id,
        intake_id: target.id,
        agreed_price: price,
        price_note: note,
      })
      .select("id")
      .single();
    if (error || !created) {
      if (error?.code === "23505") skipped += 1;
      else failed += 1;
      continue;
    }
    if (price > 0) {
      const { error: chargeError } = await insertCharge(supabase, {
        enrolment_id: created.id,
        amount: price.toFixed(2),
        occurred_on: ctx.fmt.today(),
      });
      if (chargeError) {
        failed += 1;
        continue;
      }
    }
    await supabase
      .from("enrolments")
      .update({ status: "completed", ended_on: ctx.fmt.today() })
      .eq("id", e.id);
    moved += 1;
  }

  revalidatePath(`/intakes/${sourceIntakeId}`);
  revalidatePath(`/intakes/${target.id}`);
  revalidatePath("/intakes");
  revalidatePath("/students");

  if (moved === 0 && failed > 0) return { ok: false, message: "Could not move the students. Try again." };
  const parts = [`${moved} moved`];
  if (skipped > 0) parts.push(`${skipped} already there`);
  if (failed > 0) parts.push(`${failed} failed`);
  return { ok: true, message: parts.join(", ") };
}
