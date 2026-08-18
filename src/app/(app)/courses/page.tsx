import { createClient } from "@/lib/supabase/server";
import { AddCourseModal } from "@/components/courses/AddCourseModal";
import { CoursesTable } from "@/components/courses/CoursesTable";
import type { Course } from "@/lib/types";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .is("archived_at", null)
    .order("kind")
    .order("name")
    .returns<Course[]>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Courses</h1>
        <AddCourseModal />
      </div>

      <CoursesTable rows={courses ?? []} />
    </div>
  );
}
