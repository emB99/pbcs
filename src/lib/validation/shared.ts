import { z } from "zod";
import { parseMoneyInput } from "@/lib/money";

/** Accepts "50", "50.00", "$50" and normalizes to a "50.00" decimal string. */
export const moneyInputSchema = z.string().transform((val, ctx) => {
  const parsed = parseMoneyInput(val);
  if (parsed === null) {
    ctx.addIssue({ code: "custom", message: "Enter an amount like 50 or 50.00." });
    return z.NEVER;
  }
  return parsed;
});

/** Optional free-text field: blank string -> null. */
export const optionalText = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : null));

/** Optional email field: blank string -> null, otherwise must look like an email. */
export const optionalEmail = z
  .string()
  .optional()
  .transform((v, ctx) => {
    const trimmed = v?.trim();
    if (!trimmed) return null;
    if (!z.string().email().safeParse(trimmed).success) {
      ctx.addIssue({ code: "custom", message: "Enter a valid email address." });
      return z.NEVER;
    }
    return trimmed;
  });

/** Optional integer field from a text/number input: blank -> null. */
export const optionalInt = z
  .string()
  .optional()
  .transform((v, ctx) => {
    if (!v || v.trim() === "") return null;
    const n = Number(v);
    if (!Number.isInteger(n)) {
      ctx.addIssue({ code: "custom", message: "Enter a whole number." });
      return z.NEVER;
    }
    return n;
  });

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    errors[key] = errors[key] ? [...errors[key], issue.message] : [issue.message];
  }
  return errors;
}
