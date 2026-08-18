"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { InstructorForm } from "@/components/instructors/InstructorForm";
import { createInstructor } from "@/lib/actions/instructors";

export function AddInstructorModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" icon={<Plus />} onClick={() => setOpen(true)}>
        Add instructor
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Add an instructor" size="lg">
        <InstructorForm action={createInstructor} submitLabel="Add instructor" bare />
      </Dialog>
    </>
  );
}
