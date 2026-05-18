"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

function makeSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "dynasty";
  return `${base}-${Date.now()}`;
}

export async function createDynasty(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const user = await getAuthUser();
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const setting = (formData.get("setting") as string | null) ?? "FANTASY";

  if (!name) return { error: "Name is required" };

  const dynasty = await prisma.dynasty.create({
    data: {
      name,
      slug: makeSlug(name),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setting: setting as any,
      ownerId: user.id,
    },
  });

  redirect(`/dashboard/${dynasty.id}`);
}

export async function renameDynasty(id: string, name: string): Promise<{ error?: string }> {
  const user = await getAuthUser();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };

  await prisma.dynasty.update({
    where: { id, ownerId: user.id },
    data: { name: trimmed },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${id}`);
  return {};
}

export async function deleteDynasty(id: string): Promise<void> {
  const user = await getAuthUser();

  await prisma.dynasty.delete({
    where: { id, ownerId: user.id },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
