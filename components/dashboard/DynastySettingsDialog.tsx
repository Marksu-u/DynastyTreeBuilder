"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Settings, X } from "lucide-react";
import { toast } from "sonner";
import { updateDynastySettings } from "@/app/actions/dynasty";
import { CrestPicker } from "@/components/dashboard/CrestPicker";
import { resolveCrestSeed } from "@/lib/crest";

const SETTINGS = [
  { value: "FANTASY", label: "Fantasy" },
  { value: "SCI_FI", label: "Sci-Fi" },
  { value: "HISTORICAL", label: "Historical" },
  { value: "MODERN", label: "Modern" },
  { value: "HORROR", label: "Horror" },
  { value: "OTHER", label: "Other" },
] as const;

interface Props {
  dynastyId: string;
  initialName: string;
  initialSetting: string;
  initialIsPublic: boolean;
  slug: string;
  crestSeed: string | null;
  onPublicChange?: (v: boolean) => void;
}

export function DynastySettingsDialog({
  dynastyId,
  initialName,
  initialSetting,
  initialIsPublic,
  slug,
  crestSeed,
  onPublicChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [setting, setSetting] = useState(initialSetting);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isPending, startTransition] = useTransition();

  function handleOpen(value: boolean) {
    if (value) {
      setName(initialName);
      setSetting(initialSetting);
      setIsPublic(initialIsPublic);
    }
    setOpen(value);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateDynastySettings(dynastyId, {
        name,
        setting,
        isPublic,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Settings saved");
        onPublicChange?.(isPublic);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpen}>
      <Dialog.Trigger asChild>
        <button
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          aria-label="Dynasty settings"
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl focus:outline-none">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-sm font-semibold text-zinc-100">
              Dynasty Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded p-1 text-zinc-500 hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
                placeholder="Dynasty name"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Setting
              </label>
              <select
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              >
                {SETTINGS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5">
              <span className="text-sm text-zinc-300">Public</span>
              <span className="text-xs text-zinc-500 mr-auto ml-2">
                Anyone with the link can view
              </span>
              <div
                role="switch"
                aria-checked={isPublic}
                onClick={() => setIsPublic((v) => !v)}
                className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${
                  isPublic ? "bg-violet-600" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    isPublic ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
            </label>

            <div className="border-t border-zinc-800 pt-4">
              <CrestPicker
                dynastyId={dynastyId}
                currentSeed={resolveCrestSeed({ slug, crestSeed })}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleSave}
              disabled={isPending || !name.trim()}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
