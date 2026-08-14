import { InstructorForm } from "@/components/instructors/InstructorForm";
import { createInstructor } from "@/lib/actions/instructors";

export default function NewInstructorPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Add an instructor</h1>
      <InstructorForm action={createInstructor} submitLabel="Add instructor" />
    </div>
  );
}
