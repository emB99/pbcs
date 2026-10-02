"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOT_ALLOWED, getOfficeContext } from "@/lib/school";
import { subjectSchema } from "@/lib/validation/academic";
import type { DialogResult } from "@/lib/types";

export async function saveSubject(
  courseId: string,
  subjectId: string | null,
  input: { name: string; code: string },
): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const parsed = subjectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const supabase = await createClient();
  if (subjectId) {
    const { error } = await supabase
      .from("subjects")
      .update(parsed.data)
      .eq("id", subjectId)
      .eq("course_id", courseId);
    if (error) return { ok: false, message: "Could not save. Try again." };
  } else {
    // New subjects go to the end of the list.
    const { data: last } = await supabase
      .from("subjects")
      .select("sort_order")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase
      .from("subjects")
      .insert({ ...parsed.data, course_id: courseId, sort_order: (last?.sort_order ?? 0) + 1 });
    if (error) return { ok: false, message: "Could not save. Try again." };
  }

  revalidatePath(`/courses/${courseId}/edit`);
  return { ok: true };
}

/** Subjects are never deleted (grades will reference them); archive instead. */
export async function archiveSubject(courseId: string, subjectId: string): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase
    .from("subjects")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", subjectId)
    .eq("course_id", courseId);
  if (error) return { ok: false, message: "Could not archive. Try again." };

  revalidatePath(`/courses/${courseId}/edit`);
  return { ok: true };
}
