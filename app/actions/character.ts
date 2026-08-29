"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { IdSchema, CharacterDataSchema, PositionSchema, MAX_CHARACTERS } from "@/lib/schemas";
import type { CharacterData } from "@/types/canvas";

// A delete batch is a canvas selection, so it is bounded by the same cap as the
// tree itself — you cannot select more people than a dynasty can hold.
const CharacterIdsSchema = z
  .array(IdSchema)
  .min(1, "Nothing to delete")
  .max(MAX_CHARACTERS, "Too many characters in one request");

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
      flags: validData.flags,
      style: validData.style,
      gender: validData.gender,
      note: validData.note,
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
      flags: validData.flags,
      style: validData.style,
      gender: validData.gender,
      note: validData.note,
    },
  });
}

/**
 * Deletes one or more characters as a single all-or-nothing operation.
 *
 * Batched deliberately. The canvas used to fan a multi-select delete out into
 * one action call per character with Promise.all, which has no atomicity: if the
 * third of five rejected, the client reverted all five on screen while two were
 * already gone from the database, and the two views stayed apart until a reload.
 * One transaction means the client's revert is always the truth.
 */
export async function deleteCharacters(
  dynastyId: string,
  ids: string[]
): Promise<void> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");
  const validDynastyId = IdSchema.parse(dynastyId);
  const validIds = CharacterIdsSchema.parse(ids);

  // Deduplicated before the count check below, which would otherwise read a
  // repeated id as a row that failed to delete.
  const uniqueIds = [...new Set(validIds)];

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.character.deleteMany({
      where: {
        id: { in: uniqueIds },
        dynasty: { id: validDynastyId, ownerId: user.id },
      },
    });
    // Throwing rolls the transaction back, so a request naming even one
    // character the user does not own deletes nothing at all.
    if (count !== uniqueIds.length) throw new Error("Character not found");
  });
}

// updatePosition was removed here: the canvas is laid out by
// useGenealogyLayout with nodesDraggable={false}, so no drag-end ever fired and
// nothing called it. Positions are still persisted by createCharacter, and read
// back on load, which is all the layout needs.
