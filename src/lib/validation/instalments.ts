import { z } from "zod";
import { moneyInputSchema, optionalText } from "@/lib/validation/shared";

const positiveMoney = moneyInputSchema.refine((v) => Number(v) > 0, { message: "Enter an amount above zero." });

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");

export const FREQUENCIES = ["weekly", "fortnightly", "monthly"] as const;

export const planSchema = z.object({
  count: z
    .number({ message: "Enter how many instalments." })
    .int("Use a whole number of instalments.")
    .min(1, "Use at least 1 instalment.")
    .max(36, "Use 36 instalments or fewer."),
  frequency: z.enum(FREQUENCIES, { message: "Choose how often." }),
  first_due: isoDate,
  total: positiveMoney,
});

export const instalmentSchema = z.object({
  due_on: isoDate,
  amount: positiveMoney,
  note: optionalText,
});
