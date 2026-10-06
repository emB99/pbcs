import { z } from "zod";
import { moneyInputSchema, optionalText } from "@/lib/validation/shared";

/**
 * Which currencies and methods are allowed depends on the school's settings, so
 * the action checks those; this only checks shape.
 */
export const recordPaymentSchema = z.object({
  enrolment_id: z.string().min(1, "Choose a student's enrolment."),
  amount: moneyInputSchema,
  currency: z.string().regex(/^[A-Z]{3}$/, "Choose a currency."),
  rate_to_base: z.string(),
  occurred_on: z.string().min(1, "Choose a date."),
  method: z.string().trim().min(1, "Choose a payment method.").max(60),
  reference: optionalText,
  note: optionalText,
});

export type RecordPaymentInput = z.input<typeof recordPaymentSchema>;

/**
 * The exchange rate that will be stored: always 1 for the base currency,
 * otherwise the (positive) number entered. Null when it is not usable.
 */
export function resolveRate(currency: string, baseCurrency: string, rate: string): string | null {
  if (currency === baseCurrency) return "1";
  const n = Number(rate);
  return Number.isFinite(n) && n > 0 ? rate : null;
}

export const recordChargeSchema = z.object({
  enrolment_id: z.string().min(1, "Choose an enrolment."),
  amount: moneyInputSchema,
  note: optionalText,
});

export const reverseTransactionSchema = z.object({
  transaction_id: z.string().min(1, "Missing transaction."),
  reversal_reason: z.string().trim().min(1, "A reason is required."),
});
