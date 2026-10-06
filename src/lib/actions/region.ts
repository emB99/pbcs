"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, NOT_ALLOWED, requireSchool } from "@/lib/school";
import { isValidLocale, isValidTimezone } from "@/lib/format";
import type { DialogResult } from "@/lib/types";

/** Built-in methods are stored under their keys; anything else is stored as typed. */
const BUILT_IN: Record<string, string> = {
  cash: "cash",
  ecocash: "ecocash",
  "bank transfer": "bank_transfer",
  bank_transfer: "bank_transfer",
  other: "other",
};

const currencyCode = z.string().regex(/^[A-Z]{3}$/, "Currency codes are three capital letters, like USD.");

const regionSchema = z
  .object({
    base_currency: currencyCode,
    accepted_currencies: z.array(currencyCode).max(8, "Keep it to eight other currencies or fewer."),
    locale: z.string().refine(isValidLocale, "Choose a valid locale."),
    timezone: z.string().refine(isValidTimezone, "Choose a valid timezone."),
    payment_methods: z
      .array(z.string().trim().min(1).max(40))
      .min(1, "Keep at least one payment method.")
      .max(12, "Keep it to twelve payment methods or fewer."),
  })
  .transform((v) => {
    const methods: string[] = [];
    for (const m of v.payment_methods) {
      const stored = BUILT_IN[m.toLowerCase()] ?? m;
      if (!methods.some((x) => x.toLowerCase() === stored.toLowerCase())) methods.push(stored);
    }
    return {
      ...v,
      accepted_currencies: [...new Set(v.accepted_currencies)].filter((c) => c !== v.base_currency),
      payment_methods: methods,
    };
  });

export type RegionInput = z.input<typeof regionSchema>;

export async function saveRegion(input: RegionInput): Promise<DialogResult> {
  const ctx = await requireSchool();
  if (!ADMIN_ROLES.includes(ctx.role)) return { ok: false, message: NOT_ALLOWED };

  const parsed = regionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("school_settings").update(parsed.data).eq("id", true);
  if (error) {
    if (error.message.includes("base currency")) {
      return {
        ok: false,
        message: "The base currency cannot be changed once transactions exist, because balances are stored in it.",
      };
    }
    return { ok: false, message: "Could not save. Try again." };
  }

  // Formatting is applied everywhere from the root layout down.
  revalidatePath("/", "layout");
  return { ok: true };
}
