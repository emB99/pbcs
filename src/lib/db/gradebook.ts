import "server-only";
import { createClient } from "@/lib/supabase/server";
import { pickTermId } from "@/lib/pick-term";
import type { GradeBand } from "@/lib/types";
import type { GradebookStudent, GradebookTerm } from "@/components/grades/Gradebook";

export type GradebookData = {
  terms: GradebookTerm[];
  termId: string | null;
  students: GradebookStudent[];
  initial: Record<string, { mark: string; grade: string; comment: string }>;
  bands: GradeBand[];
};

/**
 * Everything the gradebook grid needs for one class subject. Reads run as the
 * caller, so row-level security decides what a teacher or office user sees.
 * `termParam` is the ?term= query value: a term id, "final", or absent.
 */
export async function loadGradebook(
  intakeSubjectId: string,
  termParam: string | undefined,
): Promise<GradebookData> {
  const supabase = await createClient();

  const [{ data: termRows }, { data: bandRows }, { data: roster }] = await Promise.all([
    supabase
      .from("terms")
      .select("id, name, academic_year, start_date, end_date, results_locked")
      .order("start_date"),
    supabase.from("grade_scale_bands").select("*").order("min_mark", { ascending: false }),
    supabase.rpc("class_roster", { p_intake_subject_id: intakeSubjectId }),
  ]);

  const terms = termRows ?? [];
  const termId = pickTermId(terms, termParam);

  let query = supabase
    .from("grades")
    .select("enrolment_id, mark, grade, comment")
    .eq("intake_subject_id", intakeSubjectId);
  query = termId ? query.eq("term_id", termId) : query.is("term_id", null);
  const { data: gradeRows } = await query;

  const initial: GradebookData["initial"] = {};
  for (const g of gradeRows ?? []) {
    initial[g.enrolment_id] = {
      mark: g.mark === null ? "" : String(g.mark),
      grade: g.grade ?? "",
      comment: g.comment ?? "",
    };
  }

  return {
    terms: terms.map((t) => ({
      id: t.id,
      name: t.name,
      academic_year: t.academic_year,
      results_locked: t.results_locked,
    })),
    termId,
    students: (roster ?? []).map((r) => ({
      enrolment_id: r.enrolment_id,
      student_id: r.student_id,
      full_name: r.full_name,
      student_number: r.student_number,
    })),
    initial,
    bands: bandRows ?? [],
  };
}
