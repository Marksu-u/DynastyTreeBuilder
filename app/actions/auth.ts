"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

const SIGN_IN_DELETION_FAILED =
  "Your data was deleted, but removing your sign-in failed. Please try again.";

export async function syncUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return;

  // Shared with getAuthUser, which repairs a missing row on the read path, so
  // the two can never disagree about what an app-side user looks like.
  await ensureAppUser(user.id, user.email);
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/api/auth/callback`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return { error: error?.message ?? "Failed to start Google sign-in" };
  }

  return { url: data.url };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function deleteAccount(): Promise<
  { success: true } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You're not signed in." };
  }

  // 1. Erase all app data first. deleteMany is idempotent (no throw on 0 rows),
  //    and the schema's onDelete: Cascade removes dynasties, characters,
  //    relationships, custom names, and custom options in one transaction.
  try {
    await prisma.user.deleteMany({ where: { supabaseId: user.id } });
  } catch {
    return { error: "We couldn't delete your data. Please try again." };
  }

  // 2. Remove the shared sign-in identity. Its AFTER DELETE trigger on
  //    auth.users sweeps any other ecosystem tool's rows keyed on this id.
  //    Guarded: a throw here would land after the data is already gone.
  try {
    const admin = createAdminClient();
    const { error: adminError } = await admin.auth.admin.deleteUser(user.id);
    if (adminError) return { error: SIGN_IN_DELETION_FAILED };
  } catch {
    return { error: SIGN_IN_DELETION_FAILED };
  }

  // 3. Clear the local session; the client navigates home. A failure here is
  //    harmless — the identity is already deleted, so the session is unusable.
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignored: deletion already succeeded.
  }

  return { success: true };
}
