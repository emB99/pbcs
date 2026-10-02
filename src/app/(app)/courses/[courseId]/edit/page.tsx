import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseForm } from "@/components/courses/CourseForm";
import { Card, CardHead } from "@/components/ui/Card";
import { SubjectsManager } from "@/components/courses/SubjectsManager";
import { requireSchool } from "@/lib/school";
import { updateCourse } from "@/lib/actions/courses";
import type { Course, Subject } from "@/lib/types";

export default async function EditCoursePage(
  props: PageProps<"/courses/[courseId]/edit">,
) {
  const { courseId } = await props.params;
  const { terms: t } = await requireSchool();
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .maybeSingle<Course>();

  if (!course) notFound();

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .eq("course_id", courseId)
    .is("archived_at", null)
    .order("sort_order")
    .order("name")
    .returns<Subject[]>();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Edit {course.name}</h1>
      <CourseForm
        action={updateCourse.bind(null, courseId)}
        defaultValues={course}
        submitLabel="Save changes"
      />
      <Card className="max-w-lg">
        <CardHead title={t.subject.many} note={`Taught in this ${t.course.one.toLowerCase()}`} />
        <SubjectsManager courseId={courseId} subjects={subjects ?? []} />
      </Card>
    </div>
  );
}
