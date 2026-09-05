"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { X, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAccount } from "@/app/actions/auth";
import { isDeletionConfirmed } from "@/lib/account/confirm-account";
import { ECOSYSTEM_TOOLS } from "@/components/legal/ecosystem";

interface Props {
  email: string;
}

export function DeleteAccountDialog({ email }: Props) {
  const t = useTranslations("account.delete");
  const tCommon = useTranslations("common");
  // Emphasis inside the copy. The catalogs carry <b>; the class stays here.
  const strong = (chunks: React.ReactNode) => (
    <span className="text-zinc-200">{chunks}</span>
  );
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const armed = isDeletionConfirmed(confirmText, email);

  function handleOpen(value: boolean) {
    if (value) {
      setConfirmText("");
      setError(null);
      setSucceeded(false);
    }
    setOpen(value);
  }

  function handleDelete() {
    if (!armed) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.success(t("success"));
      setSucceeded(true);
      window.location.href = "/";
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpen}>
      <Dialog.Trigger asChild>
        {/* Outline, not fill — design.md §9, screen 6. The only filled
            destructive control in the app is the confirm button inside. */}
        <button className="rounded-md border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:border-destructive">
          {t("trigger")}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-destructive/40 bg-background p-6 shadow-xl focus:outline-none">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <Dialog.Title className="text-base font-semibold text-zinc-100">
                {t("title")}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button aria-label={tCommon("close")} className="rounded p-1 text-zinc-500 hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="mb-3 text-sm text-zinc-400">
            {t.rich("body", { b: strong })}
          </Dialog.Description>

          <ul className="mb-4 space-y-1 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2.5">
            {ECOSYSTEM_TOOLS.map((tool) => (
              <li
                key={tool.name}
                className="flex items-center gap-2 text-xs text-zinc-300"
              >
                <Trash2 className="h-3 w-3 shrink-0 text-destructive" />
                {tool.name}
              </li>
            ))}
          </ul>

          <label
            htmlFor="delete-confirm"
            className="mb-1.5 block text-xs font-medium text-zinc-400"
          >
            {t.rich("confirmLabel", { email, b: strong })}
          </label>
          <input
            id="delete-confirm"
            name="delete-confirm"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={email}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-destructive/50"
          />

          {error && (
            <p role="alert" className="mt-3 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors">
                {tCommon("cancel")}
              </button>
            </Dialog.Close>
            <button
              onClick={handleDelete}
              disabled={!armed || isPending || succeeded}
              className="rounded-md bg-destructive-fill px-4 py-2 text-sm font-medium text-white hover:bg-[#D63F46] active:bg-[#AE2C33] disabled:opacity-40 disabled:hover:bg-destructive-fill transition-colors"
            >
              {isPending || succeeded ? t("deleting") : t("confirm")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
