"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { createWithUniqueSlug } from "@/lib/slug";
import {
  IdSchema,
  DynastyNameSchema,
  DynastySettingSchema,
  DynastySettingsSchema,
  GuestSnapshotSchema,
  DynastyExportSchema,
  MAX_ALIAS,
  MAX_CHARACTER_NAME,
  MAX_NOTE,
} from "@/lib/schemas";
import type { DynastyExport, GuestSnapshot } from "@/lib/schemas";
import type { CharacterFlag, CharacterGender, LegacyRelationshipType } from "@/types/canvas";
import type { CharacterNodeType, LegacyEdgeType } from "@/store/canvas";

/**
 * Drops the cached public surface for one dynasty.
 *
 * Both share routes are ISR — the page at 60s, the OG card at an hour — so
 * without this, unpublishing a dynasty left its tree being served to anyone
 * holding the link for up to that long, and the OG card kept rendering the
 * structure for an hour. Every action that changes what the share page shows,
 * or whether it should show anything at all, has to call this.
 */
function revalidateShare(slug: string): void {
  revalidatePath(`/share/${slug}`);
  revalidatePath(`/share/${slug}/og`);
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
      crestSeed: true,
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

  const nameResult = DynastyNameSchema.safeParse(formData.get("name") ?? "");
  if (!nameResult.success) return { error: nameResult.error.issues[0].message };

  const settingResult = DynastySettingSchema.safeParse(
    formData.get("setting") ?? "FANTASY"
  );
  if (!settingResult.success) return { error: settingResult.error.issues[0].message };

  let dynasty: { id: string };
  try {
    dynasty = await createWithUniqueSlug(nameResult.data, (slug) =>
      prisma.dynasty.create({
        data: {
          name: nameResult.data,
          slug,
          setting: settingResult.data,
          ownerId: user.id,
        },
        select: { id: true },
      }),
    );
  } catch {
    // This used to throw straight into the route's error boundary, losing the
    // form. Returning the error keeps the user on the page they filled in.
    return { error: "Couldn't create that dynasty. Please try again." };
  }

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

  const nameResult = DynastyNameSchema.safeParse(name);
  if (!nameResult.success) return { error: nameResult.error.issues[0].message };

  const updated = await prisma.dynasty.update({
    where: { id: idResult.data, ownerId: user.id },
    data: { name: nameResult.data },
    select: { slug: true },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${idResult.data}`);
  revalidateShare(updated.slug);
  return {};
}

export async function deleteDynasty(id: string): Promise<{ error?: string }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) return { error: "Too many requests. Slow down." };

  const idResult = IdSchema.safeParse(id);
  if (!idResult.success) return { error: idResult.error.issues[0].message };

  let slug: string;
  try {
    const deleted = await prisma.dynasty.delete({
      where: { id: idResult.data, ownerId: user.id },
      select: { slug: true },
    });
    slug = deleted.slug;
  } catch {
    return { error: "Failed to delete dynasty" };
  }

  revalidatePath("/dashboard");
  // A deleted dynasty whose share page is still cached would keep serving the
  // tree to anyone holding the link.
  revalidateShare(slug);
  return {};
}

export async function updateDynastySettings(
  id: string,
  data: { name?: string; setting?: string; isPublic?: boolean; crestSeed?: string }
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
  if (parsed.data.crestSeed !== undefined) update.crestSeed = parsed.data.crestSeed;

  let slug: string;
  try {
    const updated = await prisma.dynasty.update({
      where: { id: idResult.data, ownerId: user.id },
      data: update,
      select: { slug: true },
    });
    slug = updated.slug;
  } catch {
    // Mirrors deleteDynasty: a Prisma throw becomes a returned error, so every
    // caller can handle failure inline instead of hitting the error boundary.
    return { error: "Failed to save settings" };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${idResult.data}`);
  // This is the action that flips isPublic, so it is the one that must drop the
  // public cache — see revalidateShare.
  revalidateShare(slug);
  return {};
}

/** A dynasty row with its relations loaded — the shape both export paths read.
 *  Shared by the single-dynasty export and the account-wide one so the two can
 *  never drift into producing different files for the same tree. */
type DynastyWithRelations = Prisma.DynastyGetPayload<{
  include: { characters: true; relationships: true };
}>;

function serialiseDynasty(
  dynasty: DynastyWithRelations,
  exportedAt: string,
): DynastyExport {
  return {
    version: 1,
    exportedAt,
    dynasty: {
      name: dynasty.name,
      setting: dynasty.setting,
      isPublic: dynasty.isPublic,
      crestSeed: dynasty.crestSeed,
    },
    characters: dynasty.characters.map((c) => ({
      id: c.id,
      name: c.name,
      alias: c.alias,
      flags: c.flags as CharacterFlag[],
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

  return serialiseDynasty(dynasty, new Date().toISOString());
}

/**
 * Everything the account holds, in one file — the "export everything" row on
 * the account screen (design.md §9, W6). Charter non-negotiable: anything a
 * user makes, they can take, so this is deliberately the *whole* account and
 * not a per-dynasty loop the user has to run themselves.
 */
export async function exportEverything(): Promise<{
  version: 1;
  exportedAt: string;
  dynasties: DynastyExport[];
}> {
  const user = await getAuthUser();

  const dynasties = await prisma.dynasty.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      characters: true,
      relationships: true,
    },
  });

  // One timestamp for the whole file rather than one per dynasty — this is a
  // single point-in-time snapshot of the account, not a bundle of exports.
  const exportedAt = new Date().toISOString();

  return {
    version: 1,
    exportedAt,
    dynasties: dynasties.map((d) => serialiseDynasty(d, exportedAt)),
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

/** Reads a loose value as a bounded string, or null if there is nothing there. */
function boundedText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/** Defensively coerce a guest character node's loose `data` into a DB row.
 *
 *  `GuestNodeSchema.data` is an open record — it has to be, because it carries
 *  whatever React Flow left in localStorage — so the field-level caps that
 *  CharacterDataSchema applies elsewhere are applied here instead. Values are
 *  truncated rather than rejected: a snapshot is the guest's own work, and
 *  losing the tail of one over-long note beats failing the whole import. */
function toCharacterRow(
  data: Record<string, unknown>,
  position: { x: number; y: number },
): CharacterRow | null {
  const name = boundedText(data.name, MAX_CHARACTER_NAME);
  if (!name) return null;
  // Deduplicated: the flags column is a set, and a snapshot repeating one flag
  // 10,000 times would otherwise write all of them.
  const flags = Array.isArray(data.flags)
    ? [...new Set(
        data.flags.filter(
          (f): f is CharacterFlag => VALID_FLAGS.includes(f as CharacterFlag),
        ),
      )]
    : [];
  const gender = VALID_GENDERS.includes(data.gender as CharacterGender)
    ? (data.gender as CharacterGender)
    : "UNKNOWN";
  return {
    name,
    alias: boundedText(data.alias, MAX_ALIAS),
    flags,
    style: boundedText(data.style, 60) ?? "OTHER",
    gender,
    note: boundedText(data.note, MAX_NOTE),
    posX: position.x,
    posY: position.y,
  };
}

/**
 * Convert the union-node canvas model into DB pair edges (SPOUSE/PARENT/ADOPTED).
 * Only emits edges between persisted (non-ghost) chars.
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
    // Capped at two, which is what a union *is* — one couple. Without the cap
    // the parent × child loop below is quadratic in a value the caller
    // controls: a crafted snapshot with 6,000 PARTNER edges and 6,000 CHILD
    // edges into a single union derives 36M rows from a 12k-edge input.
    const partnerIds = snapshot.edges
      .filter((e) => e.target === unionId && e.data?.type === "PARTNER")
      .slice(0, 2)
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
  input: {
    name: string;
    setting?: string;
    crestSeed?: string;
    nodes: unknown[];
    edges: unknown[];
  },
): Promise<{ id: string }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");

  const snapshot = GuestSnapshotSchema.parse(input);

  const characterNodes = snapshot.nodes.filter(
    (n) => n.type === "character" && n.data.isGhost !== true,
  );

  // Coerce before opening the transaction, and keep each row paired with the
  // snapshot id it came from so the relationship pass can be remapped onto the
  // real ids afterwards.
  const rows: { sourceId: string; row: CharacterRow }[] = [];
  for (const node of characterNodes) {
    const row = toCharacterRow(node.data, node.position);
    if (row) rows.push({ sourceId: node.id, row });
  }
  // Checked after coercion, not before: a snapshot of nodes that all fail to
  // coerce would otherwise create an empty dynasty and call it a success.
  if (rows.length === 0) throw new Error("Nothing to import");

  // The whole transaction is the retry unit: a slug collision aborts it, and the
  // next attempt starts from a clean slate with a fresh slug.
  const dynasty = await createWithUniqueSlug(snapshot.name, (slug) =>
    prisma.$transaction(async (tx) => {
      const created = await tx.dynasty.create({
        data: {
          name: snapshot.name,
          slug,
          setting: snapshot.setting ?? "FANTASY",
          crestSeed: snapshot.crestSeed ?? null,
          ownerId: user.id,
        },
      });

      // One INSERT ... RETURNING rather than one round trip per character. The
      // rows come back in the order they were sent, which is what lets the index
      // below line up with `rows` — the length check makes that assumption loud
      // if it ever stops holding.
      const createdChars = await tx.character.createManyAndReturn({
        data: rows.map(({ row }) => ({ dynastyId: created.id, ...row })),
        select: { id: true },
      });
      if (createdChars.length !== rows.length) {
        throw new Error("Import failed");
      }
      const idMap = new Map(
        rows.map(({ sourceId }, i) => [sourceId, createdChars[i].id]),
      );

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
    }),
  );

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
    select: { id: true, slug: true },
  });
  if (!dynasty) throw new Error("Dynasty not found");

  const result = await prisma.$transaction(async (tx) => {
    // The file describes a whole house. Two things it must never change:
    // isPublic (importing must not silently publish) and slug (it is the share
    // URL people may already have sent).
    await tx.dynasty.update({
      where: { id: validId },
      data: {
        name: data.dynasty.name,
        setting: data.dynasty.setting,
        ...(data.dynasty.crestSeed ? { crestSeed: data.dynasty.crestSeed } : {}),
      },
    });

    await tx.relationship.deleteMany({ where: { dynastyId: validId } });
    await tx.character.deleteMany({ where: { dynastyId: validId } });

    // One INSERT ... RETURNING for the whole file rather than one round trip
    // per character — same ordering contract as importGuestWorld above.
    const characters = data.characters.length
      ? await tx.character.createManyAndReturn({
          data: data.characters.map((c) => ({
            dynastyId: validId,
            name: c.name,
            alias: c.alias,
            flags: c.flags,
            style: c.style,
            gender: c.gender,
            note: c.note,
            posX: c.posX,
            posY: c.posY,
          })),
        })
      : [];
    if (characters.length !== data.characters.length) {
      throw new Error("Import failed");
    }
    const idMap = new Map(
      data.characters.map((c, i) => [c.id, characters[i].id]),
    );

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
  revalidatePath("/dashboard");
  // The import rewrote every character and relationship, so a cached share page
  // is now showing a tree that no longer exists.
  revalidateShare(dynasty.slug);

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

// getDynasty was removed here: nothing called it, but it was a registered
// Server Action — a live endpoint kept alive for no caller. The page that would
// have used it loads its dynasty directly in app/dashboard/[id]/page.tsx.
