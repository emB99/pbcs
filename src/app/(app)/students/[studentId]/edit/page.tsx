import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentForm } from "@/components/students/StudentForm";
import { updateStudent } from "@/lib/actions/students";
import type { Student } from "@/lib/types";

export default async function EditStudentPage(
  props: PageProps<"/students/[studentId]/edit">,
) {
  const { studentId } = await props.params;
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle<Student>();

  if (!student) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Edit {student.full_name}</h1>
      <StudentForm
        action={updateStudent.bind(null, studentId)}
        defaultValues={student}
        submitLabel="Save changes"
      />
    </div>
  );
}
