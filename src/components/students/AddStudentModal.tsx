"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { StudentForm } from "@/components/students/StudentForm";
import { createStudent } from "@/lib/actions/students";

export function AddStudentModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" icon={<Plus />} onClick={() => setOpen(true)}>
        Add student
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Add a student" size="lg">
        <StudentForm action={createStudent} submitLabel="Add student" bare />
      </Dialog>
    </>
  );
}
