import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { InstructorsTable } from "@/components/instructors/InstructorsTable";
import type { Instructor } from "@/lib/types";

export default async function InstructorsPage() {
  const supabase = await createClient();
  const { data: instructors } = await supabase
    .from("instructors")
    .select("*")
    .is("archived_at", null)
    .order("full_name")
    .returns<Instructor[]>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Instructors</h1>
        <Link href="/instructors/new">
          <Button variant="primary" icon={<Plus />}>
            Add instructor
          </Button>
        </Link>
      </div>

      <InstructorsTable rows={instructors ?? []} />
    </div>
  );
}
