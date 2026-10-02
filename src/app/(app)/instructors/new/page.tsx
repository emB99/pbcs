import { InstructorForm } from "@/components/instructors/InstructorForm";
import { createInstructor } from "@/lib/actions/instructors";
import { requireSchool } from "@/lib/school";
import { a, lower } from "@/lib/terminology";

export default async function NewInstructorPage() {
  const { terms: t } = await requireSchool();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Add {a(t.instructor.one)}</h1>
      <InstructorForm action={createInstructor} submitLabel={`Add ${lower(t.instructor).one}`} />
    </div>
  );
}
