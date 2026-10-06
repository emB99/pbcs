import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, UserPlus, CreditCard, FileText, Eye, GraduationCap, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSchool } from "@/lib/school";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LabelAboveValue } from "@/components/ui/FieldGroup";
import { BalanceWithBar } from "@/components/ui/BalanceWithBar";
import { Tag } from "@/components/ui/Tag";
import { ActionButton } from "@/components/ui/ActionButton";
import { MessageHistory } from "@/components/students/MessageHistory";
import { emailBalanceReminder } from "@/lib/actions/messages";

import { StudentArchiveButton } from "@/components/students/StudentArchiveButton";
import { StudentBanner } from "@/components/students/StudentBanner";
import { StudentDetailTabs } from "@/components/students/StudentDetailTabs";
import { StudentGrades, type GradeGroup } from "@/components/students/StudentGrades";
import { GuardiansPanel } from "@/components/students/GuardiansPanel";
import { InstalmentsPanel, type InstalmentRow } from "@/components/instalments/InstalmentsPanel";
import { DocumentsPanel, type DocumentRow } from "@/components/students/DocumentsPanel";
import { PhotoButton } from "@/components/students/PhotoButton";
import { WithdrawButton } from "@/components/enrolments/WithdrawButton";
import { CompleteButton } from "@/components/enrolments/CompleteButton";
import { AddChargeButton } from "@/components/enrolments/AddChargeButton";
import { TransactionLedger } from "@/components/payments/TransactionLedger";
import type { Guardian, Message, Student, StudentDocument, Transaction } from "@/lib/types";

const SIGNED_URL_SECONDS = 60 * 60;

const GENDER_LABEL: Record<string, string> = { female: "Female", male: "Male", other: "Other" };

const EVENT_LABEL = { enrolled: "Enrolled", completed: "Completed", withdrawn: "Withdrawn" } as const;

