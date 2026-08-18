"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { CourseForm } from "@/components/courses/CourseForm";
import { createCourse } from "@/lib/actions/courses";

export function AddCourseModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" icon={<Plus />} onClick={() => setOpen(true)}>
        Add course
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Add a course" size="lg">
        <CourseForm action={createCourse} submitLabel="Add course" bare />
      </Dialog>
    </>
  );
}
