// components/canvas/AddRelativeHint.tsx
"use client";

import { useTranslations } from "next-intl";

interface Props {
  visible: boolean;
}

/** Points first-time users at the select-then-+ flow once their first character exists. */
export function AddRelativeHint({ visible }: Props) {
  const t = useTranslations("canvas.hint");

  if (!visible) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2 rounded-full border border-zinc-700 bg-zinc-900/95 px-4 py-1.5 text-xs text-zinc-300 shadow-lg backdrop-blur-sm">
      {t.rich("addRelative", {
        plus: (chunks) => <span className="text-accent">{chunks}</span>,
      })}
    </div>
  );
}
