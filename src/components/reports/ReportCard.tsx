import { formatDate } from "@/lib/dates";
import { logoUrl } from "@/lib/brand";
import { SchoolLogo } from "@/components/school/SchoolLogo";
import type { ReportCardData, ReportTerm } from "@/lib/db/reports";
import type { GradeBand } from "@/lib/types";

export type SchoolHeader = {
  name: string;
  logo_path?: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
};

/** The school letterhead shared by every printout. */
export function Letterhead({ school, title, right }: { school: SchoolHeader; title: string; right?: string }) {
  const contact = [school.address, school.phone, school.email].filter(Boolean).join(" · ");
  const logo = logoUrl(school.logo_path);
  return (
    <header className="mb-6 flex items-start justify-between gap-4 border-b border-line-soft pb-5">
      <div className="flex items-start gap-3.5">
        {logo && <SchoolLogo logoUrl={logo} size="lg" />}
        <div>
          <h1 className="font-display text-xl font-semibold">{school.name}</h1>
          {contact && <p className="mt-0.5 text-[11.5px] text-ink-soft">{contact}</p>}
          <p className="mt-2 text-[13px] font-semibold tracking-[0.04em] text-ink-mid uppercase">{title}</p>
        </div>
      </div>
      {right && <p className="flex-none text-[12px] text-ink-soft">{right}</p>}
    </header>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold tracking-[0.05em] text-ink-soft uppercase">{label}</div>
      <div className="mt-0.5 text-[13px] font-medium">{value || "—"}</div>
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function ReportCard({
  card,
  term,
  school,
  bands,
  labels,
  breakAfter,
}: {
  card: ReportCardData;
  term: ReportTerm | null;
  school: SchoolHeader;
  bands: GradeBand[];
  labels: { course: string; intake: string; subject: string; instructor: string };
  /** Start the next card on a new page when printing a class. */
  breakAfter: boolean;
}) {
  const termLabel = term ? `${term.name} ${term.academic_year}` : "Final results";
  const sortedBands = [...bands].sort((a, b) => b.min_mark - a.min_mark);

  return (
    <section
      className={`rounded-lg border border-line bg-surface p-8 print:rounded-none print:border-0 print:p-0 ${
        breakAfter ? "mb-6 print:mb-0 print:break-after-page" : ""
      }`}
    >
      <Letterhead school={school} title={`Report card · ${termLabel}`} right={`Issued ${formatDate(new Date().toISOString().slice(0, 10))}`} />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Student" value={card.student.full_name} />
        <Field label="Student no." value={card.student.student_number} />
        <Field label="Date of birth" value={card.student.date_of_birth ? formatDate(card.student.date_of_birth) : null} />
        <Field label={labels.intake} value={card.intakeLabel} />
        <Field label={labels.course} value={card.courseName} />
        <Field label={labels.instructor} value={card.classTeacher} />
      </div>

      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line-soft text-left text-[11px] font-semibold tracking-[0.05em] text-ink-soft uppercase">
            <th className="py-2">{labels.subject}</th>
            <th className="py-2 text-right">Mark</th>
            <th className="py-2 pl-4">Grade</th>
            <th className="py-2 pl-4">Comment</th>
          </tr>
        </thead>
        <tbody>
          {card.rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-ink-soft">
                No results recorded for this period.
              </td>
            </tr>
          )}
          {card.rows.map((r, i) => (
            <tr key={i} className="statement-line border-b border-line-soft">
              <td className="py-2 font-medium">{r.subject}</td>
              <td className="py-2 text-right tabular-nums">{r.mark === null ? "—" : r.mark}</td>
              <td className="py-2 pl-4">
                {r.grade ?? "—"}
                {r.pass === false && <span className="ml-1.5 text-[11px] text-danger">(fail)</span>}
              </td>
              <td className="py-2 pl-4 text-ink-mid">{r.comment}</td>
            </tr>
          ))}
        </tbody>
        {card.average !== null && (
          <tfoot>
            <tr>
              <td className="pt-3 font-semibold">Average</td>
              <td className="pt-3 text-right font-semibold tabular-nums">{card.average.toFixed(1)}</td>
              <td className="pt-3 pl-4" colSpan={2}>
                {card.position !== null && card.outOf > 1 && (
                  <span className="text-ink-mid">
                    Position: {ordinal(card.position)} of {card.outOf}
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        )}
      </table>

      <div className="mt-6 grid gap-4 text-[13px]">
        <div className="statement-line">
          <div className="text-[10.5px] font-semibold tracking-[0.05em] text-ink-soft uppercase">
            {labels.instructor} comment
          </div>
          <p className="mt-1 min-h-[2.5rem] border-b border-line-soft pb-2">{card.classTeacherComment}</p>
        </div>
        <div className="statement-line">
          <div className="text-[10.5px] font-semibold tracking-[0.05em] text-ink-soft uppercase">Head&apos;s comment</div>
          <p className="mt-1 min-h-[2.5rem] border-b border-line-soft pb-2">{card.headComment}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8 text-[12px] text-ink-soft">
        <div className="border-t border-ink-soft pt-1.5">{labels.instructor} signature</div>
        <div className="border-t border-ink-soft pt-1.5">Head&apos;s signature</div>
      </div>

      {sortedBands.length > 0 && (
        <p className="mt-6 text-[11px] text-ink-soft">
          Grading:{" "}
          {sortedBands
            .map((b, i) => {
              const upper = i === 0 ? 100 : sortedBands[i - 1].min_mark - 1;
              return `${b.grade} ${b.min_mark}–${upper}`;
            })
            .join(" · ")}
        </p>
      )}
    </section>
  );
}
