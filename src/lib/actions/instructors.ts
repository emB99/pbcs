"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { instructorSchema } from "@/lib/validation/instructors";
import { fieldErrorsFromZod } from "@/lib/validation/shared";
import type { FormState, DialogResult } from "@/lib/types";

function readInstructorForm(formData: FormData) {
  return instructorSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });
}

export async function createInstructor(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = readInstructorForm(formData);
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("instructors").insert(parsed.data);
  if (error) {
    return { message: "Couldn't save the instructor. Try again." };
  }

  revalidatePath("/instructors");
  redirect("/instructors");
}

export async function updateInstructor(
  instructorId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = readInstructorForm(formData);
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("instructors")
    .update(parsed.data)
    .eq("id", instructorId);
  if (error) {
    return { message: "Couldn't save the instructor. Try again." };
  }

  revalidatePath("/instructors");
  redirect("/instructors");
}

export async function archiveInstructor(instructorId: string): Promise<DialogResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("instructors")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", instructorId);

  if (error) {
    return { ok: false, message: "Couldn't archive the instructor. Try again." };
  }

  revalidatePath("/instructors");
  return { ok: true };
}
