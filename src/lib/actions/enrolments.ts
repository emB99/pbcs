"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { insertCharge } from "@/lib/db/transactions";
import { enrolmentSchema, withdrawSchema } from "@/lib/validation/enrolments";
import { fieldErrorsFromZod } from "@/lib/validation/shared";
import type { FormState, DialogResult } from "@/lib/types";

export async function createEnrolment(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = enrolmentSchema.safeParse({
    mode: formData.get("mode"),
    student_id: formData.get("student_id") ?? undefined,
    new_student_full_name: formData.get("new_student_full_name") ?? undefined,
    new_student_phone: formData.get("new_student_phone") ?? undefined,
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
    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({
        full_name: parsed.data.new_student_full_name!.trim(),
        phone: parsed.data.new_student_phone!.trim(),
      })
      .select("id")
      .single();
    if (studentError || !student) {
      return { message: "Couldn't create the student. Try again." };
    }
    studentId = student.id;
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
    .update({ status: "withdrawn", ended_on: new Date().toISOString().slice(0, 10) })
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
        currency: "USD",
        rate_to_usd: 1,
        occurred_on: new Date().toISOString().slice(0, 10),
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
