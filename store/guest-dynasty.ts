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
  /** Take on the seeded example's identity — same arms for every visitor. */
  adoptExample: (name: string, crestSeed: string) => void;
  /** Back to a blank house, with arms nobody else has. */
  resetHouse: () => void;
}

function freshHouse(): GuestHouse {
  return {
    name: DEFAULT_HOUSE_NAME,
    setting: 'FANTASY',
    // Generated per browser rather than derived from a constant, so two guests
    // never share a crest. Persisted immediately, so it is stable from the
    // first frame.
    crestSeed: randomCrestSeed(),
  };
}

export const useGuestDynastyStore = create<GuestDynastyState>()(
  persist(
    (set) => ({
      ...freshHouse(),
      setHouse: (patch) => set(patch),
      adoptExample: (name, crestSeed) => set({ name, crestSeed }),
      resetHouse: () => set(freshHouse()),
    }),
    {
      name: 'dynasty-tree-guest-house',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ name: s.name, setting: s.setting, crestSeed: s.crestSeed }),
    },
  ),
);
