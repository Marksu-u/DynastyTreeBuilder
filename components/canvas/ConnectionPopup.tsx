// components/canvas/ConnectionPopup.tsx
"use client";

import { useEffect, useRef } from 'react';

interface Props {
  /** Screen-space position for the popup */
  x: number;
  y: number;
  onSelect: (choice: 'partner' | 'child' | 'adopted') => void;
  onDismiss: () => void;
}

const OPTIONS: { key: 'partner' | 'child' | 'adopted'; label: string; desc: string }[] = [
  { key: 'partner', label: '👫 Partners',       desc: 'Create a union between these two' },
  { key: 'child',   label: '👶 Parent → Child',  desc: 'Add as biological child of this character' },
  { key: 'adopted', label: '📜 Adopted',         desc: 'Add as adopted child of this character' },
];

export function ConnectionPopup({ x, y, onSelect, onDismiss }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    }
    function keyHandler(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss();
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onDismiss]);

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left: x, top: y, zIndex: 1000 }}
      className="rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-2xl"
    >
      {OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => onSelect(opt.key)}
          title={opt.desc}
          className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
