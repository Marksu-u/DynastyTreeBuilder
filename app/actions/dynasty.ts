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
  CrestSeedSchema,
  GuestSnapshotSchema,
  DynastyExportSchema,
} from "@/lib/schemas";
import type { DynastyExport, GuestSnapshot } from "@/lib/schemas";
import type { CharacterFlag, CharacterGender, LegacyRelationshipType } from "@/types/canvas";
import type { CharacterNodeType, LegacyEdgeType } from "@/store/canvas";

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

export async function setCrestSeed(id: string, seed: string): Promise<{ error?: string }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) return { error: "Too many requests. Slow down." };

  const idResult = IdSchema.safeParse(id);
  if (!idResult.success) return { error: idResult.error.issues[0].message };

  const seedResult = CrestSeedSchema.safeParse(seed);
  if (!seedResult.success) return { error: seedResult.error.issues[0].message };

  await prisma.dynasty.update({
    where: { id: idResult.data, ownerId: user.id },
    data: { crestSeed: seedResult.data },
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

// ─── Guest → account import ───────────────────────────────────────────────────

const VALID_FLAGS: CharacterFlag[] = [
  "FOUNDER", "BASTARD", "ADOPTED", "EXILE", "DECEASED",
];
const VALID_GENDERS: CharacterGender[] = [
  "MALE", "FEMALE", "NON_BINARY", "UNKNOWN",
];

type CharacterRow = {
  name: string;
  alias: string | null;
  flags: string[];
  style: string;
  gender: CharacterGender;
  note: string | null;
  posX: number;
  posY: number;
};

/** Defensively coerce a guest character node's loose `data` into a DB row. */
function toCharacterRow(
  data: Record<string, unknown>,
  position: { x: number; y: number },
): CharacterRow | null {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) return null;
  const flags = Array.isArray(data.flags)
    ? (data.flags.filter(
        (f): f is CharacterFlag => VALID_FLAGS.includes(f as CharacterFlag),
      ))
    : [];
  const gender = VALID_GENDERS.includes(data.gender as CharacterGender)
    ? (data.gender as CharacterGender)
    : "UNKNOWN";
  return {
    name,
    alias: typeof data.alias === "string" && data.alias.trim() ? data.alias.trim() : null,
    flags,
    style: typeof data.style === "string" && data.style ? data.style : "OTHER",
    gender,
    note: typeof data.note === "string" && data.note ? data.note : null,
    posX: position.x,
    posY: position.y,
  };
}

/**
 * Convert the union-node canvas model into DB pair edges (SPOUSE/PARENT/ADOPTED),
 * mirroring `createFamily`. Only emits edges between persisted (non-ghost) chars.
 */
function deriveRelationships(
  snapshot: GuestSnapshot,
  idMap: Map<string, string>,
): { fromId: string; toId: string; type: string }[] {
  const unionIds = new Set(
    snapshot.nodes.filter((n) => n.type === "union").map((n) => n.id),
  );
  const pairs: { fromId: string; toId: string; type: string }[] = [];

  for (const unionId of unionIds) {
    const partnerIds = snapshot.edges
      .filter((e) => e.target === unionId && e.data?.type === "PARTNER")
      .map((e) => idMap.get(e.source))
      .filter((id): id is string => !!id);
    const childIds = snapshot.edges
      .filter((e) => e.source === unionId && e.data?.type === "CHILD")
      .map((e) => idMap.get(e.target))
      .filter((id): id is string => !!id);
    const adoptedIds = snapshot.edges
      .filter((e) => e.source === unionId && e.data?.type === "ADOPTED_CHILD")
      .map((e) => idMap.get(e.target))
      .filter((id): id is string => !!id);

    if (partnerIds.length === 2) {
      pairs.push({ fromId: partnerIds[0], toId: partnerIds[1], type: "SPOUSE" });
    }
    for (const parentId of partnerIds) {
      for (const childId of childIds) {
        pairs.push({ fromId: parentId, toId: childId, type: "PARENT" });
      }
      for (const adoptedId of adoptedIds) {
        pairs.push({ fromId: parentId, toId: adoptedId, type: "ADOPTED" });
      }
    }
  }

  return pairs;
}

export async function importGuestWorld(
  input: { name: string; nodes: unknown[]; edges: unknown[] },
): Promise<{ id: string }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");

  const snapshot = GuestSnapshotSchema.parse(input);

  const characterNodes = snapshot.nodes.filter(
    (n) => n.type === "character" && n.data.isGhost !== true,
  );
  if (characterNodes.length === 0) throw new Error("Nothing to import");

  const dynasty = await prisma.$transaction(async (tx) => {
    const created = await tx.dynasty.create({
      data: {
        name: snapshot.name,
        slug: makeSlug(snapshot.name),
        setting: "FANTASY",
        ownerId: user.id,
      },
    });

    const idMap = new Map<string, string>();
    for (const node of characterNodes) {
      const row = toCharacterRow(node.data, node.position);
      if (!row) continue;
      const char = await tx.character.create({
        data: { dynastyId: created.id, ...row },
      });
      idMap.set(node.id, char.id);
    }

    const relationships = deriveRelationships(snapshot, idMap);
    if (relationships.length > 0) {
      await tx.relationship.createMany({
        data: relationships.map((r) => ({
          dynastyId: created.id,
          fromId: r.fromId,
          toId: r.toId,
          type: r.type,
          isMutual: false,
        })),
      });
    }

    return created;
  });

  return { id: dynasty.id };
}

