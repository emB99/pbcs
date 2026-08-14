"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { intakeSchema } from "@/lib/validation/intakes";
import { fieldErrorsFromZod } from "@/lib/validation/shared";
import type { FormState } from "@/lib/types";

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
