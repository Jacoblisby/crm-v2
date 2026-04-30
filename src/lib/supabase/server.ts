/**
 * Server-side Supabase client til Server Components.
 * Læser fra eksisterende Loveable-projekt (46b03c04-...) read-only i Uge 1-2.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Server Components kan ikke sætte cookies; ignoreres her, sat i Middleware
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Read-only context (Server Component) — fail silently
          }
        },
      },
    }
  );
}
