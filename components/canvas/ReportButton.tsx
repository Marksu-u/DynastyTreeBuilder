"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { Flag, ChevronDown, Check, X } from "lucide-react";
import { toast } from "sonner";
import { createReport } from "@/app/actions/report";

const REASONS = [
  { value: "ILLEGAL_CONTENT", label: "Illegal content" },
  { value: "HATE_SPEECH", label: "Hate speech" },
  { value: "SPAM", label: "Spam" },
  { value: "OTHER", label: "Other" },
] as const;

type Reason = (typeof REASONS)[number]["value"];

type Props = {
  shareSlug: string;
};

export function ReportButton({ shareSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | "">("");
  const [details, setDetails] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;

    setPending(true);
    const result = await createReport(shareSlug, reason, details || undefined);
    setPending(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success("Report submitted — thank you.");
    setOpen(false);
    setReason("");
    setDetails("");
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="text-zinc-500 transition-colors hover:text-red-400"
          title="Report this content"
          aria-label="Report this content"
        >
          <Flag className="h-3.5 w-3.5" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-sm font-semibold text-zinc-100">
              Report this content
            </Dialog.Title>
            <Dialog.Close className="text-zinc-500 hover:text-zinc-300" aria-label="Close">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Reason
              </label>
              <Select.Root
                value={reason}
                onValueChange={(v) => setReason(v as Reason)}
              >
                <Select.Trigger className="flex w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500">
                  <Select.Value placeholder="Select a reason…" />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="z-[60] overflow-hidden rounded-md border border-zinc-700 bg-zinc-800 shadow-xl">
                    <Select.Viewport className="p-1">
                      {REASONS.map((r) => (
                        <Select.Item
                          key={r.value}
                          value={r.value}
                          className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm text-zinc-100 outline-none hover:bg-zinc-700 data-[highlighted]:bg-zinc-700"
                        >
                          <Select.ItemText>{r.label}</Select.ItemText>
                          <Select.ItemIndicator className="ml-auto">
                            <Check className="h-3.5 w-3.5 text-zinc-400" />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">
                Additional details{" "}
                <span className="text-zinc-600">(optional, max 500 characters)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Describe the issue…"
                className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <p className="text-right text-xs text-zinc-600">
                {details.length}/500
              </p>
            </div>

            <div className="flex gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!reason || pending}
                className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
