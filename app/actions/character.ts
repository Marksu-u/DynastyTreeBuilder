"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import type { CharacterData } from "@/types/canvas";

export async function createCharacter(
  dynastyId: string,
  data: CharacterData,
  position: { x: number; y: number }
): Promise<{ id: string }> {
  const user = await getAuthUser();

  const dynasty = await prisma.dynasty.findFirst({
    where: { id: dynastyId, ownerId: user.id },
    select: { id: true },
  });
  if (!dynasty) throw new Error("Dynasty not found");

  const character = await prisma.character.create({
    data: {
      dynastyId,
      name: data.name,
      alias: data.alias,
      role: data.role,
      style: data.style,
      gender: data.gender,
      note: data.note,
      isFounder: data.isFounder,
      isLost: data.isLost,
      posX: position.x,
      posY: position.y,
    },
  });

  return { id: character.id };
}

export async function updateCharacter(
  id: string,
  dynastyId: string,
  data: Partial<CharacterData>
): Promise<void> {
  const user = await getAuthUser();

  await prisma.character.update({
    where: { id, dynasty: { id: dynastyId, ownerId: user.id } },
    data: {
      name: data.name,
      alias: data.alias,
      role: data.role,
      style: data.style,
      gender: data.gender,
      note: data.note,
      isFounder: data.isFounder,
      isLost: data.isLost,
    },
  });
}

export async function deleteCharacter(
  id: string,
  dynastyId: string
): Promise<void> {
  const user = await getAuthUser();

  await prisma.character.delete({
    where: { id, dynasty: { id: dynastyId, ownerId: user.id } },
  });
}

export async function updatePosition(
  id: string,
  dynastyId: string,
  x: number,
  y: number
): Promise<void> {
  const user = await getAuthUser();

  await prisma.character.update({
    where: { id, dynasty: { id: dynastyId, ownerId: user.id } },
    data: { posX: x, posY: y },
  });
}
