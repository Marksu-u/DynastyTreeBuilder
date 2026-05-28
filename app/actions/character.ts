"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { IdSchema, CharacterDataSchema, PositionSchema } from "@/lib/schemas";
import type { CharacterData } from "@/types/canvas";

export async function createCharacter(
  dynastyId: string,
  data: CharacterData,
  position: { x: number; y: number }
): Promise<{ id: string }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");
  const validId = IdSchema.parse(dynastyId);
  const validData = CharacterDataSchema.parse(data);
  const validPos = PositionSchema.parse(position);

  const dynasty = await prisma.dynasty.findFirst({
    where: { id: validId, ownerId: user.id },
    select: { id: true },
  });
  if (!dynasty) throw new Error("Dynasty not found");

  const character = await prisma.character.create({
    data: {
      dynastyId: validId,
      name: validData.name,
      alias: validData.alias,
      role: validData.role,
      style: validData.style,
      gender: validData.gender,
      note: validData.note,
      isFounder: validData.isFounder,
      isLost: validData.isLost,
      generation: validData.generation,
      posX: validPos.x,
      posY: validPos.y,
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
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");
  const validId = IdSchema.parse(id);
  const validDynastyId = IdSchema.parse(dynastyId);
  const validData = CharacterDataSchema.partial().parse(data);

  await prisma.character.update({
    where: { id: validId, dynasty: { id: validDynastyId, ownerId: user.id } },
    data: {
      name: validData.name,
      alias: validData.alias,
      role: validData.role,
      style: validData.style,
      gender: validData.gender,
      note: validData.note,
      isFounder: validData.isFounder,
      isLost: validData.isLost,
      generation: validData.generation,
    },
  });
}

export async function deleteCharacter(
  id: string,
  dynastyId: string
): Promise<void> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");
  const validId = IdSchema.parse(id);
  const validDynastyId = IdSchema.parse(dynastyId);

  await prisma.character.delete({
    where: { id: validId, dynasty: { id: validDynastyId, ownerId: user.id } },
  });
}

export async function updatePosition(
  id: string,
  dynastyId: string,
  x: number,
  y: number
): Promise<void> {
  const user = await getAuthUser();
  const validId = IdSchema.parse(id);
  const validDynastyId = IdSchema.parse(dynastyId);
  const validPos = PositionSchema.parse({ x, y });

  await prisma.character.update({
    where: { id: validId, dynasty: { id: validDynastyId, ownerId: user.id } },
    data: { posX: validPos.x, posY: validPos.y },
  });
}
