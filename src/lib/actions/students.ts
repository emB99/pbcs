"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOT_ALLOWED, getOfficeContext } from "@/lib/school";
import { studentSchema } from "@/lib/validation/students";
import { guardianSchema } from "@/lib/validation/guardians";
import { fieldErrorsFromZod } from "@/lib/validation/shared";
import type { FormState, DialogResult } from "@/lib/types";

function readStudentForm(formData: FormData) {
  return studentSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    national_id: formData.get("national_id"),
    address: formData.get("address"),
    notes: formData.get("notes"),
    date_of_birth: formData.get("date_of_birth"),
    gender: formData.get("gender"),
    status: formData.get("status") ?? undefined,
  });
}

/**
 * The first guardian can be entered alongside a new student. K-12 schools
 * must have one; colleges must have a way to reach the student (their own
 * phone or the next of kin's).
 */
function readFirstGuardian(formData: FormData) {
  return guardianSchema.safeParse({
    full_name: formData.get("guardian_full_name") ?? "",
    relationship: formData.get("guardian_relationship"),
    phone: formData.get("guardian_phone"),
    email: formData.get("guardian_email"),
    is_primary: true,
    notes: undefined,
  });
}

export async function createStudent(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await getOfficeContext();
  if (!ctx) return { message: NOT_ALLOWED };

  const parsed = readStudentForm(formData);
  const errors: Record<string, string[]> = parsed.success ? {} : fieldErrorsFromZod(parsed.error);

  const guardianName = String(formData.get("guardian_full_name") ?? "").trim();
  const guardianPhone = String(formData.get("guardian_phone") ?? "").trim();
  const guardianEmail = String(formData.get("guardian_email") ?? "").trim();
  const hasGuardian = guardianName !== "";
  const guardianParsed = hasGuardian ? readFirstGuardian(formData) : null;
  if (guardianParsed && !guardianParsed.success) {
    for (const [key, msgs] of Object.entries(fieldErrorsFromZod(guardianParsed.error))) {
      errors[`guardian_${key}`] = msgs;
    }
  }
  if (!hasGuardian && (guardianPhone || guardianEmail)) {
    errors.guardian_full_name = ["Enter the name for this contact."];
  }

  const studentPhone = String(formData.get("phone") ?? "").trim();
  if (ctx.settings.school_type === "k12") {
    if (!hasGuardian) errors.guardian_full_name = ["A guardian is required."];
    else if (!guardianPhone && !guardianEmail) {
      errors.guardian_phone = ["Add a phone number or email for the guardian."];
    }
  } else if (!studentPhone && !guardianPhone) {
    errors.phone = ["Add a phone number for the student or their next of kin."];
  }

  if (!parsed.success || Object.keys(errors).length > 0) return { errors };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error || !data) {
    return { message: "Could not save the student. Try again." };
  }

  if (guardianParsed?.success) {
    const { error: guardianError } = await supabase
      .from("guardians")
      .insert({ ...guardianParsed.data, student_id: data.id });
    if (guardianError) {
      // The student exists now, so send them to the record; the contact can be re-added there.
      revalidatePath("/students");
      redirect(`/students/${data.id}?guardian=failed`);
    }
  }

  revalidatePath("/students");
  redirect(`/students/${data.id}`);
}

export async function updateStudent(
  studentId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await getOfficeContext())) return { message: NOT_ALLOWED };

  const parsed = readStudentForm(formData);
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("students").update(parsed.data).eq("id", studentId);
  if (error) {
    return { message: "Could not save the student. Try again." };
  }

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

export async function archiveStudent(studentId: string): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", studentId);

  if (error) {
    return { ok: false, message: "Could not archive the student. Try again." };
  }

  revalidatePath("/students");
  return { ok: true };
}
