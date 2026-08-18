import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
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
        <Link href="/courses/new">
          <Button variant="primary" icon={<Plus />}>
            Add course
          </Button>
        </Link>
      </div>

      <CoursesTable rows={courses ?? []} />
    </div>
  );
}
