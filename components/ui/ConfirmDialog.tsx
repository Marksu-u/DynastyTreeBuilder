"use client";

import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Label for the confirming action, e.g. "Delete" or "Replace". */
  confirmLabel: string;
  /** Styles the confirm button as destructive. */
  destructive?: boolean;
  onConfirm: () => void;
};

/**
 * Replaces window.confirm(), whose native grey box read as an abandoned app and
 * could not carry the name of the thing being destroyed.
 *
 * Built on @radix-ui/react-dialog rather than react-alert-dialog, which is not a
 * dependency of this project — Dialog already gives focus trapping, Escape to
 * dismiss and the data-state hooks the motion layer animates.
 */
export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel, destructive = false, onConfirm,
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
          <div className="flex gap-3">
            <div
              className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                destructive ? 'bg-red-500/10 text-red-400' : 'bg-accent/10 text-accent'
              }`}
            >
              <AlertTriangle size={16} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-zinc-100">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                {description}
              </Dialog.Description>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="cursor-pointer rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100">
                Cancel
              </button>
            </Dialog.Close>
            <button
              autoFocus
              onClick={() => { onOpenChange(false); onConfirm(); }}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                destructive
                  ? 'bg-red-500/90 text-white hover:bg-red-500'
                  : 'bg-zinc-100 text-zinc-900 hover:bg-white'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
