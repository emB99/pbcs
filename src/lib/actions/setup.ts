"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setupSchema } from "@/lib/validation/setup";
import { fieldErrorsFromZod } from "@/lib/validation/shared";
import type { FormState } from "@/lib/types";

/**
 * First-run setup. The claim_school() database function makes the signed-in
 * user the owner. school_settings is pinned to a single row, so the insert is
 * the lock: if two people race through /setup, exactly one wins.
 */
export async function completeSetup(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = setupSchema.safeParse({
    name: formData.get("name"),
    school_type: formData.get("school_type"),
    student_number_prefix: formData.get("student_number_prefix"),
  });
  if (!parsed.success) return { errors: fieldErrorsFromZod(parsed.error) };

  const { error } = await supabase.rpc("claim_school", {
    p_name: parsed.data.name,
    p_type: parsed.data.school_type,
    p_prefix: parsed.data.student_number_prefix,
  });
  if (error) {
    if (error.code === "23505") {
      return { message: "This school has already been set up. Ask the owner for an invite." };
    }
    return { message: "Could not set up the school. Try again." };
  }

  redirect("/dashboard");
}
