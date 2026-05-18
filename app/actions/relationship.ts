"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import type { RelationshipData } from "@/types/canvas";

export async function createRelationship(
  dynastyId: string,
  fromId: string,
  toId: string,
  data: RelationshipData
): Promise<{ id: string }> {
  const user = await getAuthUser();

  const dynasty = await prisma.dynasty.findFirst({
    where: { id: dynastyId, ownerId: user.id },
    select: { id: true },
  });
  if (!dynasty) throw new Error("Dynasty not found");

  const rel = await prisma.relationship.create({
    data: {
      dynastyId,
      fromId,
      toId,
      type: data.type,
      tag: data.tag,
      hook: data.hook,
      isMutual: data.isMutual,
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

  await prisma.relationship.update({
    where: { id, dynasty: { id: dynastyId, ownerId: user.id } },
    data: {
      type: data.type,
      tag: data.tag ?? null,
      hook: data.hook,
      isMutual: data.isMutual,
    },
  });
}

export async function deleteRelationship(
  id: string,
  dynastyId: string
): Promise<void> {
  const user = await getAuthUser();

  await prisma.relationship.delete({
    where: { id, dynasty: { id: dynastyId, ownerId: user.id } },
  });
}
