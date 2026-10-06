import { todayIsoDate } from "@/lib/dates";

type TermLike = { id: string; start_date: string; end_date: string };

/**
 * Which term a page should show, from the ?term= query value: a term id,
 * "final" (the single end-of-course result, no term), or absent. When absent,
 * default to the term running today, else the latest one that has started,
 * else the first. With no terms at all the answer is null ("final").
 */
export function pickTermId(terms: TermLike[], termParam: string | undefined): string | null {
  if (termParam === "final") return null;
  if (termParam && terms.some((t) => t.id === termParam)) return termParam;
  if (terms.length === 0) return null;

  const today = todayIsoDate();
  const current = terms.find((t) => t.start_date <= today && today <= t.end_date);
  const lastStarted = [...terms].reverse().find((t) => t.start_date <= today);
  return (current ?? lastStarted ?? terms[0]).id;
}
