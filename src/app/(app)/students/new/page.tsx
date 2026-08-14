import { StudentForm } from "@/components/students/StudentForm";
import { createStudent } from "@/lib/actions/students";

export default function NewStudentPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Add a student</h1>
      <StudentForm action={createStudent} submitLabel="Add student" />
    </div>
  );
}
