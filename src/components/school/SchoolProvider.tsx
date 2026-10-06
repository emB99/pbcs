"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_REGION, makeFormat, type Format, type Region } from "@/lib/format";
import type { Terms } from "@/lib/terminology";
import type { AppRole, SchoolType } from "@/lib/types";

type SchoolContextValue = {
  terms: Terms;
  role: AppRole;
  schoolName: string;
  schoolType: SchoolType;
  logoUrl: string | null;
  region: Region;
  /** Extra currencies payments may be taken in (besides region.currency). */
  acceptedCurrencies: string[];
  /** Methods offered when recording a payment. */
  paymentMethods: string[];
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

const defaultFormat = makeFormat(DEFAULT_REGION);

/**
 * Money and date formatting for the school. Falls back to the defaults outside
 * the provider (print pages, error pages), so it never throws.
 */
export function useFormat(): Format {
  const v = useContext(Ctx);
  const region = v?.region;
  return useMemo(() => (region ? makeFormat(region) : defaultFormat), [region?.currency, region?.locale, region?.timezone]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useAcceptedCurrencies(): string[] {
  return useSchool().acceptedCurrencies;
}

export function usePaymentMethods(): string[] {
  return useSchool().paymentMethods;
}