export default async function StudentDetailPage(props: PageProps<"/students/[studentId]">) {
  const { studentId } = await props.params;
  const { guardian: guardianFlag, plan: planFlag } = await props.searchParams;
  const { terms: t, fmt } = await requireSchool();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle<Student>();

  if (!student) notFound();

  const { data: enrolments } = await supabase
    .from("enrolments")
    .select(
      "id, agreed_price, status, price_note, enrolled_on, intake:intakes(id, label, start_date, course:courses(name, kind))",
    )
    .eq("student_id", studentId)
    .order("enrolled_on", { ascending: false });

  const enrolmentIds = (enrolments ?? []).map((e) => e.id);
  const idFilter = enrolmentIds.length > 0 ? enrolmentIds : [""];

  const [
    { data: balances },
    { data: transactions },
    { data: events },
    { data: guardians },
    { data: documents },
    { data: gradeRows },
    { data: bands },
    { data: planRows },
    { data: messages },
  ] = await Promise.all([
    supabase
      .from("enrolment_balances")
      .select("enrolment_id, charged, paid, balance")
      .in("enrolment_id", idFilter),
    supabase
      .from("transactions")
      .select("*")
      .in("enrolment_id", idFilter)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<Transaction[]>(),
    supabase
      .from("enrolment_status_events")
      .select("enrolment_id, to_status, changed_at")
      .in("enrolment_id", idFilter)
      .order("changed_at"),
    supabase
      .from("guardians")
      .select("*")
      .eq("student_id", studentId)
      .order("is_primary", { ascending: false })
      .order("created_at")
      .returns<Guardian[]>(),
    supabase
      .from("student_documents")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .returns<StudentDocument[]>(),
    supabase
      .from("grades")
      .select(
        "enrolment_id, mark, grade, comment, term:terms(name, academic_year, start_date), intake_subject:intake_subjects(subject:subjects(name, sort_order))",
      )
      .in("enrolment_id", idFilter),
    supabase.from("grade_scale_bands").select("grade, is_pass"),
    supabase
      .from("instalment_status")
      .select("instalment_id, enrolment_id, due_on, amount, covered, is_paid, is_overdue, days_overdue, note")
      .in("enrolment_id", idFilter)
      .order("due_on"),
    supabase
      .from("messages")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<Message[]>(),
  ]);

  const planByEnrolment = new Map<string, InstalmentRow[]>();
  for (const p of planRows ?? []) {
    if (!p.instalment_id || !p.enrolment_id || !p.due_on) continue;
    const list = planByEnrolment.get(p.enrolment_id) ?? [];
    list.push({
      id: p.instalment_id,
      due_on: p.due_on,
      amount: Number(p.amount),
      covered: Number(p.covered),
      is_paid: Boolean(p.is_paid),
      is_overdue: Boolean(p.is_overdue),
      days_overdue: Number(p.days_overdue ?? 0),
      note: p.note,
    });
    planByEnrolment.set(p.enrolment_id, list);
  }

  const passByGrade = new Map((bands ?? []).map((b) => [b.grade, b.is_pass]));
  const gradeGroups: GradeGroup[] = (enrolments ?? []).map((e) => ({
    id: e.id,
    title: e.intake?.course?.name ?? "—",
    subtitle: e.intake?.label || (e.intake?.start_date ? fmt.monthYear(e.intake.start_date) : ""),
    lines: (gradeRows ?? [])
      .filter((g) => g.enrolment_id === e.id && (g.mark !== null || g.grade))
      .map((g) => ({
        term: g.term ? `${g.term.name} ${g.term.academic_year}` : "Final",
        termSort: g.term?.start_date ?? "9999-12-31",
        subject: g.intake_subject?.subject?.name ?? "Unknown",
        subjectSort: g.intake_subject?.subject?.sort_order ?? 0,
        mark: g.mark,
        grade: g.grade,
        pass: g.grade ? (passByGrade.get(g.grade) ?? null) : null,
        comment: g.comment,
      })),
  }));
  const gradeCount = gradeGroups.reduce((n, g) => n + g.lines.length, 0);

  // Private buckets: hand the browser short-lived signed URLs.
  const photoUrl = student.photo_path
    ? ((await supabase.storage.from("student-photos").createSignedUrl(student.photo_path, SIGNED_URL_SECONDS))
        .data?.signedUrl ?? null)
    : null;
  const docPaths = (documents ?? []).map((d) => d.storage_path);
  const signed =
    docPaths.length > 0
      ? (await supabase.storage.from("student-documents").createSignedUrls(docPaths, SIGNED_URL_SECONDS)).data
      : [];
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  const documentRows: DocumentRow[] = (documents ?? []).map((d) => ({
    ...d,
    url: urlByPath.get(d.storage_path) ?? null,
  }));

  const balanceByEnrolment = new Map((balances ?? []).map((b) => [b.enrolment_id, b]));
  const studentBalance = (balances ?? []).reduce((sum, b) => sum + Number(b.balance), 0);
  const eventsByEnrolment = new Map<string, { to_status: keyof typeof EVENT_LABEL; changed_at: string }[]>();
  for (const ev of events ?? []) {
    const list = eventsByEnrolment.get(ev.enrolment_id) ?? [];
    list.push(ev);
    eventsByEnrolment.set(ev.enrolment_id, list);
  }

  const enrolmentsContent = (
    <div className="flex flex-col">
      {(enrolments ?? []).length === 0 && (
        <EmptyState
          message="Not enrolled in anything yet."
          action={
            <Link href={`/enrolments/new?studentId=${student.id}`}>
              <Button variant="primary" icon={<UserPlus />}>
                Enrol {student.full_name.split(" ")[0]}
              </Button>
            </Link>
          }
        />
      )}
      {(enrolments ?? []).map((e) => {
        const bal = balanceByEnrolment.get(e.id);
        const intake = e.intake;
        const history = eventsByEnrolment.get(e.id) ?? [];
        return (
          <div key={e.id} className="border-t border-line-soft first:border-t-0">
          <div className="flex items-center justify-between gap-3 px-5 py-3.5">
            <Link
              href={intake?.id ? `/intakes/${intake.id}` : "#"}
              className="min-w-0 flex-1 hover:opacity-80"
            >
              <div className="font-semibold">{intake?.course?.name ?? "—"}</div>
              <div className="text-[11.5px] text-ink-soft">
                {intake?.label || (intake?.start_date && fmt.monthYear(intake.start_date))}
                {" · "}
                <Tag variant={e.status === "withdrawn" ? "late" : e.status === "completed" ? "ok" : "due"}>
                  {e.status}
                </Tag>
              </div>
              {history.length > 0 && (
                <div className="mt-1 text-[11px] text-ink-soft">
                  {history
                    .map((h) => `${EVENT_LABEL[h.to_status]} ${fmt.date(h.changed_at.slice(0, 10))}`)
                    .join(" · ")}
                </div>
              )}
            </Link>
            <div className="flex flex-col items-end gap-1">
              <Link href={`/print/report/${e.id}`} className="text-[11.5px] font-semibold text-brand-deep hover:underline">
                Report card
              </Link>
              {e.status === "completed" && (
                <Link href={`/print/certificate/${e.id}`} className="text-[11.5px] font-semibold text-brand-deep hover:underline">
                  Certificate
                </Link>
              )}
            </div>
            {e.status === "enrolled" && (
              <div className="flex flex-col items-end gap-1">
                <AddChargeButton
                  enrolmentId={e.id}
                  courseName={intake?.course?.name ?? "this enrolment"}
                />
                <CompleteButton enrolmentId={e.id} studentName={student.full_name} />
                <WithdrawButton
                  enrolmentId={e.id}
                  studentName={student.full_name}
                  balance={Number(bal?.balance ?? 0)}
                />
              </div>
            )}
            <BalanceWithBar
              balance={bal?.balance ?? "0"}
              charged={bal?.charged ?? "0"}
              paid={bal?.paid ?? "0"}
            />
          </div>
          <InstalmentsPanel
            enrolmentId={e.id}
            rows={planByEnrolment.get(e.id) ?? []}
            balance={Number(bal?.balance ?? 0)}
            editable={e.status === "enrolled"}
          />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <StudentBanner
        id={student.id}
        name={student.full_name}
        studentNumber={student.student_number}
        status={student.status}
        photoUrl={photoUrl}
        phone={student.phone}
        enrolmentCount={enrolments?.length ?? 0}
        balanceLabel={fmt.money(studentBalance)}
      />

      {planFlag === "failed" && (
        <p className="rounded-md bg-warning px-4 py-3 text-[13px] text-warning-ink">
          The student was enrolled, but the payment plan could not be created. Set it up from the enrolment below.
        </p>
      )}

      {guardianFlag === "failed" && (
        <p className="rounded-md bg-warning px-4 py-3 text-[13px] text-warning-ink">
          The student was saved, but the {t.guardian.one.toLowerCase()} could not be. Add them from the{" "}
          {t.guardian.many} tab below.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/payments/new?studentId=${student.id}`}>
          <Button variant="primary" icon={<CreditCard />}>
            Record a payment
          </Button>
        </Link>
        <Link href={`/enrolments/new?studentId=${student.id}`}>
          <Button icon={<UserPlus />}>Enrol</Button>
        </Link>
        <Link href={`/print/statement/${student.id}`}>
          <Button icon={<FileText />}>Statement</Button>
        </Link>
        <Link href={`/print/transcript/${student.id}`}>
          <Button icon={<GraduationCap />}>Transcript</Button>
        </Link>
        <Link href={`/preview/student/${student.id}`}>
          <Button icon={<Eye />}>Preview student view</Button>
        </Link>
        {studentBalance > 0 && (
          <ActionButton
            label="Email reminder"
            icon={<Mail />}
            action={emailBalanceReminder.bind(null, student.id)}
            confirm={{
              title: "Email a balance reminder?",
              description: `This emails ${student.full_name.split(" ")[0]}'s outstanding balance of ${fmt.money(studentBalance)} to the student, or a guardian if they have no email.`,
              confirmLabel: "Send reminder",
            }}
          />
        )}
        <PhotoButton studentId={student.id} hasPhoto={Boolean(student.photo_path)} />
        <Link href={`/students/${student.id}/edit`}>
          <Button icon={<Pencil />}>Edit</Button>
        </Link>
        <StudentArchiveButton id={student.id} name={student.full_name} />
      </div>

      <Card>
        <CardHead title="Basic details" />
        <div className="grid grid-cols-2 gap-4 p-5 max-[520px]:grid-cols-1 sm:grid-cols-3">
          <LabelAboveValue label="Date of birth" value={student.date_of_birth ? fmt.date(student.date_of_birth) : null} />
          <LabelAboveValue label="Gender" value={student.gender ? GENDER_LABEL[student.gender] : null} />
          <LabelAboveValue label="Phone" value={student.phone} />
          <LabelAboveValue label="Email" value={student.email} />
          <LabelAboveValue label="National ID" value={student.national_id} />
          <LabelAboveValue label="Address" value={student.address} />
          <div className="col-span-full">
            <LabelAboveValue label="Notes" value={student.notes} />
          </div>
        </div>
      </Card>

      <StudentDetailTabs
        tabs={[
          { key: "enrolments", label: `${t.enrolment.many} (${enrolments?.length ?? 0})`, content: enrolmentsContent },
          {
            key: "grades",
            label: `Grades (${gradeCount})`,
            content: <StudentGrades groups={gradeGroups} />,
          },
          {
            key: "guardians",
            label: `${t.guardian.many} (${guardians?.length ?? 0})`,
            content: <GuardiansPanel studentId={student.id} guardians={guardians ?? []} />,
          },
          {
            key: "documents",
            label: `Documents (${documentRows.length})`,
            content: <DocumentsPanel studentId={student.id} documents={documentRows} />,
          },
          {
            key: "emails",
            label: `Emails (${messages?.length ?? 0})`,
            content: <MessageHistory messages={messages ?? []} fmt={fmt} />,
          },
          {
            key: "ledger",
            label: `Ledger (${transactions?.length ?? 0})`,
            content: <TransactionLedger transactions={transactions ?? []} />,
          },
        ]}
      />
    </div>
  );
}
