import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Server-side Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Reads/writes the session cookie via next/headers.
 *
 * Server Components can't set cookies (Next.js throws), so `setAll` is
 * wrapped in a try/catch — session refresh in that case is handled by
 * proxy.ts instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — session refresh happens in
            // proxy.ts instead.
          }
        },
      },
    },
  );
}
