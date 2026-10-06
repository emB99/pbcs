"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOT_ALLOWED, getOfficeContext } from "@/lib/school";
import { insertCharge } from "@/lib/db/transactions";
import { enrolmentSchema, withdrawSchema } from "@/lib/validation/enrolments";
import { fieldErrorsFromZod } from "@/lib/validation/shared";
import type { FormState, DialogResult } from "@/lib/types";

export async function createEnrolment(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await getOfficeContext();
  if (!ctx) return { message: NOT_ALLOWED };

  const parsed = enrolmentSchema.safeParse({
    mode: formData.get("mode"),
    student_id: formData.get("student_id") ?? undefined,
    new_student_full_name: formData.get("new_student_full_name") ?? undefined,
    new_student_phone: formData.get("new_student_phone") ?? undefined,
    new_guardian_full_name: formData.get("new_guardian_full_name") ?? undefined,
    new_guardian_phone: formData.get("new_guardian_phone") ?? undefined,
    intake_id: formData.get("intake_id"),
    agreed_price: formData.get("agreed_price"),
    price_note: formData.get("price_note"),
  });
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  let studentId = parsed.data.student_id;

  if (parsed.data.mode === "new") {
    // Same contact rules as the full student form.
    const phone = parsed.data.new_student_phone?.trim() || null;
    const guardianName = parsed.data.new_guardian_full_name?.trim() || null;
    const guardianPhone = parsed.data.new_guardian_phone?.trim() || null;
    if (ctx.settings.school_type === "k12") {
      if (!guardianName) return { errors: { new_guardian_full_name: ["A guardian is required."] } };
      if (!guardianPhone) {
        return { errors: { new_guardian_phone: ["Add a phone number for the guardian."] } };
      }
    } else if (!phone && !guardianPhone) {
      return { errors: { new_student_phone: ["Add a phone number for the student."] } };
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({ full_name: parsed.data.new_student_full_name!.trim(), phone })
      .select("id")
      .single();
    if (studentError || !student) {
      return { message: "Could not create the student. Try again." };
    }
    studentId = student.id;

    if (guardianName) {
      await supabase.from("guardians").insert({
        student_id: student.id,
        full_name: guardianName,
        phone: guardianPhone,
        is_primary: true,
      });
    }
  }

  const { data: enrolment, error: enrolmentError } = await supabase
    .from("enrolments")
    .insert({
      student_id: studentId!,
      intake_id: parsed.data.intake_id,
      agreed_price: Number(parsed.data.agreed_price),
      price_note: parsed.data.price_note,
    })
    .select("id")
    .single();

  if (enrolmentError || !enrolment) {
    if (enrolmentError?.code === "23505") {
      return { message: "This student is already enrolled in that intake." };
    }
    return { message: "Couldn't create the enrolment. Try again." };
  }

  const { error: chargeError } = await insertCharge(supabase, {
    enrolment_id: enrolment.id,
    amount: parsed.data.agreed_price,
    occurred_on: ctx.fmt.today(),
  });
  if (chargeError) {
    return { message: "Enrolment saved, but the charge couldn't be recorded. Contact support." };
  }

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/intakes");
  redirect(`/students/${studentId}`);
}

export async function withdrawEnrolment(
  enrolmentId: string,
  choice: "write_off" | "keep_owing",
): Promise<DialogResult> {
  const ctx = await getOfficeContext();
  if (!ctx) return { ok: false, message: NOT_ALLOWED };

  const parsed = withdrawSchema.safeParse({ choice });
  if (!parsed.success) {
    return { ok: false, message: "Choose how to handle the remaining balance." };
  }

  const supabase = await createClient();

  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("id, student_id")
    .eq("id", enrolmentId)
    .maybeSingle();
  if (!enrolment) {
    return { ok: false, message: "Enrolment not found." };
  }

  const { error: statusError } = await supabase
    .from("enrolments")
    .update({ status: "withdrawn", ended_on: ctx.fmt.today() })
    .eq("id", enrolmentId);
  if (statusError) {
    return { ok: false, message: "Couldn't withdraw the enrolment. Try again." };
  }

  if (parsed.data.choice === "write_off") {
    const { data: balance } = await supabase
      .from("enrolment_balances")
      .select("balance")
      .eq("enrolment_id", enrolmentId)
      .maybeSingle();
    const remaining = Number(balance?.balance ?? 0);
    if (remaining > 0) {
      const { error: adjustmentError } = await supabase.from("transactions").insert({
        enrolment_id: enrolmentId,
        kind: "adjustment",
        amount: Number((-remaining).toFixed(2)),
        // Currency and rate are filled in by the database (base currency, rate 1).
        occurred_on: ctx.fmt.today(),
        note: "Write-off on withdrawal",
      });
      if (adjustmentError) {
        return { ok: false, message: "Withdrawn, but the write-off couldn't be recorded." };
      }
    }
  }

  revalidatePath("/students");
  revalidatePath(`/students/${enrolment.student_id}`);
  return { ok: true };
}

export async function completeEnrolment(enrolmentId: string): Promise<DialogResult> {
  const ctx = await getOfficeContext();
  if (!ctx) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { data: enrolment } = await supabase
    .from("enrolments")
    .select("id, student_id, status")
    .eq("id", enrolmentId)
    .maybeSingle();
  if (!enrolment) return { ok: false, message: "Enrolment not found." };
  if (enrolment.status !== "enrolled") {
    return { ok: false, message: "Only an active enrolment can be marked completed." };
  }

  const { error } = await supabase
    .from("enrolments")
    .update({ status: "completed", ended_on: ctx.fmt.today() })
    .eq("id", enrolmentId);
  if (error) return { ok: false, message: "Could not update the enrolment. Try again." };

  revalidatePath(`/students/${enrolment.student_id}`);
  revalidatePath("/intakes");
  return { ok: true };
}
