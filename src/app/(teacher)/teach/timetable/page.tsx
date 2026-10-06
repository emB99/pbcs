import { createClient } from "@/lib/supabase/server";
import { requireSchool } from "@/lib/school";
import { Card, CardHead } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { WeekGrid, type GridSlot } from "@/components/timetable/WeekGrid";
import { todayDayOfWeek, trimSeconds } from "@/lib/time";

export default async function TeacherTimetablePage() {
  const { terms: t } = await requireSchool();
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_timetable");

  const slots: GridSlot[] = (data ?? []).map((s) => ({
    id: s.slot_id,
    day: s.day_of_week,
    start: trimSeconds(s.starts_at),
    end: trimSeconds(s.ends_at),
    title: s.subject_name,
    subtitle: [s.intake_label ?? s.course_name, s.room_name].filter(Boolean).join(" · "),
    colorKey: s.subject_name,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold">My timetable</h1>
        <p className="text-[12.5px] text-ink-soft">
          Your week, as scheduled by the office. It shows this {t.term.one.toLowerCase()}&apos;s slots and any that
          run all year.
        </p>
      </div>
      <Card>
        <CardHead title="This week" note={`${slots.length} ${slots.length === 1 ? "slot" : "slots"}`} />
        {slots.length === 0 ? (
          <EmptyState message="Nothing is scheduled for you yet." />
        ) : (
          <div className="px-3 pb-4">
            <WeekGrid slots={slots} today={todayDayOfWeek()} />
          </div>
        )}
      </Card>
    </div>
  );
}
