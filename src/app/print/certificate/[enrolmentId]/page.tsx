import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSchool } from "@/lib/school";

import { PrintButton } from "@/components/ui/PrintButton";

/** A completion certificate. Only available once an enrolment is marked completed. */
export default async function CertificatePage(props: PageProps<"/print/certificate/[enrolmentId]">) {
  const { enrolmentId } = await props.params;
  const { terms: t, settings, fmt } = await requireSchool();
  const supabase = await createClient();

  const { data: enrolment } = await supabase
    .from("enrolments")
    .select(
      "id, status, enrolled_on, ended_on, student:students(id, full_name, student_number), intake:intakes(label, start_date, end_date, course:courses(name))",
    )
    .eq("id", enrolmentId)
    .maybeSingle();
  if (!enrolment || !enrolment.student) notFound();

  const backHref = `/students/${enrolment.student.id}`;

  if (enrolment.status !== "completed") {
    return (
      <div className="rounded-lg border border-line bg-surface p-8 text-center">
        <h1 className="font-display text-lg font-semibold">No certificate yet</h1>
        <p className="mt-1 text-[13px] text-ink-mid">
          A certificate can be printed once this {t.enrolment.one.toLowerCase()} is marked completed.
        </p>
        <Link href={backHref} className="mt-4 inline-block text-[13px] font-semibold text-brand-deep hover:underline">
          Back to student
        </Link>
      </div>
    );
  }

  const course = enrolment.intake?.course?.name ?? "";
  const completedOn = enrolment.ended_on ?? fmt.today();

  return (
    <div>
      {/* Certificates read best landscape. */}
      <style>{"@media print { @page { size: A4 landscape; margin: 14mm; } }"}</style>

      <div className="no-print mb-6 flex items-center justify-between">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-mid hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to student
        </Link>
        <PrintButton label="Print certificate" />
      </div>

      <div className="rounded-lg border-4 border-double border-brand bg-surface p-10 text-center print:rounded-none print:bg-white">
        <Award className="mx-auto h-10 w-10 text-brand" strokeWidth={1.4} />
        <p className="mt-3 text-[13px] font-semibold tracking-[0.2em] text-ink-soft uppercase">{settings.name}</p>
        <h1 className="font-display mt-6 text-[34px] font-semibold">Certificate of Completion</h1>
        <p className="mt-6 text-[14px] text-ink-mid">This is to certify that</p>
        <p className="font-display mt-3 text-[30px] font-semibold">{enrolment.student.full_name}</p>
        <p className="mt-5 text-[14px] text-ink-mid">has successfully completed</p>
        <p className="font-display mt-3 text-[22px] font-semibold">{course}</p>
        {enrolment.intake?.label && (
          <p className="mt-1 text-[13px] text-ink-soft">{enrolment.intake.label}</p>
        )}
        <p className="mt-5 text-[13px] text-ink-mid">Completed on {fmt.date(completedOn)}</p>

        <div className="mx-auto mt-14 grid max-w-[560px] grid-cols-2 gap-12 text-[12px] text-ink-soft">
          <div className="border-t border-ink-soft pt-1.5">Head&apos;s signature</div>
          <div className="border-t border-ink-soft pt-1.5">Date</div>
        </div>
        <p className="mt-8 text-[11px] text-ink-soft">Student no. {enrolment.student.student_number}</p>
      </div>
    </div>
  );
}
