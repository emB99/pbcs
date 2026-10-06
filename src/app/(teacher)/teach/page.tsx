import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSchool } from "@/lib/school";
import { Card, CardHead } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, monthYearLabel } from "@/lib/dates";
import { DAY_LABELS, todayDayOfWeek, trimSeconds } from "@/lib/time";

export default async function TeachHomePage() {
  const { terms: t, displayName } = await requireSchool();
  const supabase = await createClient();
  const { data: classes } = await supabase.rpc("my_classes");
  const rows = classes ?? [];
  const { data: formClasses } = await supabase.rpc("my_form_classes");
  const inCharge = formClasses ?? [];
  const { data: week } = await supabase.rpc("my_timetable");
  const dayNow = todayDayOfWeek();
  const today = (week ?? []).filter((s) => s.day_of_week === dayNow);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-xl font-semibold">My classes</h1>
        <p className="text-[12.5px] text-ink-soft">
          The {t.subject.many.toLowerCase()} you teach, {displayName.split(" ")[0]}.
        </p>
      </div>

      <Card>
        <CardHead title="Today" note={DAY_LABELS[dayNow - 1]}>
          <Link href="/teach/timetable" className="text-[12.5px] font-semibold text-crust-deep hover:underline">
            Full timetable
          </Link>
        </CardHead>
        {today.length === 0 ? (
          <p className="px-5 pb-4 text-[13px] text-ink-soft">Nothing scheduled today.</p>
        ) : (
          <ul className="flex flex-col">
            {today.map((s) => (
              <li key={s.slot_id} className="flex items-center gap-4 border-t border-line-soft px-5 py-3 first:border-t-0">
                <div className="w-[104px] flex-none text-[13px] font-semibold tabular-nums">
                  {trimSeconds(s.starts_at)}–{trimSeconds(s.ends_at)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold">{s.subject_name}</div>
                  <div className="truncate text-[12px] text-ink-soft">
                    {[s.intake_label ?? s.course_name, s.room_name].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            message={`Nothing assigned yet. The office assigns you to a ${t.subject.one.toLowerCase()} on a ${t.intake.one.toLowerCase()} page.`}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((c) => (
            <Link key={c.intake_subject_id} href={`/teach/${c.intake_subject_id}`}>
              <Card className="h-full p-5 transition-shadow hover:shadow-[0_2px_10px_rgba(31,27,22,0.1)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display truncate text-[17px] font-semibold">{c.subject_name}</div>
                    {c.subject_code && <div className="text-[12px] text-ink-soft">{c.subject_code}</div>}
                  </div>
                  <span className="flex flex-none items-center gap-1.5 rounded-full bg-crust-tint px-2.5 py-1 text-[11.5px] font-semibold text-crust-deep">
                    <Users className="h-3.5 w-3.5" />
                    {c.student_count}
                  </span>
                </div>
                <div className="mt-3 text-[13px] text-ink-mid">
                  {c.course_name} · {c.intake_label || monthYearLabel(c.start_date)}
                </div>
                <div className="mt-0.5 text-[12px] text-ink-soft">
                  {formatDate(c.start_date)}
                  {c.end_date ? ` – ${formatDate(c.end_date)}` : ""}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {inCharge.length > 0 && (
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">
              {t.intake.many} you are in charge of
            </h2>
            <p className="text-[12.5px] text-ink-soft">Write the report card comments for your students.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {inCharge.map((c) => (
              <Link key={c.intake_id} href={`/teach/reports/${c.intake_id}`}>
                <Card className="h-full p-5 transition-shadow hover:shadow-[0_2px_10px_rgba(31,27,22,0.1)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-display text-[16px] font-semibold">
                      {c.intake_label || monthYearLabel(c.start_date)}
                    </div>
                    <span className="flex flex-none items-center gap-1.5 rounded-full bg-crust-tint px-2.5 py-1 text-[11.5px] font-semibold text-crust-deep">
                      <Users className="h-3.5 w-3.5" />
                      {c.student_count}
                    </span>
                  </div>
                  <div className="mt-2 text-[13px] text-ink-mid">{c.course_name}</div>
                  <div className="mt-2 text-[12px] font-semibold text-crust-deep">Report comments →</div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
