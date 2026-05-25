"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
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
