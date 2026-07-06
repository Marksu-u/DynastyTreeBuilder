// components/canvas/AddRelativePanel.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { UserPlus, Link2, X } from 'lucide-react';
import type { CharacterNodeType } from '@/store/canvas';
import type { CharacterData } from '@/types/canvas';
import type { RelativeKind, AddRelativeInput } from '@/lib/relative-ops';

const KIND_LABEL: Record<RelativeKind, string> = {
  partner: 'partner', child: 'child', parent: 'parent',
};

interface Props {
  anchor: CharacterNodeType;
  kind: RelativeKind;
  characters: CharacterNodeType[];                     // all non-ghost characters on the canvas
  unions: { unionId: string; partnerIds: string[] }[]; // anchor's partner-unions (for child kind)
  onSubmit: (input: AddRelativeInput) => void;
  onClose: () => void;
}

const blank = (name: string): CharacterData => ({
  name, flags: [], style: 'OTHER', gender: 'UNKNOWN',
});

export function AddRelativePanel({ anchor, kind, characters, unions, onSubmit, onClose }: Props) {
  const [tab, setTab] = useState<'new' | 'existing'>('new');
  const [name, setName] = useState('');
  const [adopted, setAdopted] = useState(false);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unionId, setUnionId] = useState<string | undefined>(
    kind === 'child' && unions.length === 1 ? unions[0].unionId : undefined,
  );
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { nameRef.current?.focus(); }, [tab]);

  const needsUnionChoice = kind === 'child' && unions.length > 1;
  const nameById = useMemo(
    () => new Map(characters.map(c => [c.id, c.data.name])),
    [characters],
  );

  const candidates = useMemo(
    () => characters.filter(c =>
      c.id !== anchor.id &&
      !c.data.isGhost &&
      c.data.name.toLowerCase().includes(search.toLowerCase()),
    ),
    [characters, anchor.id, search],
  );

  function submit(person: AddRelativeInput['person']) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onSubmit({ anchorId: anchor.id, kind, person, adopted: adopted || undefined, unionId });
  }

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-zinc-950/60" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-sm font-semibold text-zinc-100">
              Add {KIND_LABEL[kind]} for {anchor.data.name}
            </Dialog.Title>
            <Dialog.Close className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300">
              <X size={14} />
            </Dialog.Close>
          </div>

          {needsUnionChoice && (
            <div className="mb-3">
              <p className="mb-1 text-xs text-zinc-400">With which partner?</p>
              <div className="flex flex-col gap-1">
                {unions.map(u => (
                  <button
                    key={u.unionId}
                    onClick={() => setUnionId(u.unionId)}
                    className={[
                      'rounded border px-2 py-1.5 text-left text-sm',
                      unionId === u.unionId
                        ? 'border-zinc-400 bg-zinc-800 text-zinc-100'
                        : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800',
                    ].join(' ')}
                  >
                    {u.partnerIds.length > 0
                      ? `With ${u.partnerIds.map(id => nameById.get(id) ?? 'Unknown').join(' & ')}`
                      : `${anchor.data.name} alone`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3 flex gap-1 rounded-md bg-zinc-800 p-0.5">
            <button
              onClick={() => setTab('new')}
              className={['flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs',
                tab === 'new' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'].join(' ')}
            >
              <UserPlus size={12} /> New person
            </button>
            <button
              onClick={() => setTab('existing')}
              className={['flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs',
                tab === 'existing' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'].join(' ')}
            >
              <Link2 size={12} /> Link existing
            </button>
          </div>

          {tab === 'new' ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!name.trim() || (needsUnionChoice && !unionId)) return;
                submit({ newData: blank(name.trim()), newId: crypto.randomUUID() });
              }}
            >
              <input
                ref={nameRef}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name"
                className="mb-2 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
              {kind === 'child' && (
                <label className="mb-3 flex items-center gap-2 text-xs text-zinc-400">
                  <input type="checkbox" checked={adopted} onChange={e => setAdopted(e.target.checked)} />
                  Adopted
                </label>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || (needsUnionChoice && !unionId)}
                className="w-full rounded bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add {KIND_LABEL[kind]}
              </button>
            </form>
          ) : (
            <div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search characters…"
                className="mb-2 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
              <div className="max-h-48 overflow-y-auto">
                {candidates.length === 0 && (
                  <p className="px-2 py-3 text-center text-xs text-zinc-500">No matching characters</p>
                )}
                {candidates.map(c => (
                  <button
                    key={c.id}
                    disabled={isSubmitting || (needsUnionChoice && !unionId)}
                    onClick={() => submit({ existingId: c.id })}
                    className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
                  >
                    {c.data.name}
                    {c.data.alias && <span className="ml-1 text-xs italic text-zinc-500">&quot;{c.data.alias}&quot;</span>}
                  </button>
                ))}
              </div>
              {kind === 'child' && (
                <label className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                  <input type="checkbox" checked={adopted} onChange={e => setAdopted(e.target.checked)} />
                  Adopted
                </label>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
