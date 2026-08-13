import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

/**
 * Finds — or, if the row is somehow missing, restores — the app-side user for a
 * Supabase identity.
 *
 * The app row is created by the auth callback, but that call can fail after the
 * session is already valid (it redirects with `?error=sync_failed`). Recreating
 * it here means a user who hits that path is not permanently stuck: the upsert
 * is the same idempotent one the callback runs.
 */
export async function ensureAppUser(
  supabaseId: string,
  email: string,
): Promise<User> {
  return prisma.user.upsert({
    where: { supabaseId },
    update: {},
    create: { supabaseId, email },
  });
}

/**
 * The signed-in user for a Server Action or a protected page.
 *
 * Three outcomes, deliberately distinct — collapsing them is how this used to
 * loop. `redirect("/login")` is only correct when there is genuinely no session,
 * because the proxy sends a *logged-in* visitor at /login straight back to
 * /dashboard: any redirect here that happens while the session is still valid
 * bounces between the two until the browser gives up. So a database failure
 * throws to the error boundary instead, and a missing app row is repaired
 * rather than redirected.
 */
export async function getAuthUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No session at all — the one case /login is the right answer to.
  if (!user) redirect("/login");

  // Note: `redirect()` works by throwing, so nothing that can redirect may sit
  // inside the try below — the catch would swallow it.
  try {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });
    if (dbUser) return dbUser;

    // Valid session, no app row. Without an email there is nothing to create it
    // from, which is a broken identity rather than a missing session.
    if (!user.email) {
      throw new Error("Signed-in identity has no email address");
    }
    return await ensureAppUser(user.id, user.email);
  } catch (cause) {
    // The session is fine; we just cannot read or write our own tables. Let the
    // route's error boundary say so — it offers a retry, which is what this is.
    throw new Error("Could not load your account", { cause });
  }
}
