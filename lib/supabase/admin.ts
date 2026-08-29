import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the secret (service-role) key. Never import
 * this into client components. Used solely for privileged auth-admin calls such
 * as permanently deleting an auth user during account deletion.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
