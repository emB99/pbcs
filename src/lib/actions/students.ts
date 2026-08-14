"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { studentSchema } from "@/lib/validation/students";
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
  });
}

export async function createStudent(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = readStudentForm(formData);
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error || !data) {
    return { message: "Couldn't save the student. Try again." };
  }

  revalidatePath("/students");
  redirect(`/students/${data.id}`);
}

/**
 * Same shape as createStudent but returns the new id instead of redirecting
 * — used by the "create inline" step of the enrol-a-student flow, which
 * needs to stay on the enrolment form and move to the next step itself.
 */
export async function createStudentInline(
  input: ReturnType<typeof studentSchema.parse>,
): Promise<DialogResult & { studentId?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .insert(input)
    .select("id")
    .single();
  if (error || !data) {
    return { ok: false, message: "Couldn't save the student. Try again." };
  }
  revalidatePath("/students");
  return { ok: true, studentId: data.id };
}

export async function updateStudent(
  studentId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = readStudentForm(formData);
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("students").update(parsed.data).eq("id", studentId);
  if (error) {
    return { message: "Couldn't save the student. Try again." };
  }

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

export async function archiveStudent(studentId: string): Promise<DialogResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", studentId);

  if (error) {
    return { ok: false, message: "Couldn't archive the student. Try again." };
  }

  revalidatePath("/students");
  return { ok: true };
}
