import { createClient } from "@/lib/supabase/server";
import { requireSchool } from "@/lib/school";

import {
  TimetableBoard,
  type BoardClassSubject,
  type BoardSlot,
} from "@/components/timetable/TimetableBoard";
import type { Room } from "@/lib/types";

const SUBJECT_JOIN =
  "id, intake_id, instructor_id, subject:subjects(name), intake:intakes(label, start_date, course:courses(name)), instructor:instructors(full_name)";

export default async function TimetablePage() {
  const { terms: t, fmt } = await requireSchool();
  const supabase = await createClient();

  const [{ data: slotRows }, { data: subjectRows }, { data: rooms }, { data: instructors }, { data: termRows }] =
    await Promise.all([
      supabase
        .from("timetable_slots")
        .select(
          `id, day_of_week, starts_at, ends_at, room_id, term_id, intake_subject_id, intake_subject:intake_subjects(${SUBJECT_JOIN})`,
        )
        .order("day_of_week")
        .order("starts_at"),
      supabase.from("intake_subjects").select(SUBJECT_JOIN),
      supabase.from("rooms").select("*").is("archived_at", null).order("name").returns<Room[]>(),
      supabase.from("instructors").select("id, full_name").is("archived_at", null).order("full_name"),
      supabase.from("terms").select("id, name, academic_year").order("start_date"),
    ]);

  const label = (i: { label: string | null; start_date: string } | null) =>
    i ? i.label || fmt.monthYear(i.start_date) : "";

  const classSubjects: BoardClassSubject[] = (subjectRows ?? [])
    .filter((r) => r.subject && r.intake)
    .map((r) => ({
      id: r.id,
      intake_id: r.intake_id,
      instructor_id: r.instructor_id,
      subject_name: r.subject!.name,
      intake_label: label(r.intake),
      course_name: r.intake!.course?.name ?? "",
      teacher_name: r.instructor?.full_name ?? null,
    }));

  const slots: BoardSlot[] = (slotRows ?? [])
    .filter((s) => s.intake_subject?.subject && s.intake_subject.intake)
    .map((s) => ({
      id: s.id,
      day_of_week: s.day_of_week,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      room_id: s.room_id,
      term_id: s.term_id,
      intake_subject_id: s.intake_subject_id,
      intake_id: s.intake_subject!.intake_id,
      instructor_id: s.intake_subject!.instructor_id,
      subject_name: s.intake_subject!.subject!.name,
      intake_label: label(s.intake_subject!.intake),
      teacher_name: s.intake_subject!.instructor?.full_name ?? null,
    }));

  // One entry per intake that has subjects to schedule.
  const intakes = [
    ...new Map(
      classSubjects.map((c) => [c.intake_id, { id: c.intake_id, label: c.intake_label, course_name: c.course_name }]),
    ).values(),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold">Timetable</h1>
        <p className="text-[12.5px] text-ink-soft">
          The weekly schedule. A {t.instructor.one.toLowerCase()}, room or {t.intake.one.toLowerCase()} can only be in one place at a time.
        </p>
      </div>
      <TimetableBoard
        slots={slots}
        classSubjects={classSubjects}
        rooms={rooms ?? []}
        intakes={intakes}
        teachers={instructors ?? []}
        terms={termRows ?? []}
      />
    </div>
  );
}
