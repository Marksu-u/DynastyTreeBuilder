"use client";

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { crestFromSeed, crestToSvg } from '@/lib/crest';
import { useGuestDynastyStore, useGuestHouse } from '@/store/guest-dynasty';
import { DynastySettingsDialog, type HouseSettings } from '@/components/dashboard/DynastySettingsDialog';
import type { DynastySetting } from '@/lib/schemas';

export function GuestBanner() {
  // useGuestHouse, never the store directly: `persist` rehydrates synchronously
  // at module load, so reading the store in a render body mismatches at
  // hydration for any returning guest. See store/guest-dynasty.ts.
  const { name, setting, crestSeed } = useGuestHouse();
  const setHouse = useGuestDynastyStore(s => s.setHouse);
  const ensureCrestSeed = useGuestDynastyStore(s => s.ensureCrestSeed);

  // The store ships an empty seed so the server and the browser's first render
  // agree; the arms are minted here, after mount.
  useEffect(() => { ensureCrestSeed(); }, [ensureCrestSeed]);

  const crest = useMemo(
    () => (crestSeed ? crestToSvg(crestFromSeed(crestSeed), 20) : null),
    [crestSeed],
  );

  function handleSave(next: HouseSettings) {
    setHouse({
      name: next.name.trim() || name,
      setting: next.setting as DynastySetting,
      crestSeed: next.crestSeed,
    });
  }

  return (
    <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-2">
      {crest && (
        <span
          aria-hidden="true"
          style={{ display: 'inline-block', lineHeight: 0 }}
          dangerouslySetInnerHTML={{ __html: crest }}
        />
      )}
      <span className="text-sm font-medium text-zinc-200">{name}</span>
      <p className="text-xs text-zinc-500">Guest mode — saved in this browser only.</p>

      <div className="ml-auto flex items-center gap-2">
        {/* The same dialog the account canvas uses; only the saver differs, and
            there is no Public toggle because a guest tree has no share link. */}
        <DynastySettingsDialog
          initial={{ name, setting, crestSeed }}
          onSave={handleSave}
        />
        <Link
          href="/login"
          className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          <LogIn size={12} />
          Sign in to save
        </Link>
      </div>
    </div>
  );
}
