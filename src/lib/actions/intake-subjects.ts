"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOT_ALLOWED, getOfficeContext } from "@/lib/school";
import type { DialogResult } from "@/lib/types";

export async function setIntakeSubjectTeacher(
  intakeId: string,
  intakeSubjectId: string,
  instructorId: string | null,
): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase
    .from("intake_subjects")
    .update({ instructor_id: instructorId || null })
    .eq("id", intakeSubjectId)
    .eq("intake_id", intakeId);
  if (error) return { ok: false, message: "Could not save. Try again." };

  revalidatePath(`/intakes/${intakeId}`);
  return { ok: true };
}

/** Adds any active course subjects the intake does not have yet (e.g. added after the intake was created). */
export async function syncIntakeSubjects(intakeId: string): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { data: intake } = await supabase
    .from("intakes")
    .select("course_id")
    .eq("id", intakeId)
    .maybeSingle();
  if (!intake) return { ok: false, message: "Not found." };

  const [{ data: subjects }, { data: existing }] = await Promise.all([
    supabase.from("subjects").select("id").eq("course_id", intake.course_id).is("archived_at", null),
    supabase.from("intake_subjects").select("subject_id").eq("intake_id", intakeId),
  ]);
  const have = new Set((existing ?? []).map((e) => e.subject_id));
  const missing = (subjects ?? []).filter((s) => !have.has(s.id));
  if (missing.length > 0) {
    const { error } = await supabase
      .from("intake_subjects")
      .insert(missing.map((s) => ({ intake_id: intakeId, subject_id: s.id })));
    if (error) return { ok: false, message: "Could not add them. Try again." };
  }

  revalidatePath(`/intakes/${intakeId}`);
  return { ok: true };
}

export async function removeIntakeSubject(intakeId: string, intakeSubjectId: string): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase
    .from("intake_subjects")
    .delete()
    .eq("id", intakeSubjectId)
    .eq("intake_id", intakeId);
  if (error) return { ok: false, message: "This one has results or timetable entries, so it cannot be removed." };

  revalidatePath(`/intakes/${intakeId}`);
  return { ok: true };
}
