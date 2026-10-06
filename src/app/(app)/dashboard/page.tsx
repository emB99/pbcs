import Link from "next/link";
import { CreditCard, UserPlus, FileText, TrendingDown, Users, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHead, CardFoot } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { Tag } from "@/components/ui/Tag";
import { WhoOwesTable, type WhoOwesRow } from "@/components/dashboard/WhoOwesTable";

import { todayIsoDate } from "@/lib/dates";
import { requireSchool } from "@/lib/school";
import { methodLabel } from "@/lib/format";

export default async function DashboardPage() {
  const { terms: t, fmt } = await requireSchool();
  const supabase = await createClient();
  const today = todayIsoDate();

  const [{ data: enrolmentBalances }, { data: allIntakes }, { data: intakeSummary }] =
    await Promise.all([
      supabase.from("enrolment_balances").select("*").eq("status", "enrolled"),
      supabase
        .from("intakes")
        .select("id, label, start_date, end_date, course:courses(name)")
        .order("start_date", { ascending: false }),
      supabase.from("intake_summary").select("*"),
    ]);

  const owingRows = (enrolmentBalances ?? []).filter((r) => Number(r.balance) > 0);
  const totalOutstanding = owingRows.reduce((sum, r) => sum + Number(r.balance), 0);
  const studentsOwingCount = new Set(owingRows.map((r) => r.student_id)).size;
  const over30Total = owingRows
    .filter((r) => !r.last_payment_on || relativeDaysNum(r.last_payment_on) > 30)
    .reduce((sum, r) => sum + Number(r.balance), 0);

  const activeStudentIds = new Set((enrolmentBalances ?? []).map((r) => r.student_id));
  const thisMonthPrefix = today.slice(0, 7);
  const { data: enrolledThisMonth } = await supabase
    .from("enrolments")
    .select("id, enrolled_on")
    .gte("enrolled_on", `${thisMonthPrefix}-01`);

  const runningIntakes = (allIntakes ?? []).filter(
    (i) => i.start_date <= today && (!i.end_date || i.end_date >= today),
  );
  const summaryByIntake = new Map((intakeSummary ?? []).map((s) => [s.intake_id, s]));
  const soonestEnding = runningIntakes
    .filter((i) => i.end_date)
    .sort((a, b) => (a.end_date! < b.end_date! ? -1 : 1))[0];
  const daysToSoonestEnd = soonestEnding?.end_date
    ? Math.round(
        (new Date(soonestEnding.end_date + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  // "Who owes money" needs student + course/intake labels — enrolment_balances
  // is a view with no FK metadata to embed through, so fetch those flat and merge.
  // student_id/intake_id are non-null in practice (NOT NULL on the base
  // tables); the view's generated type just doesn't carry that constraint.
  const owingStudentIds = [
    ...new Set(owingRows.map((r) => r.student_id).filter((id): id is string => id !== null)),
  ];
  const owingIntakeIds = [
    ...new Set(owingRows.map((r) => r.intake_id).filter((id): id is string => id !== null)),
  ];
  const [{ data: owingStudents }, { data: owingIntakes }] = await Promise.all([
    supabase.from("students").select("id, full_name, phone").in("id", owingStudentIds.length ? owingStudentIds : [""]),
    supabase
      .from("intakes")
      .select("id, label, start_date, course:courses(name)")
      .in("id", owingIntakeIds.length ? owingIntakeIds : [""]),
  ]);
  const studentById = new Map((owingStudents ?? []).map((s) => [s.id, s]));
  const intakeById = new Map((owingIntakes ?? []).map((i) => [i.id, i]));

  const whoOwesRows: WhoOwesRow[] = owingRows
    .map((r) => {
      const s = studentById.get(r.student_id ?? "");
      const i = intakeById.get(r.intake_id ?? "");
      return {
        enrolment_id: r.enrolment_id ?? "",
        student_id: r.student_id ?? "",
        full_name: s?.full_name ?? "Unknown",
        phone: s?.phone ?? "",
        course_name: i?.course?.name ?? "—",
        intake_label: i?.label || (i?.start_date ? fmt.monthYear(i.start_date) : "—"),
        agreed_price: r.agreed_price ?? 0,
        charged: r.charged ?? 0,
        paid: r.paid ?? 0,
        balance: r.balance ?? 0,
        last_payment_on: r.last_payment_on,
      };
    })
    .sort((a, b) => Number(b.balance) - Number(a.balance));

  // Instalments that are due and not covered by payments yet (the view decides; see instalment_status).
  const { data: overdueRows } = await supabase
    .from("instalment_status")
    .select("instalment_id, enrolment_id, due_on, outstanding, days_overdue")
    .eq("is_overdue", true)
    .order("due_on");
  const overdueEnrolmentIds = [
    ...new Set((overdueRows ?? []).map((o) => o.enrolment_id).filter((id): id is string => id !== null)),
  ];
  const { data: overdueEnrolments } = await supabase
    .from("enrolments")
    .select("id, student:students(id, full_name), intake:intakes(course:courses(name))")
    .in("id", overdueEnrolmentIds.length ? overdueEnrolmentIds : [""]);
  const overdueEnrolmentById = new Map((overdueEnrolments ?? []).map((e) => [e.id, e]));
  const overdueList = (overdueRows ?? []).filter((o) => o.instalment_id && o.enrolment_id && o.due_on);

  // Recent payments feed: payments and reversals, most recent first.
  const { data: recentTxns } = await supabase
    .from("transactions")
    .select("*")
    .or("kind.eq.payment,reverses_id.not.is.null")
    .order("created_at", { ascending: false })
    .limit(4);
  const recentEnrolmentIds = [...new Set((recentTxns ?? []).map((t) => t.enrolment_id))];
  const { data: recentEnrolments } = await supabase
    .from("enrolments")
    .select("id, student_id")
    .in("id", recentEnrolmentIds.length ? recentEnrolmentIds : [""]);
  const recentStudentIdByEnrolment = new Map((recentEnrolments ?? []).map((e) => [e.id, e.student_id]));
  const recentStudentIds = [...new Set([...recentStudentIdByEnrolment.values()])];
  const { data: recentStudents } = await supabase
    .from("students")
    .select("id, full_name")
    .in("id", recentStudentIds.length ? recentStudentIds : [""]);
  const recentStudentNameById = new Map((recentStudents ?? []).map((s) => [s.id, s.full_name]));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <StatCard
          variant="money"
          icon={<TrendingDown />}
          label="Outstanding"
          value={fmt.moneyWhole(totalOutstanding)}
          sub={
            <>
              across {studentsOwingCount} students · {fmt.moneyWhole(over30Total)} over 30 days
            </>
          }
        />
        <StatCard
          variant="people"
          icon={<Users />}
          label="Active students"
          value={String(activeStudentIds.size)}
          sub={<>{enrolledThisMonth?.length ?? 0} enrolled this month</>}
        />
        <StatCard
          variant="intake"
          icon={<CalendarDays />}
          label={`Running ${t.intake.many.toLowerCase()}`}
          value={String(runningIntakes.length)}
          sub={
            daysToSoonestEnd !== null ? (
              <>1 finishes in {daysToSoonestEnd} days</>
            ) : (
              "—"
            )
          }
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <WhoOwesTable rows={whoOwesRows} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <Link href="/payments/new">
              <Button variant="primary" icon={<CreditCard />} fullWidth>
                Record a payment
              </Button>
            </Link>
            <Link href="/enrolments/new">
              <Button icon={<UserPlus />} fullWidth>
                Enrol a student
              </Button>
            </Link>
            <Link href="/students">
              <Button icon={<FileText />} fullWidth>
                Print a statement
              </Button>
            </Link>
          </div>

          {overdueList.length > 0 && (
            <Card>
              <CardHead
                title="Overdue instalments"
                note={`${overdueList.length} ${overdueList.length === 1 ? "instalment is" : "instalments are"} past due`}
              />
              <div className="flex flex-col">
                {overdueList.slice(0, 6).map((o) => {
                  const e = overdueEnrolmentById.get(o.enrolment_id!);
                  const studentName = e?.student?.full_name ?? "Unknown";
                  return (
                    <Link
                      key={o.instalment_id}
                      href={e?.student ? `/students/${e.student.id}` : "/students"}
                      className="flex items-center gap-2.5 border-t border-line-soft px-5 py-2.5 first:border-t-0 hover:bg-surface-2"
                    >
                      <AvatarInitials id={e?.student?.id ?? o.instalment_id!} name={studentName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <b className="block truncate text-[13px] font-semibold">{studentName}</b>
                        <p className="mt-0.5 truncate text-[11.5px] text-ink-soft">
                          {e?.intake?.course?.name ?? "—"} · due {fmt.date(o.due_on)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="money text-[13px] font-[650] text-danger">{fmt.money(o.outstanding)}</span>
                        <Tag variant="late">{o.days_overdue} {o.days_overdue === 1 ? "day" : "days"} late</Tag>
                      </div>
                    </Link>
                  );
                })}
                {overdueList.length > 6 && (
                  <p className="border-t border-line-soft px-5 py-2.5 text-[12px] text-ink-soft">
                    and {overdueList.length - 6} more
                  </p>
                )}
              </div>
            </Card>
          )}

          <Card>
            <CardHead title="Recent payments" note="Everything posted, including reversals" />
            <div className="flex flex-col">
              {(recentTxns ?? []).length === 0 && (
                <p className="px-5 pb-4 text-[13px] text-ink-soft">Nothing recorded yet.</p>
              )}
              {(recentTxns ?? []).map((t) => {
                const studentId = recentStudentIdByEnrolment.get(t.enrolment_id) ?? "";
                const studentName = recentStudentNameById.get(studentId) ?? "Unknown";
                const isReversal = Boolean(t.reverses_id);
                const amountNum = Number(t.amount_base);
                return (
                  <div
                    key={t.id}
                    className="flex items-start gap-2.5 border-t border-line-soft px-5 py-2.5 first:border-t-0"
                  >
                    <AvatarInitials id={studentId} name={studentName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <b className="block text-[13px] font-semibold">{studentName}</b>
                      <p className="mt-0.5 text-[11.5px] text-ink-soft">
                        {isReversal
                          ? `Reversed — ${t.reversal_reason ?? "no reason given"}`
                          : [methodLabel(t.method), t.reference].filter(Boolean).join(" · ") || "—"}
                        {" · "}
                        {fmt.date(t.occurred_on)}
                      </p>
                    </div>
                    <div
                      className={`money text-[13px] font-[650] whitespace-nowrap ${isReversal ? "text-danger" : ""}`}
                    >
                      {isReversal ? "−" : ""}{fmt.money(Math.abs(amountNum))}
                    </div>
                  </div>
                );
              })}
            </div>
            <CardFoot>
              <div className="min-w-3 flex-1" />
              <Link href="/payments" className="font-semibold text-brand-deep hover:underline">
                All payments
              </Link>
            </CardFoot>
          </Card>

          <Card>
            <CardHead title={`${t.intake.many} running`} note="Chase balances before they finish" />
            <div>
              {runningIntakes.length === 0 && (
                <p className="px-5 pb-4 text-[13px] text-ink-soft">No {t.intake.many.toLowerCase()} running right now.</p>
              )}
              {runningIntakes.map((i) => {
                const summary = summaryByIntake.get(i.id);
                return (
                  <Link
                    key={i.id}
                    href={`/intakes/${i.id}`}
                    className="block border-t border-line-soft px-5 py-3 first:border-t-0 hover:bg-surface-2"
                  >
                    <div className="flex items-baseline gap-2.5">
                      <b className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                        {i.course?.name ?? i.label ?? fmt.monthYear(i.start_date)}
                      </b>
                      <span className="text-[11.5px] whitespace-nowrap text-ink-soft">
                        {i.end_date ? `ends ${fmt.date(i.end_date)}` : "no end date"}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[11.5px] text-ink-soft">
                      <span>{summary?.active_students ?? 0} students</span>
                      <span className="h-1 w-1 rounded-full bg-line" />
                      <span className="font-semibold text-danger">
                        {fmt.moneyWhole(summary?.outstanding ?? 0)} outstanding
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function relativeDaysNum(isoDate: string): number {
  const then = new Date(isoDate + "T00:00:00");
  const now = new Date();
  return Math.round((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}
