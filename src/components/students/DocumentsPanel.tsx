"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Trash2, Upload, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerDocument, deleteDocument } from "@/lib/actions/student-files";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/dates";
import type { StudentDocument } from "@/lib/types";

export type DocumentRow = StudentDocument & { url: string | null };

const MAX_BYTES = 10 * 1024 * 1024;

function humanSize(bytes: number | null) {
  if (bytes === null) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionOf(name: string) {
  const match = /\.([A-Za-z0-9]{1,8})$/.exec(name);
  return match ? `.${match[1].toLowerCase()}` : "";
}

export function DocumentsPanel({
  studentId,
  documents,
}: {
  studentId: string;
  documents: DocumentRow[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<DocumentRow | null>(null);
  const [pending, startTransition] = useTransition();

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setError(null);
    if (f && f.size > MAX_BYTES) {
      setError("That file is over 10 MB.");
      setFile(null);
      return;
    }
    setFile(f);
    if (f && !name) setName(f.name.replace(/\.[^.]+$/, ""));
  }

  function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const path = `${studentId}/${crypto.randomUUID()}${extensionOf(file.name)}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("student-documents")
        .upload(path, file, { contentType: file.type || undefined });
      if (uploadError) {
        setError("Could not upload the file. Try again.");
        return;
      }
      const result = await registerDocument({
        studentId,
        name,
        path,
        contentType: file.type || null,
        sizeBytes: file.size,
      });
      if (!result.ok) {
        setError(result.message ?? "Could not save the document.");
        return;
      }
      setFile(null);
      setName("");
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="flex flex-col">
      <form onSubmit={upload} className="flex flex-wrap items-end gap-3 px-5 pt-4">
        <label className="flex min-w-[180px] flex-1 flex-col gap-1.5 text-[12.5px] font-semibold text-ink-mid">
          File
          <input
            ref={inputRef}
            type="file"
            onChange={pick}
            className="text-[13px] font-normal text-ink file:mr-3 file:rounded-full file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-[12px] file:font-semibold"
          />
        </label>
        <label className="flex min-w-[180px] flex-1 flex-col gap-1.5 text-[12.5px] font-semibold text-ink-mid">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Birth certificate"
            className="rounded-full border border-line bg-surface px-4 py-[9px] text-[13px] font-normal text-ink outline-none focus-visible:border-brand"
          />
        </label>
        <Button type="submit" variant="primary" icon={<Upload />} disabled={pending || !file || !name.trim()}>
          {pending ? "Uploading…" : "Upload"}
        </Button>
      </form>
      {error && <p className="px-5 pt-2 text-xs text-danger">{error}</p>}

      {documents.length === 0 ? (
        <EmptyState message="No documents uploaded yet." />
      ) : (
        <ul className="mt-2 flex flex-col">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 border-t border-line-soft px-5 py-3 first:border-t-0"
            >
              <FileText className="h-5 w-5 flex-none text-ink-soft" strokeWidth={1.6} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold">{d.name}</div>
                <div className="text-[11.5px] text-ink-soft">
                  {formatDate(d.created_at.slice(0, 10))}
                  {d.size_bytes !== null && ` · ${humanSize(d.size_bytes)}`}
                </div>
              </div>
              {d.url && (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-soft hover:text-ink"
                  aria-label={`Download ${d.name}`}
                >
                  <Download className="h-4 w-4" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setRemoving(d)}
                className="text-ink-soft hover:text-danger"
                aria-label={`Delete ${d.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title="Delete this document?"
        description={`"${removing?.name ?? ""}" will be permanently deleted.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteDocument(studentId, removing!.id)}
      />
    </div>
  );
}
