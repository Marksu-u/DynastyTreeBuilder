"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { IdSchema, CharacterDataSchema } from "@/lib/schemas";
import type { PairEdge } from "@/lib/relative-ops";
import type { CharacterData } from "@/types/canvas";

const PairEdgeSchema = z.object({
  fromId: IdSchema,
  toId: IdSchema,
  type: z.enum(['SPOUSE', 'PARENT', 'ADOPTED']),
});
// Cap sized for the largest legitimate emission: a second parent joining a
// solo-parent union emits 1 SPOUSE + one PARENT per existing child.
const PairEdgesSchema = z.array(PairEdgeSchema).min(1).max(50);

const NewPersonSchema = z.object({ newData: CharacterDataSchema, newId: IdSchema });
const ExistingPersonSchema = z.object({ existingId: IdSchema });
const PersonSchema = z.union([NewPersonSchema, ExistingPersonSchema]);
type Person = { newData: CharacterData; newId: string } | { existingId: string };

/**
 * Creates the relative — a new character or a link to an existing one — and
 * its pair-edge relationship rows in a single transaction. Doing both inserts
 * atomically means a mid-flight failure can't leave an orphaned character row
 * with no relationships, which the create-character-then-create-edges two-call
 * sequence this replaced could do.
 *
 * pairEdges may reference the new person by `person.newId` (a client-generated
 * placeholder); it's remapped to the real DB id before the relationship rows
 * are inserted.
 */
export async function addRelative(
  dynastyId: string,
  person: Person,
  pairEdges: PairEdge[],
): Promise<{ id: string }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");
  const validDynastyId = IdSchema.parse(dynastyId);
  const validPerson = PersonSchema.parse(person);
  const validEdges = PairEdgesSchema.parse(pairEdges);

  const dynasty = await prisma.dynasty.findFirst({
    where: { id: validDynastyId, ownerId: user.id },
    select: { id: true },
  });
  if (!dynasty) throw new Error("Dynasty not found");

  return prisma.$transaction(async (tx) => {
    let realId: string;
    if ('newData' in validPerson) {
      const character = await tx.character.create({
        data: {
          dynastyId: validDynastyId,
          name: validPerson.newData.name,
          alias: validPerson.newData.alias,
          flags: validPerson.newData.flags,
          style: validPerson.newData.style,
          gender: validPerson.newData.gender,
          note: validPerson.newData.note,
          posX: 0,
          posY: 0,
        },
      });
      realId = character.id;
    } else {
      realId = validPerson.existingId;
    }

    const remap = (id: string) => ('newData' in validPerson && id === validPerson.newId ? realId : id);
    const remappedEdges = validEdges.map(e => ({ fromId: remap(e.fromId), toId: remap(e.toId), type: e.type }));

    const ids = [...new Set(remappedEdges.flatMap(e => [e.fromId, e.toId]))];
    const owned = await tx.character.count({ where: { id: { in: ids }, dynastyId: validDynastyId } });
    if (owned !== ids.length) throw new Error("Character not found");

    await tx.relationship.createMany({
      data: remappedEdges.map(e => ({
        dynastyId: validDynastyId,
        fromId: e.fromId,
        toId: e.toId,
        type: e.type,
        isMutual: false,
      })),
    });

    return { id: realId };
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
