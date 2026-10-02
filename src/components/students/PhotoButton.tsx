"use client";

import { useRef, useState, useTransition } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { setStudentPhoto, removeStudentPhoto } from "@/lib/actions/student-files";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export function PhotoButton({ studentId, hasPhoto }: { studentId: string; hasPhoto: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    setError(null);
    setOpen(false);
  }

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const ext = TYPES[file.type];
    if (!ext) {
      setError("Use a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is over 2 MB.");
      return;
    }
    startTransition(async () => {
      const path = `${studentId}/${crypto.randomUUID()}${ext}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("student-photos")
        .upload(path, file, { contentType: file.type });
      if (uploadError) {
        setError("Could not upload the photo. Try again.");
        return;
      }
      const result = await setStudentPhoto(studentId, path);
      if (result.ok) close();
      else setError(result.message ?? "Could not save the photo.");
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeStudentPhoto(studentId);
      if (result.ok) close();
      else setError(result.message ?? "Could not remove the photo.");
    });
  }

  return (
    <>
      <Button icon={<Camera />} onClick={() => setOpen(true)}>
        {hasPhoto ? "Change photo" : "Add photo"}
      </Button>
      <Dialog open={open} onClose={close} title="Student photo">
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-ink-mid">JPG, PNG or WebP, up to 2 MB.</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={pick}
            disabled={pending}
            className="text-[13px] file:mr-3 file:rounded-full file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          {pending && <p className="text-xs text-ink-soft">Working…</p>}
          <div className="flex justify-end gap-2 pt-1">
            {hasPhoto && (
              <Button type="button" variant="danger" onClick={remove} disabled={pending}>
                Remove photo
              </Button>
            )}
            <Button type="button" onClick={close} disabled={pending}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
