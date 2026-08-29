"use client";

import { useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Trash2, Users } from "lucide-react";
import { deleteDynasty } from "@/app/actions/dynasty";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Crest } from "@/components/ui/Crest";
import { resolveCrestSeed } from "@/lib/crest";

interface Props {
  dynasty: {
    id: string;
    name: string;
    slug: string;
    crestSeed: string | null;
    setting: string;
    updatedAt: Date;
    _count: { characters: number };
  };
}

export function DynastyCard({ dynasty }: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const t = useTranslations("dashboard.card");
  const tSetting = useTranslations("settings");
  const format = useFormatter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDynasty(dynasty.id);
      if (result.error) toast.error(result.error);
      else toast.success(t("deleted", { name: dynasty.name }));
    });
  }

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700">
      <Link href={`/dashboard/${dynasty.id}`} className="block">
        <div className="mb-3 flex items-start gap-3">
          <Crest seed={resolveCrestSeed(dynasty)} size={36} className="shrink-0" />
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
            {tSetting.has(dynasty.setting) ? tSetting(dynasty.setting) : dynasty.setting}
          </span>
        </div>
        <h2 className="mb-1 truncate text-base font-semibold text-zinc-100">
          {dynasty.name}
        </h2>
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Users className="h-3 w-3" />
          <span>{t("characters", { count: dynasty._count.characters })}</span>
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          {t("updated", {
            date: format.dateTime(new Date(dynasty.updatedAt), {
              day: "numeric",
              month: "numeric",
              year: "numeric",
            }),
          })}
        </p>
      </Link>

      <button
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        className="absolute right-3 top-3 cursor-pointer rounded p-1 text-zinc-700 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
        aria-label={t("deleteAria", { name: dynasty.name })}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("confirmTitle", { name: dynasty.name })}
        description={t("confirmBody")}
        confirmLabel={t("confirmLabel")}
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
