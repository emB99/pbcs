"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOT_ALLOWED, getOfficeContext } from "@/lib/school";
import { instalmentSchema, planSchema } from "@/lib/validation/instalments";
import type { DialogResult } from "@/lib/types";

function refresh() {
  revalidatePath("/students/[studentId]", "page");
  revalidatePath("/dashboard");
}

/** Splits a total into equal instalments. The maths happens in the database, exactly. */
export async function createPlan(
  enrolmentId: string,
  input: { count: number; frequency: string; first_due: string; total: string },
): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const parsed = planSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_instalment_plan", {
    p_enrolment_id: enrolmentId,
    p_count: parsed.data.count,
    p_first_due: parsed.data.first_due,
    p_frequency: parsed.data.frequency,
    p_total: Number(parsed.data.total),
  });
  if (error) {
    // Raised by the function with a plain-English message (already planned, too small, ...).
    if (error.code === "P0001") return { ok: false, message: error.message };
    return { ok: false, message: "Could not create the plan. Try again." };
  }

  refresh();
  return { ok: true };
}

export async function saveInstalment(
  enrolmentId: string,
  instalmentId: string | null,
  input: { due_on: string; amount: string; note: string },
): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const parsed = instalmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }
  const row = { due_on: parsed.data.due_on, amount: Number(parsed.data.amount), note: parsed.data.note };

  const supabase = await createClient();
  const { error } = instalmentId
    ? await supabase.from("instalments").update(row).eq("id", instalmentId).eq("enrolment_id", enrolmentId)
    : await supabase.from("instalments").insert({ ...row, enrolment_id: enrolmentId });
  if (error) return { ok: false, message: "Could not save. Try again." };

  refresh();
  return { ok: true };
}

export async function deleteInstalment(enrolmentId: string, instalmentId: string): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase
    .from("instalments")
    .delete()
    .eq("id", instalmentId)
    .eq("enrolment_id", enrolmentId);
  if (error) return { ok: false, message: "Could not remove it. Try again." };

  refresh();
  return { ok: true };
}

/** Removes the whole plan for an enrolment. What has been paid is unaffected. */
export async function clearPlan(enrolmentId: string): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase.from("instalments").delete().eq("enrolment_id", enrolmentId);
  if (error) return { ok: false, message: "Could not remove the plan. Try again." };

  refresh();
  return { ok: true };
}
