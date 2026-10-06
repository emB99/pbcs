import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSchool } from "@/lib/school";
import { loadTranscript } from "@/lib/db/reports";

import { PrintButton } from "@/components/ui/PrintButton";
import { Letterhead } from "@/components/reports/ReportCard";

const STATUS_LABEL: Record<string, string> = {
  enrolled: "In progress",
  completed: "Completed",
  withdrawn: "Withdrawn",
};

export default async function TranscriptPage(props: PageProps<"/print/transcript/[studentId]">) {
  const { studentId } = await props.params;
  const { terms: t, settings, fmt } = await requireSchool();

  const result = await loadTranscript(studentId);
  if (!result) notFound();
  const { student, transcript } = result;

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link
          href={`/students/${student.id}`}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-mid hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to student
        </Link>
        <PrintButton label="Print transcript" />
      </div>

      <div className="rounded-lg border border-line bg-surface p-8 print:rounded-none print:border-0 print:p-0">
        <Letterhead
          school={settings}
          title="Academic transcript"
          right={`Issued ${fmt.date(fmt.today())}`}
        />

        <div className="mb-6 grid grid-cols-2 gap-4 text-[13px] sm:grid-cols-3">
          <div>
            <div className="text-[10.5px] font-semibold tracking-[0.05em] text-ink-soft uppercase">Student</div>
            <div className="mt-0.5 font-medium">{student.full_name}</div>
          </div>
          <div>
            <div className="text-[10.5px] font-semibold tracking-[0.05em] text-ink-soft uppercase">Student no.</div>
            <div className="mt-0.5 font-medium">{student.student_number}</div>
          </div>
          <div>
            <div className="text-[10.5px] font-semibold tracking-[0.05em] text-ink-soft uppercase">Date of birth</div>
            <div className="mt-0.5 font-medium">
              {student.date_of_birth ? fmt.date(student.date_of_birth) : "—"}
            </div>
          </div>
        </div>

        {transcript.length === 0 && <p className="py-6 text-center text-[13px] text-ink-soft">No enrolments on record.</p>}

        {transcript.map((e) => (
          <section key={e.id} className="statement-line mb-6">
            <div className="flex items-baseline justify-between gap-3 border-b border-ink-soft pb-1.5">
              <div className="text-[14px] font-semibold">
                {e.courseName}
                {e.intakeLabel && <span className="font-normal text-ink-soft"> · {e.intakeLabel}</span>}
              </div>
              <div className="text-[12px] text-ink-soft">
                {STATUS_LABEL[e.status] ?? e.status} · {fmt.date(e.enrolledOn)}
                {e.endedOn ? ` – ${fmt.date(e.endedOn)}` : ""}
              </div>
            </div>
            {e.lines.length === 0 ? (
              <p className="py-3 text-[12.5px] text-ink-soft">No results recorded.</p>
            ) : (
              <table className="mt-1 w-full border-collapse text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] font-semibold tracking-[0.05em] text-ink-soft uppercase">
                    <th className="py-1.5">{t.term.one}</th>
                    <th className="py-1.5">{t.subject.one}</th>
                    <th className="py-1.5 text-right">Mark</th>
                    <th className="py-1.5 pl-4">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {e.lines.map((l, i) => (
                    <tr key={i} className="border-t border-line-soft">
                      <td className="py-1.5 text-ink-mid">{l.term}</td>
                      <td className="py-1.5 font-medium">{l.subject}</td>
                      <td className="py-1.5 text-right tabular-nums">{l.mark === null ? "—" : l.mark}</td>
                      <td className="py-1.5 pl-4">
                        {l.grade ?? "—"}
                        {l.pass === false && <span className="ml-1.5 text-[11px] text-danger">(fail)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {e.average !== null && (
                  <tfoot>
                    <tr className="border-t border-ink-soft">
                      <td className="pt-2 font-semibold" colSpan={2}>
                        Average
                      </td>
                      <td className="pt-2 text-right font-semibold tabular-nums">{e.average.toFixed(1)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </section>
        ))}

        <div className="mt-10 grid grid-cols-2 gap-8 text-[12px] text-ink-soft">
          <div className="border-t border-ink-soft pt-1.5">Registrar signature</div>
          <div className="border-t border-ink-soft pt-1.5">Date and stamp</div>
        </div>
      </div>
    </div>
  );
}
