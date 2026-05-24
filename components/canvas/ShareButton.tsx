"use client";

import { Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  slug: string;
  isPublic: boolean;
}

export function ShareButton({ slug, isPublic }: Props) {
  function handleShare() {
    if (!isPublic) {
      toast("Make this dynasty public in Settings first");
      return;
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    navigator.clipboard.writeText(`${siteUrl}/share/${slug}`).then(() => {
      toast.success("Link copied!");
    }).catch(() => {
      toast.error("Could not copy — check clipboard permission");
    });
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
      title={isPublic ? "Copy share link" : "Dynasty is private — enable in Settings"}
    >
      <Link2 size={13} />
      Share
    </button>
  );
}
