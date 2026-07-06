"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { CatalogKind, CatalogOption } from "@/lib/catalog";
import {
  DEFAULT_CATALOG,
  mergeCatalog,
  resolveOption as baseResolveOption,
} from "@/lib/catalog";
import { getCustomOptions } from "@/app/actions/custom-options";

// ─── Types ────────────────────────────────────────────────────────────────────

type KindMap = Record<CatalogKind, CatalogOption[]>;

interface CatalogContextValue {
  /** All user custom options keyed by kind */
  customs: KindMap;
  /** Defaults + customs merged for a given kind (for picker dropdowns) */
  getMerged: (kind: CatalogKind) => CatalogOption[];
  /** Resolve a token to a CatalogOption; returns a synthetic fallback for unknowns */
  resolve: (kind: CatalogKind, value: string) => CatalogOption;
  /** Optimistically add a newly-created custom option */
  addCustom: (kind: CatalogKind, option: CatalogOption) => void;
  /** Optimistically remove a deleted custom option */
  removeCustom: (kind: CatalogKind, value: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CatalogContext = createContext<CatalogContextValue | null>(null);

const EMPTY_CUSTOMS: KindMap = {
  CHARACTER_STYLE: [],
  RELATIONSHIP_TYPE: [],
};

// ─── Provider ─────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
  /** When false (guest mode), no custom options are fetched or surfaced. */
  isLoggedIn: boolean;
}

export function CatalogProvider({ children, isLoggedIn }: Props) {
  const [customs, setCustoms] = useState<KindMap>(EMPTY_CUSTOMS);

  // Fetch the user's custom options once on mount (logged-in only)
  useEffect(() => {
    if (!isLoggedIn) return;
    getCustomOptions()
      .then((entries) => {
        const byKind: KindMap = {
          CHARACTER_STYLE: [],
          RELATIONSHIP_TYPE: [],
        };
        for (const e of entries) {
          byKind[e.kind].push({
            id: e.id,
            value: e.value,
            label: e.label,
            color: e.color ?? undefined,
            description: e.description ?? undefined,
            isCustom: true,
          });
        }
        setCustoms(byKind);
      })
      .catch(() => {
        // Non-critical: custom options fail gracefully; defaults still work
      });
  }, [isLoggedIn]);

  const getMerged = useCallback(
    (kind: CatalogKind) => mergeCatalog(DEFAULT_CATALOG[kind], customs[kind]),
    [customs]
  );

  const resolve = useCallback(
    (kind: CatalogKind, value: string) =>
      baseResolveOption(kind, value, customs[kind]),
    [customs]
  );

  const addCustom = useCallback(
    (kind: CatalogKind, option: CatalogOption) =>
      setCustoms((prev) => ({
        ...prev,
        [kind]: [...prev[kind], { ...option, isCustom: true }],
      })),
    []
  );

  const removeCustom = useCallback(
    (kind: CatalogKind, value: string) =>
      setCustoms((prev) => ({
        ...prev,
        [kind]: prev[kind].filter((o) => o.value !== value),
      })),
    []
  );

  const ctx = useMemo(
    () => ({ customs, getMerged, resolve, addCustom, removeCustom }),
    [customs, getMerged, resolve, addCustom, removeCustom]
  );

  return (
    <CatalogContext.Provider value={ctx}>{children}</CatalogContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within <CatalogProvider>");
  return ctx;
}
