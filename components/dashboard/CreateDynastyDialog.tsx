"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Plus, ChevronDown, X } from "lucide-react";
import { createDynasty } from "@/app/actions/dynasty";

const SETTINGS = [
  "FANTASY",
  "SCI_FI",
  "HISTORICAL",
  "MODERN",
  "HORROR",
  "OTHER",
] as const;

export function CreateDynastyDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      // createDynasty redirects on success; only returns on error
      const result = await createDynasty(null, formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white">
          <Plus className="h-4 w-4" />
          New Dynasty
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-800 bg-background p-6 shadow-xl">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-zinc-100">
              Create a Dynasty
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded p-1 text-zinc-500 hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Dynasty name
              </label>
              <input
                name="name"
                required
                maxLength={80}
                placeholder="House Malachar…"
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Setting
              </label>
              <Select.Root name="setting" defaultValue="FANTASY">
                <Select.Trigger className="flex w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500">
                  <Select.Value />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 text-zinc-500" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-50 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 shadow-xl">
                    <Select.Viewport className="p-1">
                      {SETTINGS.map((s) => (
                        <Select.Item
                          key={s}
                          value={s}
                          className="flex cursor-pointer items-center rounded px-3 py-1.5 text-sm text-zinc-200 outline-none hover:bg-zinc-800 data-[highlighted]:bg-zinc-800"
                        >
                          <Select.ItemText>
                            {s.replace("_", " ")}
                          </Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-md bg-zinc-100 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create Dynasty"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
