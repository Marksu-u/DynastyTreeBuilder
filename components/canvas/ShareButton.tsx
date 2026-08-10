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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    navigator.clipboard.writeText(`${siteUrl}/share/${slug}`).then(() => {
      toast.success("Link copied!");
    }).catch(() => {
      toast.error("Could not copy — check clipboard permission");
    });
  }

  // The workspace's single accent action (design.md §9, top-right slot).
  // Publishing is what this tool is *for* — handing the house to your table —
  // so it is the one thing on the canvas allowed to carry the accent fill.
  return (
    <button
      onClick={handleShare}
      className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-zinc-950 shadow-lg transition-opacity hover:opacity-90"
      title={isPublic ? "Copy share link" : "Dynasty is private — enable in Settings"}
    >
      <Link2 size={13} />
      Share
    </button>
  );
}
