"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, NOT_ALLOWED, requireSchool } from "@/lib/school";
import { termSchema } from "@/lib/validation/academic";
import type { DialogResult } from "@/lib/types";

type TermFields = { name: string; academic_year: string; start_date: string; end_date: string };

async function isAdmin() {
  const ctx = await requireSchool();
  return ADMIN_ROLES.includes(ctx.role);
}

export async function saveTerm(termId: string | null, input: TermFields): Promise<DialogResult> {
  if (!(await isAdmin())) return { ok: false, message: NOT_ALLOWED };

  const parsed = termSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const supabase = await createClient();
  const { error } = termId
    ? await supabase.from("terms").update(parsed.data).eq("id", termId)
    : await supabase.from("terms").insert(parsed.data);
  if (error) return { ok: false, message: "Could not save. Try again." };

  revalidatePath("/settings");
  return { ok: true };
}

export async function setTermLocked(termId: string, locked: boolean): Promise<DialogResult> {
  if (!(await isAdmin())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase.from("terms").update({ results_locked: locked }).eq("id", termId);
  if (error) return { ok: false, message: "Could not update. Try again." };

  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteTerm(termId: string): Promise<DialogResult> {
  if (!(await isAdmin())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase.from("terms").delete().eq("id", termId);
  if (error) {
    return { ok: false, message: "This term has results recorded against it, so it cannot be deleted." };
  }

  revalidatePath("/settings");
  return { ok: true };
}
