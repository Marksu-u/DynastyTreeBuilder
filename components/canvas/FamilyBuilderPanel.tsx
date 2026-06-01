// components/canvas/FamilyBuilderPanel.tsx
"use client";

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Trash2 } from 'lucide-react';
import type { CharacterNodeType } from '@/store/canvas';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characters: CharacterNodeType[];
  onSubmit: (params: {
    parentIds: string[];
    childIds: string[];
    adoptedIds: string[];
  }) => void;
  /** If provided, pre-selects these IDs as parents (used when right-clicking a union) */
  initialParentIds?: string[];
}

interface ChildEntry {
  id: string;          // existing character node ID
  adopted: boolean;
}

export function FamilyBuilderPanel({ open, onOpenChange, characters, onSubmit, initialParentIds = [] }: Props) {
  const [parentIds, setParentIds] = useState<string[]>(initialParentIds);
  const [children, setChildren] = useState<ChildEntry[]>([]);
  function reset() {
    setParentIds(initialParentIds);
    setChildren([]);
  }

  function handleOpen(v: boolean) {
    if (v) reset();
    onOpenChange(v);
  }

  function toggleParent(id: string) {
    setParentIds(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : prev.length < 2 ? [...prev, id] : prev
    );
  }

  function addExistingChild(id: string) {
    if (children.some(c => c.id === id)) return;
    setChildren(prev => [...prev, { id, adopted: false }]);
  }

  function removeChild(id: string) {
    setChildren(prev => prev.filter(c => c.id !== id));
  }

  function toggleAdopted(id: string) {
    setChildren(prev => prev.map(c => c.id === id ? { ...c, adopted: !c.adopted } : c));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (parentIds.length === 0) return;
    onSubmit({
      parentIds,
      childIds: children.filter(c => !c.adopted).map(c => c.id),
      adoptedIds: children.filter(c => c.adopted).map(c => c.id),
    });
    handleOpen(false);
  }

  const availableForChild = characters.filter(c => !parentIds.includes(c.id) && !children.some(ch => ch.id === c.id));

  return (
    <Dialog.Root open={open} onOpenChange={handleOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-zinc-100">Create Family Unit</Dialog.Title>
            <Dialog.Close className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
              <X size={16} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Parents */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Parents <span className="text-zinc-600">(select up to 2)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {characters.map(c => (
                  <button
                    key={c.id} type="button"
                    onClick={() => toggleParent(c.id)}
                    className={[
                      'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                      parentIds.includes(c.id)
                        ? 'border-zinc-400 bg-zinc-700 text-zinc-100'
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200',
                      !parentIds.includes(c.id) && parentIds.length >= 2 ? 'opacity-30 cursor-not-allowed' : '',
                    ].join(' ')}
                  >
                    {c.data.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Children */}
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Children</label>

              {children.length > 0 && (
                <div className="mb-2 space-y-1.5">
                  {children.map(child => {
                    const charName = characters.find(c => c.id === child.id)?.data.name ?? child.id;
                    return (
                      <div key={child.id} className="flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-1.5">
                        <span className="flex-1 text-sm text-zinc-200">{charName}</span>
                        <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox" checked={child.adopted}
                            onChange={() => toggleAdopted(child.id)}
                            className="rounded border-zinc-600 bg-zinc-700"
                          />
                          Adopted
                        </label>
                        <button type="button" onClick={() => removeChild(child.id)}
                          className="text-zinc-600 hover:text-red-400">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add existing character as child */}
              {availableForChild.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {availableForChild.map(c => (
                    <button key={c.id} type="button" onClick={() => addExistingChild(c.id)}
                      className="flex items-center gap-1 rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200">
                      <Plus size={10} /> {c.data.name}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs text-zinc-600">Create new characters with Add Character first, then add them here.</p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => handleOpen(false)}
                className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200">
                Cancel
              </button>
              <button type="submit" disabled={parentIds.length === 0}
                className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-40">
                Create Family
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
