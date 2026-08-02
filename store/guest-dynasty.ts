// store/guest-dynasty.ts
// Guest-mode house identity: the same name / setting / crest an account keeps
// on its Dynasty row. Deliberately separate from store/canvas.ts — that store
// is the graph plus its undo history, and renaming a house has no business in
// an undo snapshot.
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { randomCrestSeed } from '@/lib/crest';
import { safeStorage } from '@/lib/safe-storage';
import type { DynastySetting } from '@/lib/schemas';

export const DEFAULT_HOUSE_NAME = 'Your Dynasty';

export interface GuestHouse {
  name: string;
  setting: DynastySetting;
  crestSeed: string;
}

interface GuestDynastyState extends GuestHouse {
  setHouse: (patch: Partial<GuestHouse>) => void;
  /** Take on the seeded example's identity. Leaves `setting` to the guest. */
  adoptExample: (name: string, crestSeed: string) => void;
  /** Back to a blank house, with arms nobody else has. */
  resetHouse: () => void;
  /** Mint arms on first mount. Call from a client effect, never during render. */
  ensureCrestSeed: () => void;
}

// No randomness in the initial state: the server render and the browser's first
// render must agree, or every fresh page load is a hydration mismatch once the
// crest is on screen. That only covers a first-time guest, though — `persist`
// rehydrates synchronously as this module loads, so a *returning* guest's
// store already holds their real house before React ever renders on the
// client. Reading the store directly still mismatches for them, on `name` as
// much as on `crestSeed`. useGuestHouse below is what actually closes that gap.
export const INITIAL_HOUSE: GuestHouse = {
  name: DEFAULT_HOUSE_NAME,
  setting: 'FANTASY',
  crestSeed: '',
};

// Safe to randomise: only ever reached from a click, long after hydration.
function freshHouse(): GuestHouse {
  return { ...INITIAL_HOUSE, crestSeed: randomCrestSeed() };
}

export const useGuestDynastyStore = create<GuestDynastyState>()(
  persist(
    (set, get) => ({
      ...INITIAL_HOUSE,
      setHouse: (patch) => set(patch),
      adoptExample: (name, crestSeed) => set({ name, crestSeed }),
      resetHouse: () => set(freshHouse()),
      ensureCrestSeed: () => {
        if (!get().crestSeed) set({ crestSeed: randomCrestSeed() });
      },
    }),
    {
      name: 'dynasty-tree-guest-house',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ name: s.name, setting: s.setting, crestSeed: s.crestSeed }),
    },
  ),
);

/**
 * The house as it is safe to *render*.
 *
 * `persist` rehydrates synchronously as this module loads, so on a returning
 * guest's very first client render the store already holds their real house
 * while the server rendered the defaults. Reading the store directly in a
 * render body therefore mismatches at hydration — on the name as much as on
 * the crest. This returns the same defaults the server used until after mount,
 * then the real house, which is the pattern GuestImportPrompt.tsx already uses
 * for the same reason.
 *
 * Use this anywhere the house reaches the DOM. Use the store directly only in
 * event handlers and effects, which never run during hydration.
 */
export function useGuestHouse(): GuestHouse {
  const name = useGuestDynastyStore((s) => s.name);
  const setting = useGuestDynastyStore((s) => s.setting);
  const crestSeed = useGuestDynastyStore((s) => s.crestSeed);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return mounted ? { name, setting, crestSeed } : INITIAL_HOUSE;
}