// ─── Replace an existing dynasty from an exported JSON file ───────────────────

export async function replaceDynastyFromExport(
  dynastyId: string,
  raw: unknown,
): Promise<{ nodes: CharacterNodeType[]; edges: LegacyEdgeType[] }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");
  const validId = IdSchema.parse(dynastyId);
  const data: DynastyExport = DynastyExportSchema.parse(raw);

  const dynasty = await prisma.dynasty.findFirst({
    where: { id: validId, ownerId: user.id },
    select: { id: true },
  });
  if (!dynasty) throw new Error("Dynasty not found");

  const result = await prisma.$transaction(async (tx) => {
    await tx.relationship.deleteMany({ where: { dynastyId: validId } });
    await tx.character.deleteMany({ where: { dynastyId: validId } });

    const idMap = new Map<string, string>();
    const characters = [];
    for (const c of data.characters) {
      const row = await tx.character.create({
        data: {
          dynastyId: validId,
          name: c.name,
          alias: c.alias,
          flags: c.flags,
          style: c.style,
          gender: c.gender,
          note: c.note,
          posX: c.posX,
          posY: c.posY,
        },
      });
      idMap.set(c.id, row.id);
      characters.push(row);
    }

    const relationshipsData = data.relationships
      .map((r) => ({
        fromId: idMap.get(r.fromId),
        toId: idMap.get(r.toId),
        type: r.type,
        isMutual: r.isMutual,
        hook: r.hook,
      }))
      .filter(
        (
          r,
        ): r is {
          fromId: string;
          toId: string;
          type: typeof r.type;
          isMutual: boolean;
          hook: string | null;
        } => !!r.fromId && !!r.toId,
      );

    let relationships: {
      id: string;
      fromId: string;
      toId: string;
      type: string;
      isMutual: boolean;
      hook: string | null;
    }[] = [];
    if (relationshipsData.length > 0) {
      await tx.relationship.createMany({
        data: relationshipsData.map((r) => ({ dynastyId: validId, ...r })),
      });
      relationships = await tx.relationship.findMany({ where: { dynastyId: validId } });
    }

    return { characters, relationships };
  });

  revalidatePath(`/dashboard/${validId}`);

  // Same row→node/edge conversion as app/dashboard/[id]/page.tsx:53-77 (the
  // initial page load) — reused here so DynastyCanvas can treat an import
  // exactly like a fresh load.
  return {
    nodes: result.characters.map((char) => ({
      id: char.id,
      type: "character" as const,
      position: { x: char.posX, y: char.posY },
      data: {
        name: char.name,
        alias: char.alias ?? undefined,
        flags: char.flags as CharacterFlag[],
        style: char.style,
        gender: char.gender as CharacterGender,
        note: char.note ?? undefined,
      },
    })),
    edges: result.relationships.map((rel) => ({
      id: rel.id,
      type: "relationship" as const,
      source: rel.fromId,
      target: rel.toId,
      data: {
        type: rel.type as LegacyRelationshipType,
        hook: rel.hook ?? undefined,
        isMutual: rel.isMutual,
      },
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
