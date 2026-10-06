import "server-only";
import { createClient } from "@/lib/supabase/server";
import { pickTermId } from "@/lib/pick-term";
import type { GradeBand } from "@/lib/types";

export type ReportRow = {
  subject: string;
  code: string | null;
  sort: number;
  mark: number | null;
  grade: string | null;
  pass: boolean | null;
  comment: string | null;
};

export type ReportCardData = {
  enrolmentId: string;
  student: {
    id: string;
    full_name: string;
    student_number: string;
    date_of_birth: string | null;
    gender: string | null;
  };
  courseName: string;
  intakeLabel: string;
  classTeacher: string | null;
  rows: ReportRow[];
  average: number | null;
  /** 1-based rank by average within the class; null when this student has no marks. */
  position: number | null;
  /** How many students in the class have marks (the denominator for position). */
  outOf: number;
  classTeacherComment: string | null;
  headComment: string | null;
};

export type ReportTerm = { id: string; name: string; academic_year: string };

export type ReportsData = {
  terms: ReportTerm[];
  term: ReportTerm | null;
  cards: ReportCardData[];
  bands: GradeBand[];
};

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Report cards for one enrolment or a whole intake, for one term (or the
 * single "final" result). Position is ranked against every active student in
 * the same intake, even when only one card is printed.
 */
export async function loadReportCards(
  scope: { enrolmentId: string } | { intakeId: string },
  termParam: string | undefined,
): Promise<ReportsData> {
  const supabase = await createClient();

  const { data: termRows } = await supabase
    .from("terms")
    .select("id, name, academic_year, start_date, end_date")
    .order("start_date");
  const terms = termRows ?? [];
  const termId = pickTermId(terms, termParam);
  const term = terms.find((t) => t.id === termId) ?? null;

  const select =
    "id, intake_id, student:students(id, full_name, student_number, date_of_birth, gender), intake:intakes(id, label, start_date, course:courses(name), instructor:instructors(full_name))";
  const targetQuery =
    "enrolmentId" in scope
      ? supabase.from("enrolments").select(select).eq("id", scope.enrolmentId)
      : supabase.from("enrolments").select(select).eq("intake_id", scope.intakeId).eq("status", "enrolled");
  const [{ data: targets }, { data: bandRows }] = await Promise.all([
    targetQuery,
    supabase.from("grade_scale_bands").select("*").order("min_mark", { ascending: false }),
  ]);
  const bands = bandRows ?? [];
  const passByGrade = new Map(bands.map((b) => [b.grade, b.is_pass]));

  const intakeIds = [...new Set((targets ?? []).map((e) => e.intake_id))];
  const { data: classmates } = await supabase
    .from("enrolments")
    .select("id, intake_id")
    .in("intake_id", intakeIds.length > 0 ? intakeIds : [""])
    .eq("status", "enrolled");

  const allIds = [...new Set([...(classmates ?? []).map((c) => c.id), ...(targets ?? []).map((t) => t.id)])];
  const targetIds = (targets ?? []).map((t) => t.id);

  let gradeQuery = supabase
    .from("grades")
    .select(
      "enrolment_id, mark, grade, comment, intake_subject:intake_subjects(subject:subjects(name, code, sort_order))",
    )
    .in("enrolment_id", allIds.length > 0 ? allIds : [""]);
  gradeQuery = termId ? gradeQuery.eq("term_id", termId) : gradeQuery.is("term_id", null);
  let commentQuery = supabase
    .from("report_comments")
    .select("enrolment_id, class_teacher_comment, head_comment")
    .in("enrolment_id", targetIds.length > 0 ? targetIds : [""]);
  commentQuery = termId ? commentQuery.eq("term_id", termId) : commentQuery.is("term_id", null);
  const [{ data: gradeRows }, { data: commentRows }] = await Promise.all([gradeQuery, commentQuery]);

  const marksByEnrolment = new Map<string, number[]>();
  for (const g of gradeRows ?? []) {
    if (g.mark === null) continue;
    marksByEnrolment.set(g.enrolment_id, [...(marksByEnrolment.get(g.enrolment_id) ?? []), Number(g.mark)]);
  }
  const averageOf = (id: string) => mean(marksByEnrolment.get(id) ?? []);

  const intakeOf = new Map((classmates ?? []).map((c) => [c.id, c.intake_id]));
  for (const t of targets ?? []) intakeOf.set(t.id, t.intake_id);
  const commentByEnrolment = new Map((commentRows ?? []).map((c) => [c.enrolment_id, c]));

  const cards: ReportCardData[] = (targets ?? [])
    .filter((e) => e.student)
    .map((e) => {
      const average = averageOf(e.id);
      const sameClass = allIds.filter((id) => intakeOf.get(id) === e.intake_id);
      const ranked = sameClass.map((id) => averageOf(id)).filter((a): a is number => a !== null);
      const position = average === null ? null : 1 + ranked.filter((a) => a > average).length;
      const rows: ReportRow[] = (gradeRows ?? [])
        .filter((g) => g.enrolment_id === e.id && (g.mark !== null || g.grade))
        .map((g) => ({
          subject: g.intake_subject?.subject?.name ?? "Unknown",
          code: g.intake_subject?.subject?.code ?? null,
          sort: g.intake_subject?.subject?.sort_order ?? 0,
          mark: g.mark === null ? null : Number(g.mark),
          grade: g.grade,
          pass: g.grade ? (passByGrade.get(g.grade) ?? null) : null,
          comment: g.comment,
        }))
        .sort((a, b) => a.sort - b.sort || a.subject.localeCompare(b.subject));
      const comments = commentByEnrolment.get(e.id);
      return {
        enrolmentId: e.id,
        student: e.student!,
        courseName: e.intake?.course?.name ?? "",
        intakeLabel: e.intake?.label ?? "",
        classTeacher: e.intake?.instructor?.full_name ?? null,
        rows,
        average,
        position,
        outOf: ranked.length,
        classTeacherComment: comments?.class_teacher_comment ?? null,
        headComment: comments?.head_comment ?? null,
      };
    })
    .sort((a, b) => a.student.full_name.localeCompare(b.student.full_name));

  return {
    terms: terms.map((t) => ({ id: t.id, name: t.name, academic_year: t.academic_year })),
    term: term ? { id: term.id, name: term.name, academic_year: term.academic_year } : null,
    cards,
    bands,
  };
}

