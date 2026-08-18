"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IntakeForm } from "@/components/intakes/IntakeForm";
import type { Course, Instructor } from "@/lib/types";

export function AddIntakeModal({
  courses,
  instructors,
}: {
  courses: Course[];
  instructors: Instructor[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" icon={<Plus />} onClick={() => setOpen(true)}>
        Create intake
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Create an intake" size="lg">
        <IntakeForm courses={courses} instructors={instructors} bare />
      </Dialog>
    </>
  );
}
