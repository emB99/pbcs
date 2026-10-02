import { CourseForm } from "@/components/courses/CourseForm";
import { createCourse } from "@/lib/actions/courses";
import { requireSchool } from "@/lib/school";
import { a, lower } from "@/lib/terminology";

export default async function NewCoursePage() {
  const { terms: t } = await requireSchool();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Add {a(t.course.one)}</h1>
      <CourseForm action={createCourse} submitLabel={`Add ${lower(t.course).one}`} />
    </div>
  );
}
