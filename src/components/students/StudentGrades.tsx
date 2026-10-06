import { EmptyState } from "@/components/ui/EmptyState";
import { Tag } from "@/components/ui/Tag";

export type GradeLine = {
  term: string;
  termSort: string;
  subject: string;
  subjectSort: number;
  mark: number | null;
  grade: string | null;
  pass: boolean | null;
  comment: string | null;
};

export type GradeGroup = { id: string; title: string; subtitle: string; lines: GradeLine[] };

/** Results per enrolment, grouped by term then subject. Read-only; marks are entered in the gradebook. */
export function StudentGrades({ groups }: { groups: GradeGroup[] }) {
  const withLines = groups.filter((g) => g.lines.length > 0);
  if (withLines.length === 0) return <EmptyState message="No results recorded yet." />;

  return (
    <div className="flex flex-col">
      {withLines.map((g) => {
        const lines = [...g.lines].sort(
          (a, b) => a.termSort.localeCompare(b.termSort) || a.subjectSort - b.subjectSort || a.subject.localeCompare(b.subject),
        );
        return (
          <div key={g.id} className="border-t border-line-soft first:border-t-0">
            <div className="px-5 pt-4">
              <div className="font-semibold">{g.title}</div>
              <div className="text-[11.5px] text-ink-soft">{g.subtitle}</div>
            </div>
            <div className="overflow-x-auto px-5 pb-4">
              <table className="mt-2 w-full min-w-[480px] text-left text-[13px]">
                <thead>
                  <tr className="text-[11px] font-semibold tracking-[0.05em] text-ink-soft uppercase">
                    <th className="py-1.5 pr-3">Term</th>
                    <th className="px-3 py-1.5">Subject</th>
                    <th className="px-3 py-1.5 text-right">Mark</th>
                    <th className="px-3 py-1.5">Grade</th>
                    <th className="px-3 py-1.5">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-t border-line-soft">
                      <td className="py-2 pr-3 text-ink-mid">{l.term}</td>
                      <td className="px-3 py-2 font-medium">{l.subject}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{l.mark === null ? "—" : l.mark}</td>
                      <td className="px-3 py-2">
                        {l.grade ? (
                          <span className="flex items-center gap-2">
                            {l.grade}
                            {l.pass !== null && <Tag variant={l.pass ? "ok" : "late"}>{l.pass ? "Pass" : "Fail"}</Tag>}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2 text-ink-mid">{l.comment ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
