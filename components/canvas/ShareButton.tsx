"use client";

import { useTranslations } from 'next-intl';
import { Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  slug: string;
  isPublic: boolean;
}

export function ShareButton({ slug, isPublic }: Props) {
  const t = useTranslations('canvas.share');

  function handleShare() {
    if (!isPublic) {
      toast(t("makePublic"));
      return;
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    navigator.clipboard.writeText(`${siteUrl}/share/${slug}`).then(() => {
      toast.success(t("copied"));
    }).catch(() => {
      toast.error(t("copyFailed"));
    });
  }

  // The workspace's single accent action (design.md §9, top-right slot).
  // Publishing is what this tool is *for* — handing the house to your table —
  // so it is the one thing on the canvas allowed to carry the accent fill.
  return (
    <button
      onClick={handleShare}
      className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-zinc-950 shadow-lg transition-opacity hover:opacity-90"
      title={isPublic ? t("copy") : t("private")}
    >
      <Link2 size={13} />
      {t("label")}
    </button>
  );
}
