import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSchool } from "@/lib/school";
import { loadReportCards } from "@/lib/db/reports";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrintButton } from "@/components/ui/PrintButton";
import { PrintTermPicker } from "@/components/reports/PrintTermPicker";
import { ReportCard } from "@/components/reports/ReportCard";

/** Every active student's report card for one class, one per printed page. */
export default async function ClassReportCardsPage(props: PageProps<"/print/reports/[intakeId]">) {
  const { intakeId } = await props.params;
  const { term: termParam } = await props.searchParams;
  const { terms: t, settings } = await requireSchool();

  const supabase = await createClient();
  const { data: intake } = await supabase.from("intakes").select("id").eq("id", intakeId).maybeSingle();
  if (!intake) notFound();

  const data = await loadReportCards({ intakeId }, Array.isArray(termParam) ? termParam[0] : termParam);

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/intakes/${intakeId}`}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-mid hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {t.intake.one.toLowerCase()}
        </Link>
        <div className="flex items-center gap-2">
          <PrintTermPicker terms={data.terms} termId={data.term?.id ?? null} basePath={`/print/reports/${intakeId}`} />
          <PrintButton label={`Print ${data.cards.length} report cards`} />
        </div>
      </div>

      {data.cards.length === 0 ? (
        <EmptyState message={`No active students in this ${t.intake.one.toLowerCase()}.`} />
      ) : (
        data.cards.map((card, i) => (
          <ReportCard
            key={card.enrolmentId}
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
            breakAfter={i < data.cards.length - 1}
          />
        ))
      )}
    </div>
  );
}
