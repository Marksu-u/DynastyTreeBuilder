"use client";

import { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronDown, ChevronRight, Link2, UserPlus } from 'lucide-react';
import type { CharacterData, CharacterFlag, CharacterGender } from '@/types/canvas';
import type { CharacterNodeType } from '@/store/canvas';
import { relativeContext, type RelativeKind, type AddRelativeInput } from '@/lib/relative-ops';

const GENDERS: { value: CharacterGender; label: string }[] = [
  { value: 'UNKNOWN',    label: 'None / unspecified' },
  { value: 'MALE',       label: 'Male' },
  { value: 'FEMALE',     label: 'Female' },
  { value: 'NON_BINARY', label: 'Non-binary' },
];

const CHARACTER_FLAGS: { value: CharacterFlag; label: string }[] = [
  { value: 'FOUNDER',  label: 'Founder' },
  { value: 'BASTARD',  label: 'Bastard' },
  { value: 'ADOPTED',  label: 'Adopted' },
  { value: 'EXILE',    label: 'Exile' },
  { value: 'DECEASED', label: 'Deceased' },
];

const KIND_LABEL: Record<RelativeKind, string> = {
  partner: 'partner', child: 'child', parent: 'parent',
};

const EMPTY: CharacterData = {
  name: '', alias: '', flags: [], style: '',
  gender: 'UNKNOWN', note: '',
};

const INPUT =
  'w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500';

/** A character has "details" worth expanding if any optional field is set. */
function hasDetails(d: CharacterData): boolean {
  return Boolean(d.alias?.trim()) || (d.gender && d.gender !== 'UNKNOWN') ||
    (d.flags?.length ?? 0) > 0 || Boolean(d.note?.trim());
}

export type CharacterDialogMode =
  | { kind: 'create' }
  | { kind: 'edit'; character: CharacterNodeType }
  | {
      kind: 'relative';
      anchor: CharacterNodeType;
      relative: RelativeKind;
      characters: CharacterNodeType[];
      unions: { unionId: string; partnerIds: string[] }[];
    };

interface Props {
  mode: CharacterDialogMode;
  /** Radix wants to close — Esc, overlay click, the X, or Cancel. */
  onClose: () => void;
  /** create + edit */
  onSubmitCharacter?: (data: CharacterData) => void;
  /** relative */
  onSubmitRelative?: (input: AddRelativeInput) => void;
  /** edit only */
  onDelete?: () => void;
}

/**
 * One dialog for every way a character enters the tree. Adding a relative used
 * to be a name-only form, which forced a six-step add → click → + → name →
 * click → edit loop for anything richer. The full form is now the default body
 * in every mode; relationship questions appear below the role only when the
 * anchor and kind actually raise them.
 */