export type TranscriptLine = {
  term: string;
  termSort: string;
  subject: string;
  subjectSort: number;
  mark: number | null;
  grade: string | null;
  pass: boolean | null;
};

export type TranscriptEnrolment = {
  id: string;
  courseName: string;
  intakeLabel: string;
  status: string;
  enrolledOn: string;
  endedOn: string | null;
  lines: TranscriptLine[];
  average: number | null;
};

/** Every enrolment's results for one student, across all terms. */
export async function loadTranscript(studentId: string) {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, student_number, date_of_birth, gender, national_id")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return null;

  const { data: enrolments } = await supabase
    .from("enrolments")
    .select("id, status, enrolled_on, ended_on, intake:intakes(label, start_date, course:courses(name))")
    .eq("student_id", studentId)
    .order("enrolled_on");
  const ids = (enrolments ?? []).map((e) => e.id);

  const [{ data: gradeRows }, { data: bandRows }] = await Promise.all([
    supabase
      .from("grades")
      .select(
        "enrolment_id, mark, grade, term:terms(name, academic_year, start_date), intake_subject:intake_subjects(subject:subjects(name, sort_order))",
      )
      .in("enrolment_id", ids.length > 0 ? ids : [""]),
    supabase.from("grade_scale_bands").select("grade, is_pass"),
  ]);
  const passByGrade = new Map((bandRows ?? []).map((b) => [b.grade, b.is_pass]));

  const transcript: TranscriptEnrolment[] = (enrolments ?? []).map((e) => {
    const lines: TranscriptLine[] = (gradeRows ?? [])
      .filter((g) => g.enrolment_id === e.id && (g.mark !== null || g.grade))
      .map((g) => ({
        term: g.term ? `${g.term.name} ${g.term.academic_year}` : "Final",
        termSort: g.term?.start_date ?? "9999-12-31",
        subject: g.intake_subject?.subject?.name ?? "Unknown",
        subjectSort: g.intake_subject?.subject?.sort_order ?? 0,
        mark: g.mark === null ? null : Number(g.mark),
        grade: g.grade,
        pass: g.grade ? (passByGrade.get(g.grade) ?? null) : null,
      }))
      .sort(
        (a, b) => a.termSort.localeCompare(b.termSort) || a.subjectSort - b.subjectSort || a.subject.localeCompare(b.subject),
      );
    return {
      id: e.id,
      courseName: e.intake?.course?.name ?? "",
      intakeLabel: e.intake?.label ?? "",
      status: e.status,
      enrolledOn: e.enrolled_on,
      endedOn: e.ended_on,
      lines,
      average: mean(lines.map((l) => l.mark).filter((m): m is number => m !== null)),
    };
  });

  return { student, transcript };
}

export type CommentsData = {
  terms: { id: string; name: string; academic_year: string; results_locked: boolean }[];
  termId: string | null;
  students: { enrolment_id: string; student_id: string; full_name: string; student_number: string }[];
  initial: Record<string, { teacher: string; head: string }>;
};

/** Everything the report-comments page needs for one intake and term. */
export async function loadComments(intakeId: string, termParam: string | undefined): Promise<CommentsData> {
  const supabase = await createClient();

  const [{ data: termRows }, { data: roster }] = await Promise.all([
    supabase.from("terms").select("id, name, academic_year, start_date, end_date, results_locked").order("start_date"),
    supabase.rpc("intake_roster", { p_intake_id: intakeId }),
  ]);
  const terms = termRows ?? [];
  const termId = pickTermId(terms, termParam);
  const students = roster ?? [];

  let query = supabase
    .from("report_comments")
    .select("enrolment_id, class_teacher_comment, head_comment")
    .in("enrolment_id", students.length > 0 ? students.map((s) => s.enrolment_id) : [""]);
  query = termId ? query.eq("term_id", termId) : query.is("term_id", null);
  const { data: rows } = await query;

  const initial: CommentsData["initial"] = {};
  for (const r of rows ?? []) {
    initial[r.enrolment_id] = { teacher: r.class_teacher_comment ?? "", head: r.head_comment ?? "" };
  }

  return {
    terms: terms.map((t) => ({ id: t.id, name: t.name, academic_year: t.academic_year, results_locked: t.results_locked })),
    termId,
    students: students.map((s) => ({
      enrolment_id: s.enrolment_id,
      student_id: s.student_id,
      full_name: s.full_name,
      student_number: s.student_number,
    })),
    initial,
  };
}
