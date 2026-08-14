import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InstructorForm } from "@/components/instructors/InstructorForm";
import { updateInstructor } from "@/lib/actions/instructors";
import type { Instructor } from "@/lib/types";

export default async function EditInstructorPage(
  props: PageProps<"/instructors/[instructorId]/edit">,
) {
  const { instructorId } = await props.params;
  const supabase = await createClient();
  const { data: instructor } = await supabase
    .from("instructors")
    .select("*")
    .eq("id", instructorId)
    .maybeSingle<Instructor>();

  if (!instructor) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Edit {instructor.full_name}</h1>
      <InstructorForm
        action={updateInstructor.bind(null, instructorId)}
        defaultValues={instructor}
        submitLabel="Save changes"
      />
    </div>
  );
}
