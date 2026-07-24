"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function syncUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return;

  await prisma.user.upsert({
    where: { supabaseId: user.id },
    update: {},
    create: {
      supabaseId: user.id,
      email: user.email,
    },
  });
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
  const admin = createAdminClient();
  const { error: adminError } = await admin.auth.admin.deleteUser(user.id);
  if (adminError) {
    return {
      error:
        "Your data was deleted, but removing your sign-in failed. Please try again.",
    };
  }

  // 3. Clear the local session; the client navigates home.
  await supabase.auth.signOut();
  return { success: true };
}
