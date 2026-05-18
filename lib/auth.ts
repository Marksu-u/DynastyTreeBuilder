import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

export async function getAuthUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  try {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });
    if (!dbUser) redirect("/login");
    return dbUser;
  } catch {
    redirect("/login");
  }
}
