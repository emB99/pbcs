import { CourseForm } from "@/components/courses/CourseForm";
import { createCourse } from "@/lib/actions/courses";

export default function NewCoursePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Add a course</h1>
      <CourseForm action={createCourse} submitLabel="Add course" />
    </div>
  );
}
