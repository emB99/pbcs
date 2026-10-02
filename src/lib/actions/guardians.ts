"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOT_ALLOWED, getOfficeContext } from "@/lib/school";
import { guardianSchema } from "@/lib/validation/guardians";
import type { DialogResult } from "@/lib/types";

export type GuardianFields = {
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
  is_primary: boolean;
  notes: string;
};

export async function saveGuardian(
  studentId: string,
  guardianId: string | null,
  input: GuardianFields,
): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const parsed = guardianSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const supabase = await createClient();

  // Only one guardian per student can be primary, so demote the others first.
  if (parsed.data.is_primary) {
    let demote = supabase
      .from("guardians")
      .update({ is_primary: false })
      .eq("student_id", studentId)
      .eq("is_primary", true);
    if (guardianId) demote = demote.neq("id", guardianId);
    await demote;
  }

  const { error } = guardianId
    ? await supabase.from("guardians").update(parsed.data).eq("id", guardianId).eq("student_id", studentId)
    : await supabase.from("guardians").insert({ ...parsed.data, student_id: studentId });
  if (error) return { ok: false, message: "Could not save. Try again." };

  revalidatePath(`/students/${studentId}`);
  return { ok: true };
}

export async function deleteGuardian(studentId: string, guardianId: string): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase
    .from("guardians")
    .delete()
    .eq("id", guardianId)
    .eq("student_id", studentId);
  if (error) return { ok: false, message: "Could not remove. Try again." };

  revalidatePath(`/students/${studentId}`);
  return { ok: true };
}
