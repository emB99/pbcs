"use client";

import { createContext, useContext } from "react";
import type { Terms } from "@/lib/terminology";
import type { AppRole, SchoolType } from "@/lib/types";

type SchoolContextValue = {
  terms: Terms;
  role: AppRole;
  schoolName: string;
  schoolType: SchoolType;
  logoUrl: string | null;
};

const Ctx = createContext<SchoolContextValue | null>(null);

export function SchoolProvider({
  value,
  children,
}: {
  value: SchoolContextValue;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useSchool(): SchoolContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSchool must be used inside <SchoolProvider>");
  return v;
}

/** Labels for the current school type, e.g. terms.intake.one -> "Class". */
export function useTerms(): Terms {
  return useSchool().terms;
}

export function useRole(): AppRole {
  return useSchool().role;
}

export function useSchoolName(): string {
  return useSchool().schoolName;
}

export function useLogoUrl(): string | null {
  return useSchool().logoUrl;
}

export function useSchoolType(): SchoolType {
  return useSchool().schoolType;
}
