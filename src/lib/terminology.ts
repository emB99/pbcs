import type { SchoolType } from "@/lib/types";

/**
 * One schema, two vocabularies. The tables are the same for a college and
 * a primary/secondary school; only the words differ. Schools can override
 * any label in Settings (stored in school_settings.terminology).
 */
export type TermKey =
  | "course"
  | "intake"
  | "subject"
  | "instructor"
  | "enrolment"
  | "term"
  | "guardian";

export type Term = { one: string; many: string };
export type Terms = Record<TermKey, Term>;
export type TerminologyOverrides = Partial<Record<TermKey, Partial<Term>>>;

export const DEFAULT_TERMS: Record<SchoolType, Terms> = {
  college: {
    course: { one: "Course", many: "Courses" },
    intake: { one: "Intake", many: "Intakes" },
    subject: { one: "Module", many: "Modules" },
    instructor: { one: "Lecturer", many: "Lecturers" },
    enrolment: { one: "Enrolment", many: "Enrolments" },
    term: { one: "Semester", many: "Semesters" },
    guardian: { one: "Next of kin", many: "Next of kin" },
  },
  k12: {
    course: { one: "Grade level", many: "Grade levels" },
    intake: { one: "Class", many: "Classes" },
    subject: { one: "Subject", many: "Subjects" },
    instructor: { one: "Teacher", many: "Teachers" },
    enrolment: { one: "Enrolment", many: "Enrolments" },
    term: { one: "Term", many: "Terms" },
    guardian: { one: "Guardian", many: "Guardians" },
  },
};

export const TERM_KEYS = Object.keys(DEFAULT_TERMS.college) as TermKey[];

export function resolveTerms(
  schoolType: SchoolType,
  overrides: TerminologyOverrides | null | undefined,
): Terms {
  const base = DEFAULT_TERMS[schoolType];
  const merged = { ...base };
  for (const key of TERM_KEYS) {
    const o = overrides?.[key];
    if (o) {
      merged[key] = {
        one: o.one?.trim() || base[key].one,
        many: o.many?.trim() || base[key].many,
      };
    }
  }
  return merged;
}

/** "course" -> "course" / "Course" helpers for mid-sentence use. */
export function lower(term: Term): Term {
  return { one: term.one.toLowerCase(), many: term.many.toLowerCase() };
}

/** "intake" -> "an intake", "Course" -> "a course". For headings like "Add a course". */
export function a(word: string): string {
  const w = word.trim().toLowerCase();
  return `${/^[aeiou]/.test(w) ? "an" : "a"} ${w}`;
}
