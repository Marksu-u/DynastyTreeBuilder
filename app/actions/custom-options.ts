"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { IdSchema, CustomOptionInputSchema, CustomOptionKindSchema } from "@/lib/schemas";
import { DEFAULT_CATALOG } from "@/lib/catalog";
import type { CatalogKind, CatalogOption } from "@/lib/catalog";

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export type CustomOptionEntry = {
  id: string;
  kind: CatalogKind;
  value: string;
  label: string;
  color: string | null;
  description: string | null;
};

// ─── Token derivation (server-side only — never trust a client-supplied token) ─

/**
 * Derive a SCREAMING_SNAKE_CASE token from a human label.
 * "Spymaster" → "SPYMASTER"
 * "Blood Debt" → "BLOOD_DEBT"
 * "Reluctant Ally!" → "RELUCTANT_ALLY"
 */
function deriveToken(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// ─── Server actions ────────────────────────────────────────────────────────────

/**
 * Fetch the authenticated user's custom catalog options.
 * Optionally filtered to a single kind.
 */
export async function getCustomOptions(
  kind?: CatalogKind
): Promise<CustomOptionEntry[]> {
  const user = await getAuthUser();

  const rows = await prisma.customOption.findMany({
    where: {
      userId: user.id,
      ...(kind ? { kind } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind as CatalogKind,
    value: r.value,
    label: r.label,
    color: r.color,
    description: r.description,
  }));
}

/**
 * Create a new user-authored catalog option.
 * The `value` token is derived server-side from the label — clients never supply it.
 * Rejects tokens that collide with a built-in default or an existing custom option.
 */
export async function addCustomOption(input: {
  kind: string;
  label: string;
  color?: string;
  description?: string;
}): Promise<{ id: string; value: string; label: string; kind: string }> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");

  const valid = CustomOptionInputSchema.parse(input);
  const kind = valid.kind as CatalogKind;

  const value = deriveToken(valid.label);
  if (!value) throw new Error("Label produces an empty token — use letters or digits.");

  // Reject collision with built-in defaults
  const defaults = DEFAULT_CATALOG[kind];
  if (defaults.some((o) => o.value === value)) {
    throw new Error(
      `"${valid.label}" matches a built-in option. Choose a different name.`
    );
  }

  // Reject duplicate own custom (DB constraint is the safety net, but give a nice error)
  const existing = await prisma.customOption.findFirst({
    where: { userId: user.id, kind, value },
    select: { id: true },
  });
  if (existing) {
    throw new Error(`You already have a custom ${kind.toLowerCase()} with the same name.`);
  }

  const entry = await prisma.customOption.create({
    data: {
      kind,
      value,
      label: valid.label.trim(),
      color: valid.color ?? null,
      description: valid.description?.trim() || null,
      userId: user.id,
    },
  });

  return { id: entry.id, value: entry.value, label: entry.label, kind: entry.kind };
}

/**
 * Update the label, color, or description of a custom option.
 * The `value` token is intentionally immutable — renaming it would orphan
 * any characters/relationships already using the old token.
 */
export async function updateCustomOption(
  id: string,
  patch: { label?: string; color?: string | null; description?: string | null }
): Promise<void> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");

  const validId = IdSchema.parse(id);

  await prisma.customOption.update({
    where: { id: validId, userId: user.id },
    data: {
      ...(patch.label !== undefined ? { label: patch.label.trim() } : {}),
      ...(patch.color !== undefined ? { color: patch.color } : {}),
      ...(patch.description !== undefined
        ? { description: patch.description?.trim() || null }
        : {}),
    },
  });
}

/**
 * Delete a custom option.
 * Characters/relationships that already use this token are NOT touched —
 * they fall back to the neutral `resolveOption` fallback in the UI.
 */
export async function deleteCustomOption(id: string): Promise<void> {
  const user = await getAuthUser();
  if (!checkRateLimit(user.id)) throw new Error("Too many requests. Slow down.");

  const validId = IdSchema.parse(id);

  await prisma.customOption.delete({
    where: { id: validId, userId: user.id },
  });
}

/**
 * Convenience: fetch all custom options for the current user as an array of
 * CatalogOption objects suitable for passing directly into mergeCatalog / resolveOption.
 */
export async function getCustomCatalog(): Promise<CatalogOption[]> {
  const user = await getAuthUser();
  const rows = await prisma.customOption.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    value: r.value,
    label: r.label,
    color: r.color ?? undefined,
    description: r.description ?? undefined,
    isCustom: true,
  }));
}
