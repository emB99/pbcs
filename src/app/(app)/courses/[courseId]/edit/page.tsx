import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseForm } from "@/components/courses/CourseForm";
import { updateCourse } from "@/lib/actions/courses";
import type { Course } from "@/lib/types";

export default async function EditCoursePage(
  props: PageProps<"/courses/[courseId]/edit">,
) {
  const { courseId } = await props.params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle<Course>();

  if (!course) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Edit {course.name}</h1>
      <CourseForm
        action={updateCourse.bind(null, courseId)}
        defaultValues={course}
        submitLabel="Save changes"
      />
    </div>
  );
}
