"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { CourseForm } from "@/components/courses/CourseForm";
import { createCourse } from "@/lib/actions/courses";
import { useTerms } from "@/components/school/SchoolProvider";
import { a, lower } from "@/lib/terminology";

export function AddCourseModal() {
  const t = useTerms();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" icon={<Plus />} onClick={() => setOpen(true)}>
        Add {lower(t.course).one}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Add ${a(t.course.one)}`} size="lg">
        <CourseForm action={createCourse} submitLabel={`Add ${lower(t.course).one}`} bare />
      </Dialog>
    </>
  );
}
