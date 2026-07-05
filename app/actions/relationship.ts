"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { IdSchema, RelationshipDataSchema } from "@/lib/schemas";
import type { RelationshipData } from "@/types/canvas";

const PairEdgeSchema = z.object({
  fromId: IdSchema,
  toId: IdSchema,
  type: z.enum(['SPOUSE', 'PARENT', 'ADOPTED']),
});
const PairEdgesSchema = z.array(PairEdgeSchema).min(1).max(20);

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

export async function createFamily(
  dynastyId: string,
  parentIds: string[],
  childIds: string[],
  adoptedIds: string[],
): Promise<{ relationships: { id: string; fromId: string; toId: string; type: string }[] }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");
  const validDynastyId = IdSchema.parse(dynastyId);

  const dynasty = await prisma.dynasty.findFirst({
    where: { id: validDynastyId, ownerId: user.id },
    select: { id: true },
  });
  if (!dynasty) throw new Error("Dynasty not found");

  const pairEdges: { fromId: string; toId: string; type: string }[] = [];

  // Spouse edge (if 2 parents)
  if (parentIds.length === 2) {
    pairEdges.push({ fromId: parentIds[0], toId: parentIds[1], type: 'SPOUSE' });
  }

  // Parent → child edges (one per parent per child)
  for (const parentId of parentIds) {
    for (const childId of childIds) {
      pairEdges.push({ fromId: parentId, toId: childId, type: 'PARENT' });
    }
    for (const adoptedId of adoptedIds) {
      pairEdges.push({ fromId: parentId, toId: adoptedId, type: 'ADOPTED' });
    }
  }

  const created = await prisma.$transaction(
    pairEdges.map(e =>
      prisma.relationship.create({
        data: {
          dynastyId: validDynastyId,
          fromId: e.fromId,
          toId: e.toId,
          type: e.type,
          isMutual: false,
        },
      })
    )
  );

  return {
    relationships: created.map(r => ({
      id: r.id, fromId: r.fromId, toId: r.toId, type: r.type,
    })),
  };
}

/** Persists the pair edges computed by lib/relative-ops.ts computeAddRelative. */
export async function createRelativeEdges(
  dynastyId: string,
  pairEdges: { fromId: string; toId: string; type: 'SPOUSE' | 'PARENT' | 'ADOPTED' }[],
): Promise<void> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");
  const validDynastyId = IdSchema.parse(dynastyId);
  const validEdges = PairEdgesSchema.parse(pairEdges);

  const dynasty = await prisma.dynasty.findFirst({
    where: { id: validDynastyId, ownerId: user.id },
    select: { id: true },
  });
  if (!dynasty) throw new Error("Dynasty not found");

  const ids = [...new Set(validEdges.flatMap(e => [e.fromId, e.toId]))];
  const owned = await prisma.character.count({
    where: { id: { in: ids }, dynastyId: validDynastyId },
  });
  if (owned !== ids.length) throw new Error("Character not found");

  await prisma.relationship.createMany({
    data: validEdges.map(e => ({
      dynastyId: validDynastyId,
      fromId: e.fromId,
      toId: e.toId,
      type: e.type,
      isMutual: false,
    })),
  });
}
