"use client";

import { useRef, useState, useTransition } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { removeLogo, setLogo } from "@/lib/actions/branding";
import { Button } from "@/components/ui/Button";
import { SchoolLogo } from "@/components/school/SchoolLogo";

const MAX_BYTES = 1024 * 1024;
const EXTENSIONS: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

export function LogoUploader({ logoUrl }: { logoUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const ext = EXTENSIONS[file.type];
    if (!ext) {
      setError("Use a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is over 1 MB.");
      return;
    }
    startTransition(async () => {
      const path = `logo-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await createClient()
        .storage.from("branding")
        .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
      if (uploadError) {
        setError("Could not upload the logo. Try again.");
        return;
      }
      const result = await setLogo(path);
      if (!result.ok) setError(result.message ?? "Could not save the logo.");
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await removeLogo();
      if (!result.ok) setError(result.message ?? "Could not remove the logo.");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[12.5px] font-semibold text-ink-mid">Logo</div>
      <div className="flex flex-wrap items-center gap-4">
        <SchoolLogo logoUrl={logoUrl} size="xl" />
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={pick}
            disabled={pending}
            className="sr-only"
            id="logo_file"
          />
          <div className="flex flex-wrap gap-2">
            <Button icon={<ImageUp />} onClick={() => inputRef.current?.click()} disabled={pending}>
              {logoUrl ? "Replace logo" : "Upload logo"}
            </Button>
            {logoUrl && (
              <Button variant="danger" icon={<Trash2 />} onClick={remove} disabled={pending}>
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-soft">
            Square works best. PNG, JPG or WebP, up to 1 MB. Shown in the menu, on the sign-in page and on printouts.
          </p>
        </div>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
