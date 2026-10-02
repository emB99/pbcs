"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setupSchema } from "@/lib/validation/setup";
import { fieldErrorsFromZod } from "@/lib/validation/shared";
import type { FormState } from "@/lib/types";

/**
 * First-run setup. The signed-in user becomes the owner. school_settings is
 * pinned to a single row, so the insert is the lock: if two people race
 * through /setup, exactly one insert wins and the other is told it's done.
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

  const admin = createAdminClient();
  const { error: settingsError } = await admin.from("school_settings").insert({
    name: parsed.data.name,
    school_type: parsed.data.school_type,
    student_number_prefix: parsed.data.student_number_prefix || "S",
  });
  if (settingsError) {
    if (settingsError.code === "23505") {
      return { message: "This school has already been set up. Ask the owner for an invite." };
    }
    return { message: "Couldn't set up the school. Try again." };
  }

  const { error: memberError } = await admin
    .from("memberships")
    .insert({ user_id: user.id, role: "owner" });
  if (memberError) {
    // Roll back so setup can be retried instead of leaving an owner-less school.
    await admin.from("school_settings").delete().eq("id", true);
    return { message: "Couldn't set up the school. Try again." };
  }

  redirect("/dashboard");
}
