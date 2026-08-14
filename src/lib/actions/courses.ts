"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { courseSchema } from "@/lib/validation/courses";
import { fieldErrorsFromZod } from "@/lib/validation/shared";
import type { FormState, DialogResult } from "@/lib/types";

export async function createCourse(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = courseSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    default_price: formData.get("default_price"),
    default_weeks: formData.get("default_weeks"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("courses").insert(parsed.data);
  if (error) {
    return { message: "Couldn't save the course. Try again." };
  }

  revalidatePath("/courses");
  redirect("/courses");
}

export async function updateCourse(
  courseId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = courseSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    default_price: formData.get("default_price"),
    default_weeks: formData.get("default_weeks"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("courses").update(parsed.data).eq("id", courseId);
  if (error) {
    return { message: "Couldn't save the course. Try again." };
  }

  revalidatePath("/courses");
  redirect("/courses");
}

export async function archiveCourse(courseId: string): Promise<DialogResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", courseId);

  if (error) {
    return { ok: false, message: "Couldn't archive the course. Try again." };
  }

  revalidatePath("/courses");
  return { ok: true };
}
