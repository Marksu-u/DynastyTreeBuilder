// store/guest-dynasty.ts
// Guest-mode house identity: the same name / setting / crest an account keeps
// on its Dynasty row. Deliberately separate from store/canvas.ts — that store
// is the graph plus its undo history, and renaming a house has no business in
// an undo snapshot.
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
// crest is on screen.
const INITIAL_HOUSE: GuestHouse = {
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
