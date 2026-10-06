import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSchool } from "@/lib/school";
import { loadReportCards } from "@/lib/db/reports";
import { PrintButton } from "@/components/ui/PrintButton";
import { PrintTermPicker } from "@/components/reports/PrintTermPicker";
import { ReportCard } from "@/components/reports/ReportCard";

export default async function ReportCardPage(props: PageProps<"/print/report/[enrolmentId]">) {
  const { enrolmentId } = await props.params;
  const { term: termParam } = await props.searchParams;
  const { terms: t, settings, fmt } = await requireSchool();

  const data = await loadReportCards({ enrolmentId }, Array.isArray(termParam) ? termParam[0] : termParam);
  const card = data.cards[0];
  if (!card) notFound();

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/students/${card.student.id}`}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-mid hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to student
        </Link>
        <div className="flex items-center gap-2">
          <PrintTermPicker terms={data.terms} termId={data.term?.id ?? null} basePath={`/print/report/${enrolmentId}`} />
          <PrintButton label="Print report card" />
        </div>
      </div>

      <ReportCard
        card={card}
        term={data.term}
        school={settings}
        bands={data.bands}
        labels={{
          course: t.course.one,
          intake: t.intake.one,
          subject: t.subject.one,
          instructor: t.instructor.one,
        }}
        breakAfter={false}
        fmt={fmt}
      />
    </div>
  );
}
