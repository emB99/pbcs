"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { IntakeForm } from "@/components/intakes/IntakeForm";
import type { Course, Instructor } from "@/lib/types";
import { useTerms } from "@/components/school/SchoolProvider";
import { a, lower } from "@/lib/terminology";

export function AddIntakeModal({
  courses,
  instructors,
}: {
  courses: Course[];
  instructors: Instructor[];
}) {
  const t = useTerms();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" icon={<Plus />} onClick={() => setOpen(true)}>
        Create {lower(t.intake).one}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Create ${a(t.intake.one)}`} size="lg">
        <IntakeForm courses={courses} instructors={instructors} bare />
      </Dialog>
    </>
  );
}
