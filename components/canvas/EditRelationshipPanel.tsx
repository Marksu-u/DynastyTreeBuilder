"use client";

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { RelationshipData, RelationshipType } from '@/types/canvas';
import type { RelationshipEdgeType } from '@/store/canvas';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edge?: RelationshipEdgeType;
  onSubmit: (data: Partial<RelationshipData>) => void;
  onDelete?: () => void;
  isLoggedIn?: boolean;
}

const TYPES: { value: RelationshipType; label: string; description: string }[] = [
  { value: 'PARTNER',       label: 'Partner',       description: 'Married or partnered' },
  { value: 'CHILD',         label: 'Parent / Child', description: 'Direct parent-child line' },
  { value: 'ADOPTED_CHILD', label: 'Adopted',        description: 'Brought in by choice' },
];

const EMPTY: RelationshipData = { type: 'PARTNER', isMutual: false };

const INPUT =
  'w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500';

export function EditRelationshipPanel({ open, onOpenChange, edge, onSubmit, onDelete }: Props) {
  const [form, setForm] = useState<RelationshipData>(EMPTY);

  useEffect(() => {
    if (open) setForm(edge?.data ? { type: edge.data.type, hook: edge.data.hook, isMutual: edge.data.isMutual } : EMPTY);
  }, [open, edge]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
    onOpenChange(false);
  }

  const set = <K extends keyof RelationshipData>(key: K, value: RelationshipData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-zinc-100">
              Edit Relationship
            </Dialog.Title>
            <Dialog.Close className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
              <X size={16} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Type</label>
              <div className="grid grid-cols-3 gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set('type', t.value)}
                    title={t.description}
                    className={[
                      'rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                      form.type === t.value
                        ? 'border-zinc-400 bg-zinc-700 text-zinc-100'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300',
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Story Hook</label>
              <textarea
                value={form.hook ?? ''}
                onChange={(e) => set('hook', e.target.value || undefined)}
                placeholder="Optional narrative note for this relationship..."
                rows={2}
                className={INPUT + ' resize-none'}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.isMutual}
                onChange={(e) => set('isMutual', e.target.checked)}
                className="rounded border-zinc-600 bg-zinc-800"
              />
              Mutual relationship
            </label>

            <div className="flex gap-2 pt-1">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => { onDelete(); onOpenChange(false); }}
                  className="rounded-md border border-red-700/50 px-3 py-2 text-sm text-red-400 transition-colors hover:border-red-600 hover:bg-red-900/20"
                >
                  Remove
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
              >
                Save
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
