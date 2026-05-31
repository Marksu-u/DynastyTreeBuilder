"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { IdSchema, RelationshipDataSchema } from "@/lib/schemas";
import type { RelationshipData } from "@/types/canvas";

export async function createRelationship(
  dynastyId: string,
  fromId: string,
  toId: string,
  data: RelationshipData
): Promise<{ id: string }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");
  const validDynastyId = IdSchema.parse(dynastyId);
  const validFromId = IdSchema.parse(fromId);
  const validToId = IdSchema.parse(toId);
  const validData = RelationshipDataSchema.parse(data);

  const dynasty = await prisma.dynasty.findFirst({
    where: { id: validDynastyId, ownerId: user.id },
    select: { id: true },
  });
  if (!dynasty) throw new Error("Dynasty not found");

  const rel = await prisma.relationship.create({
    data: {
      dynastyId: validDynastyId,
      fromId: validFromId,
      toId: validToId,
      type: validData.type,
      hook: validData.hook,
      isMutual: validData.isMutual,
    },
  });

  return { id: rel.id };
}

export async function updateRelationship(
  id: string,
  dynastyId: string,
  data: Partial<RelationshipData>
): Promise<void> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");
  const validId = IdSchema.parse(id);
  const validDynastyId = IdSchema.parse(dynastyId);
  const validData = RelationshipDataSchema.partial().parse(data);

  await prisma.relationship.update({
    where: { id: validId, dynasty: { id: validDynastyId, ownerId: user.id } },
    data: {
      type: validData.type,
      hook: validData.hook,
      isMutual: validData.isMutual,
    },
  });
}

export async function deleteRelationship(
  id: string,
  dynastyId: string
): Promise<void> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");
  const validId = IdSchema.parse(id);
  const validDynastyId = IdSchema.parse(dynastyId);

  await prisma.relationship.delete({
    where: { id: validId, dynasty: { id: validDynastyId, ownerId: user.id } },
  });
}