export function CharacterDialog({
  mode, onClose, onSubmitCharacter, onSubmitRelative, onDelete,
}: Props) {
  const ctx = mode.kind === 'relative'
    ? relativeContext(mode.relative, mode.unions)
    : null;

  // Mounting IS the reset: every call site renders this only while it should be
  // open, so a fresh open gets fresh state from these initialisers. The
  // alternative — a useEffect that setStates on `open` — is what the old panels
  // did, and it trips react-hooks/set-state-in-effect for no benefit.
  const [form, setForm] = useState<CharacterData>(
    () => (mode.kind === 'edit' ? { ...mode.character.data } : EMPTY),
  );
  const [showDetails, setShowDetails] = useState(
    () => (mode.kind === 'edit' ? hasDetails(mode.character.data) : false),
  );
  const [linking, setLinking] = useState(false);
  const [search, setSearch] = useState('');
  const [adopted, setAdopted] = useState(false);
  const [unionId, setUnionId] = useState<string | undefined>(() => ctx?.defaultUnionId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameById = useMemo(
    () => new Map(
      mode.kind === 'relative' ? mode.characters.map(c => [c.id, c.data.name]) : [],
    ),
    [mode],
  );

  const candidates = useMemo(() => {
    if (mode.kind !== 'relative') return [];
    return mode.characters.filter(c =>
      c.id !== mode.anchor.id &&
      !c.data.isGhost &&
      c.data.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [mode, search]);

  const set = <K extends keyof CharacterData>(key: K, value: CharacterData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function toggleFlag(flag: CharacterFlag) {
    setForm((f) => ({
      ...f,
      flags: f.flags.includes(flag)
        ? f.flags.filter((x) => x !== flag)
        : [...f.flags, flag],
    }));
  }

  function cleaned(): CharacterData {
    return {
      ...form,
      name: form.name.trim(),
      alias: form.alias?.trim() || null,
      style: form.style?.trim() || '',
      note: form.note?.trim() || null,
    };
  }

  const contextIncomplete = !!ctx?.showUnionChoice && !unionId;

  function submitRelative(person: AddRelativeInput['person']) {
    if (mode.kind !== 'relative' || isSubmitting) return;
    setIsSubmitting(true);
    onSubmitRelative?.({
      anchorId: mode.anchor.id,
      kind: mode.relative,
      person,
      adopted: adopted || undefined,
      unionId,
    });
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || contextIncomplete) return;
    if (mode.kind === 'relative') {
      submitRelative({ newData: cleaned(), newId: crypto.randomUUID() });
      return;
    }
    onSubmitCharacter?.(cleaned());
    onClose();
  }

  const title =
    mode.kind === 'edit' ? 'Edit Character'
    : mode.kind === 'relative' ? `Add ${KIND_LABEL[mode.relative]} for ${mode.anchor.data.name}`
    : 'Add Character';

  const contextBlock = ctx && (
    <>
      {ctx.showUnionChoice && mode.kind === 'relative' && (
        <div>
          <p className="mb-1.5 block text-xs font-medium text-zinc-400">With which partner?</p>
          <div className="flex flex-col gap-1">
            {mode.unions.map(u => (
              <button
                key={u.unionId}
                type="button"
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
                  : `${mode.anchor.data.name} alone`}
              </button>
            ))}
          </div>
        </div>
      )}

      {ctx.showAdopted && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={adopted}
            onChange={e => setAdopted(e.target.checked)}
            className="rounded border-zinc-600 bg-zinc-800 accent-zinc-400"
          />
          Adopted
        </label>
      )}
    </>
  );

  return (
    <Dialog.Root open onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-zinc-100">
              {title}
            </Dialog.Title>
            <Dialog.Close className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
              <X size={16} />
            </Dialog.Close>
          </div>

          {linking && mode.kind === 'relative' ? (
            <div className="space-y-4">
              {contextBlock}

              <div>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search characters…"
                  className={INPUT}
                  autoFocus
                />
                <div className="mt-2 max-h-48 overflow-y-auto">
                  {candidates.length === 0 && (
                    <p className="px-2 py-3 text-center text-xs text-zinc-500">No matching characters</p>
                  )}
                  {candidates.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={isSubmitting || contextIncomplete}
                      onClick={() => submitRelative({ existingId: c.id })}
                      className="flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
                    >
                      {c.data.name}
                      {c.data.alias && <span className="ml-1 text-xs italic text-zinc-500">&quot;{c.data.alias}&quot;</span>}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLinking(false)}
                className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                <UserPlus size={12} />
                or create a new person →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Name *</label>
                <input
                  type="text" required autoFocus
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Aegon (the Conqueror) Targaryen"
                  className={INPUT}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Role</label>
                <input
                  type="text"
                  value={form.style}
                  onChange={(e) => set('style', e.target.value)}
                  placeholder="Type anything — e.g. Queen, Court Wizard, Heir…"
                  className={INPUT}
                />
              </div>

              {contextBlock}

              <div className="border-t border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDetails((s) => !s)}
                  className="flex items-center gap-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  {showDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  More details (all optional)
                </button>
              </div>

              {showDetails && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-400">Alias / Epithet</label>
                    <input
                      type="text"
                      value={form.alias ?? ''}
                      onChange={(e) => set('alias', e.target.value)}
                      placeholder='"The Ruthless"'
                      className={INPUT}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-400">Card symbol</label>
                    <select
                      value={form.gender}
                      onChange={(e) => set('gender', e.target.value as CharacterGender)}
                      className={INPUT}
                    >
                      {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-zinc-400">Traits</label>
                    <div className="flex flex-wrap gap-2">
                      {CHARACTER_FLAGS.map(({ value, label }) => (
                        <label key={value} className="flex cursor-pointer items-center gap-1.5 text-sm text-zinc-300">
                          <input
                            type="checkbox"
                            checked={form.flags.includes(value)}
                            onChange={() => toggleFlag(value)}
                            className="rounded border-zinc-600 bg-zinc-800 accent-zinc-400"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-400">Notes</label>
                    <textarea
                      value={form.note ?? ''}
                      onChange={(e) => set('note', e.target.value)}
                      placeholder="Optional backstory or notes..."
                      rows={2}
                      className={INPUT + ' resize-none'}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {mode.kind === 'edit' && onDelete && (
                  <button
                    type="button"
                    onClick={() => { onDelete(); onClose(); }}
                    className="rounded-md border border-red-700/50 px-3 py-2 text-sm text-red-400 transition-colors hover:border-red-600 hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !form.name.trim() || contextIncomplete}
                  className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {mode.kind === 'edit' ? 'Save' : 'Add'}
                </button>
              </div>

              {mode.kind === 'relative' && (
                <button
                  type="button"
                  onClick={() => setLinking(true)}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  <Link2 size={12} />
                  or link someone already on the canvas →
                </button>
              )}
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
