"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { archiveStudent } from "@/lib/actions/students";

export function StudentArchiveButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button icon={<Archive />} onClick={() => setOpen(true)}>
        Archive
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Archive this student?"
        description={`"${name}" will drop off the active students list. Nothing is deleted — their record and ledger stay intact.`}
        confirmLabel="Archive"
        variant="danger"
        onConfirm={async () => {
          const result = await archiveStudent(id);
          if (result.ok) router.push("/students");
          return result;
        }}
      />
    </>
  );
}
