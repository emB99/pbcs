"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { NOT_ALLOWED, getOfficeContext } from "@/lib/school";
import type { DialogResult } from "@/lib/types";

/**
 * Files are uploaded straight from the browser to Storage (so they are not
 * squeezed through the Server Action body limit); these actions then record
 * the upload. The path must live under the student's own folder so a caller
 * cannot attach someone else's file.
 */
function ownsPath(studentId: string, path: string) {
  return path.startsWith(`${studentId}/`) && !path.includes("..");
}

export async function setStudentPhoto(studentId: string, path: string): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };
  if (!ownsPath(studentId, path)) return { ok: false, message: "Invalid file." };

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("photo_path")
    .eq("id", studentId)
    .maybeSingle();

  const { error } = await supabase.from("students").update({ photo_path: path }).eq("id", studentId);
  if (error) {
    await supabase.storage.from("student-photos").remove([path]);
    return { ok: false, message: "Could not save the photo. Try again." };
  }
  if (student?.photo_path && student.photo_path !== path) {
    await supabase.storage.from("student-photos").remove([student.photo_path]);
  }

  revalidatePath(`/students/${studentId}`);
  return { ok: true };
}

export async function removeStudentPhoto(studentId: string): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("photo_path")
    .eq("id", studentId)
    .maybeSingle();
  const { error } = await supabase.from("students").update({ photo_path: null }).eq("id", studentId);
  if (error) return { ok: false, message: "Could not remove the photo. Try again." };
  if (student?.photo_path) await supabase.storage.from("student-photos").remove([student.photo_path]);

  revalidatePath(`/students/${studentId}`);
  return { ok: true };
}

export async function registerDocument(input: {
  studentId: string;
  name: string;
  path: string;
  contentType: string | null;
  sizeBytes: number | null;
}): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };
  const name = input.name.trim();
  if (!name) return { ok: false, message: "Give the document a name." };
  if (!ownsPath(input.studentId, input.path)) return { ok: false, message: "Invalid file." };

  const supabase = await createClient();
  const { error } = await supabase.from("student_documents").insert({
    student_id: input.studentId,
    name,
    storage_path: input.path,
    content_type: input.contentType,
    size_bytes: input.sizeBytes,
  });
  if (error) {
    await supabase.storage.from("student-documents").remove([input.path]);
    return { ok: false, message: "Could not save the document. Try again." };
  }

  revalidatePath(`/students/${input.studentId}`);
  return { ok: true };
}

export async function deleteDocument(studentId: string, documentId: string): Promise<DialogResult> {
  if (!(await getOfficeContext())) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("student_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!doc) return { ok: true };

  const { error } = await supabase.from("student_documents").delete().eq("id", documentId);
  if (error) return { ok: false, message: "Could not delete. Try again." };
  await supabase.storage.from("student-documents").remove([doc.storage_path]);

  revalidatePath(`/students/${studentId}`);
  return { ok: true };
}
