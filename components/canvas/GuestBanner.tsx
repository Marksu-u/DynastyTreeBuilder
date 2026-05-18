"use client";

import Link from 'next/link';
import { LogIn } from 'lucide-react';

export function GuestBanner() {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
      <p className="text-xs text-zinc-400">
        <span className="font-semibold text-zinc-200">Dynasty Tree Builder</span>
        {' — '}
        Guest mode. Your tree is saved in this browser only.
      </p>
      <Link
        href="/login"
        className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
      >
        <LogIn size={12} />
        Sign in to save
      </Link>
    </div>
  );
}
