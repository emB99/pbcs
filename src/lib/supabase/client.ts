import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Browser-side Supabase client for use inside "use client" components.
 * Rare in this app — most reads happen server-side and most writes go
 * through Server Actions — but kept available for client-side islands that
 * need it directly (e.g. live search-as-you-type).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
