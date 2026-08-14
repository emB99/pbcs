/** "Tendai Mukwena" -> "TM" */
export function toInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const TINTS = ["a", "b", "c", "d", "e"] as const;
export type AvatarTint = (typeof TINTS)[number];

/**
 * Deterministic tint (a-e) from a stable id, so a student's avatar color
 * stays the same across paginated/filtered/sorted views instead of cycling
 * by row index.
 */
export function tintForId(id: string): AvatarTint {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return TINTS[hash % TINTS.length];
}
