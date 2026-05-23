"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { IdSchema, CustomNameInputSchema } from "@/lib/schemas";
import type { CharacterRole, CharacterGender, NameStyle } from "@/types/canvas";

export type CustomNameEntry = {
  id: string;
  name: string;
  style: NameStyle;
  gender: CharacterGender;
  role: CharacterRole | null;
  note: string | null;
};

export async function getCustomNames(): Promise<CustomNameEntry[]> {
  const user = await getAuthUser();
  const names = await prisma.customName.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return names.map((n) => ({
    id: n.id,
    name: n.name,
    style: n.style as NameStyle,
    gender: n.gender as CharacterGender,
    role: (n.role as CharacterRole) ?? null,
    note: n.note,
  }));
}

export async function addCustomName(data: {
  name: string;
  style: NameStyle;
  gender: CharacterGender;
  role?: CharacterRole;
  note?: string;
}): Promise<{ id: string }> {
  const user = await getAuthUser();
  const valid = CustomNameInputSchema.parse(data);

  const entry = await prisma.customName.create({
    data: {
      name: valid.name,
      style: valid.style,
      gender: valid.gender,
      role: valid.role ?? null,
      note: valid.note?.trim() || null,
      userId: user.id,
    },
  });
  return { id: entry.id };
}

export async function deleteCustomName(id: string): Promise<void> {
  const user = await getAuthUser();
  const validId = IdSchema.parse(id);

  await prisma.customName.delete({
    where: { id: validId, userId: user.id },
  });
}
