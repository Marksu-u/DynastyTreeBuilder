"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { IdSchema } from "@/lib/schemas";
import type { PairEdge } from "@/lib/relative-ops";

const PairEdgeSchema = z.object({
  fromId: IdSchema,
  toId: IdSchema,
  type: z.enum(['SPOUSE', 'PARENT', 'ADOPTED']),
});
// Cap sized for the largest legitimate emission: a second parent joining a
// solo-parent union emits 1 SPOUSE + one PARENT per existing child.
const PairEdgesSchema = z.array(PairEdgeSchema).min(1).max(50);

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
  pairEdges: PairEdge[],
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

// Same shape as PairEdgesSchema but 0 items is valid — a removal batch that
// only garbage-collects an empty union has nothing to delete server-side.
const DeletePairEdgesSchema = z.array(PairEdgeSchema).max(50);

/** Deletes the pair edges computed by lib/relative-ops.ts computeRemoveRelative. */
export async function deleteRelativeEdges(
  dynastyId: string,
  pairEdges: PairEdge[],
): Promise<void> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");
  const validDynastyId = IdSchema.parse(dynastyId);
  const validEdges = DeletePairEdgesSchema.parse(pairEdges);
  if (validEdges.length === 0) return;

  const dynasty = await prisma.dynasty.findFirst({
    where: { id: validDynastyId, ownerId: user.id },
    select: { id: true },
  });
  if (!dynasty) throw new Error("Dynasty not found");

  await prisma.relationship.deleteMany({
    where: {
      dynastyId: validDynastyId,
      // SPOUSE is stored directionally but is semantically symmetric (the
      // row could be (A,B) or (B,A) depending on who was the anchor when it
      // was created) — match either direction. PARENT/ADOPTED are always
      // parent -> child and match exactly.
      OR: validEdges.map(e =>
        e.type === 'SPOUSE'
          ? {
              type: 'SPOUSE' as const,
              OR: [
                { fromId: e.fromId, toId: e.toId },
                { fromId: e.toId, toId: e.fromId },
              ],
            }
          : { type: e.type, fromId: e.fromId, toId: e.toId },
      ),
    },
  });
}
