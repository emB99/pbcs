"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { InstructorForm } from "@/components/instructors/InstructorForm";
import { createInstructor } from "@/lib/actions/instructors";
import { useTerms } from "@/components/school/SchoolProvider";
import { a, lower } from "@/lib/terminology";

export function AddInstructorModal() {
  const t = useTerms();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" icon={<Plus />} onClick={() => setOpen(true)}>
        Add {lower(t.instructor).one}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Add ${a(t.instructor.one)}`} size="lg">
        <InstructorForm action={createInstructor} submitLabel={`Add ${lower(t.instructor).one}`} bare />
      </Dialog>
    </>
  );
}
