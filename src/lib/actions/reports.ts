"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSchool } from "@/lib/school";
import type { DialogResult } from "@/lib/types";

const rowSchema = z.object({
  enrolment_id: z.string().min(1),
  class_teacher_comment: z.string().trim().max(1000),
  // Ignored by the database for anyone but office staff.
  head_comment: z.string().trim().max(1000).optional(),
});
const inputSchema = z.object({
  term_id: z.string().nullable(),
  rows: z.array(rowSchema).min(1, "Nothing to save."),
});

/**
 * Saves report card comments for a class. Who may write which comment (the
 * class teacher: only their own class's teacher comment; the head's comment:
 * office only) and the term lock are enforced by the database.
 */
export async function saveReportComments(input: {
  term_id: string | null;
  rows: { enrolment_id: string; class_teacher_comment: string; head_comment?: string }[];
}): Promise<DialogResult> {
  await requireSchool();

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the comments." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_report_comments", {
    p_term_id: parsed.data.term_id,
    p_rows: parsed.data.rows,
  });
  if (error) {
    if (error.code === "42501") {
      return { ok: false, message: "These results are locked, or you cannot edit this class." };
    }
    return { ok: false, message: "Could not save the comments. Try again." };
  }

  revalidatePath("/teach", "layout");
  revalidatePath("/intakes", "layout");
  return { ok: true };
}
