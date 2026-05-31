"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  IdSchema,
  DynastySettingSchema,
  DynastySettingsSchema,
} from "@/lib/schemas";
import type { DynastyExport } from "@/lib/schemas";

function makeSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "dynasty";
  return `${base}-${Date.now()}`;
}

export async function listDynasties() {
  const user = await getAuthUser();
  return prisma.dynasty.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      setting: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { characters: true } },
    },
  });
}

export async function createDynasty(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) return { error: "Too many requests. Slow down." };

  const nameResult = z.string().min(1, "Name is required").safeParse(
    (formData.get("name") as string | null)?.trim() ?? ""
  );
  if (!nameResult.success) return { error: nameResult.error.issues[0].message };

  const settingResult = DynastySettingSchema.safeParse(
    formData.get("setting") ?? "FANTASY"
  );
  if (!settingResult.success) return { error: settingResult.error.issues[0].message };

  const dynasty = await prisma.dynasty.create({
    data: {
      name: nameResult.data,
      slug: makeSlug(nameResult.data),
      setting: settingResult.data,
      ownerId: user.id,
    },
  });

  redirect(`/dashboard/${dynasty.id}`);
}

export async function renameDynasty(
  id: string,
  name: string
): Promise<{ error?: string }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) return { error: "Too many requests. Slow down." };

  const idResult = IdSchema.safeParse(id);
  if (!idResult.success) return { error: idResult.error.issues[0].message };

  const nameResult = z.string().min(1, "Name is required").safeParse(name.trim());
  if (!nameResult.success) return { error: nameResult.error.issues[0].message };

  await prisma.dynasty.update({
    where: { id: idResult.data, ownerId: user.id },
    data: { name: nameResult.data },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${idResult.data}`);
  return {};
}

export async function deleteDynasty(id: string): Promise<{ error?: string }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) return { error: "Too many requests. Slow down." };

  const idResult = IdSchema.safeParse(id);
  if (!idResult.success) return { error: idResult.error.issues[0].message };

  try {
    await prisma.dynasty.delete({
      where: { id: idResult.data, ownerId: user.id },
    });
  } catch {
    return { error: "Failed to delete dynasty" };
  }

  revalidatePath("/dashboard");
  return {};
}

export async function updateDynastySettings(
  id: string,
  data: { name?: string; setting?: string; isPublic?: boolean }
): Promise<{ error?: string }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) return { error: "Too many requests. Slow down." };

  const idResult = IdSchema.safeParse(id);
  if (!idResult.success) return { error: idResult.error.issues[0].message };

  const parsed = DynastySettingsSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.setting !== undefined) update.setting = parsed.data.setting;
  if (parsed.data.isPublic !== undefined) update.isPublic = parsed.data.isPublic;

  await prisma.dynasty.update({
    where: { id: idResult.data, ownerId: user.id },
    data: update,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${idResult.data}`);
  return {};
}

export async function exportDynasty(dynastyId: string): Promise<DynastyExport> {
  const user = await getAuthUser();
  const validId = IdSchema.parse(dynastyId);

  const dynasty = await prisma.dynasty.findFirst({
    where: { id: validId, ownerId: user.id },
    include: {
      characters: true,
      relationships: true,
    },
  });
  if (!dynasty) throw new Error("Dynasty not found");

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    dynasty: {
      name: dynasty.name,
      setting: dynasty.setting,
      isPublic: dynasty.isPublic,
    },
    characters: dynasty.characters.map((c) => ({
      id: c.id,
      name: c.name,
      alias: c.alias,
      flags: (c as any).flags ?? [],
      style: c.style,
      gender: c.gender,
      note: c.note,
      posX: c.posX,
      posY: c.posY,
    })),
    relationships: dynasty.relationships.map((r) => ({
      id: r.id,
      fromId: r.fromId,
      toId: r.toId,
      type: r.type as import("@/types/canvas").RelationshipType,
      hook: r.hook,
      isMutual: r.isMutual,
    })),
  };
}

export async function getDynasty(dynastyId: string) {
  const user = await getAuthUser();

  const idResult = IdSchema.safeParse(dynastyId);
  if (!idResult.success) return null;

  return prisma.dynasty.findFirst({
    where: { id: idResult.data, ownerId: user.id },
  });
}
