import { z } from "zod";
import { moneyInputSchema, optionalText } from "@/lib/validation/shared";

export const paymentMethodSchema = z.enum(["cash", "ecocash", "bank_transfer", "other"]);
export const currencySchema = z.enum(["USD", "ZWG"]);

export const recordPaymentSchema = z
  .object({
    enrolment_id: z.string().min(1, "Choose a student's enrolment."),
    amount: moneyInputSchema,
    currency: currencySchema,
    rate_to_usd: z.string(),
    occurred_on: z.string().min(1, "Choose a date."),
    method: paymentMethodSchema,
    reference: optionalText,
    note: optionalText,
  })
  .transform((data, ctx) => {
    const rate = data.currency === "USD" ? "1" : data.rate_to_usd;
    const rateNum = Number(rate);
    if (!Number.isFinite(rateNum) || rateNum <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["rate_to_usd"],
        message: "Enter a valid exchange rate.",
      });
      return z.NEVER;
    }
    return { ...data, rate_to_usd: rate };
  });

export type RecordPaymentInput = z.input<typeof recordPaymentSchema>;

export const recordChargeSchema = z.object({
  enrolment_id: z.string().min(1, "Choose an enrolment."),
  amount: moneyInputSchema,
  note: optionalText,
});

export const reverseTransactionSchema = z.object({
  transaction_id: z.string().min(1, "Missing transaction."),
  reversal_reason: z.string().trim().min(1, "A reason is required."),
});
