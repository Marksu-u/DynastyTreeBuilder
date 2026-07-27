"use client";

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import type { CharacterData, CharacterFlag, CharacterGender } from '@/types/canvas';
import type { CharacterNodeType } from '@/store/canvas';
import { useCatalog } from './CatalogProvider';

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  character?: CharacterNodeType;
  onSubmit: (data: CharacterData) => void;
  onDelete?: () => void;
  isLoggedIn?: boolean;
}

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

export function AddCharacterPanel({ open, onOpenChange, character, onSubmit, onDelete }: Props) {
  const [form, setForm] = useState<CharacterData>(EMPTY);
  const [showDetails, setShowDetails] = useState(false);
  const { getMerged } = useCatalog();
  const roleSuggestions = getMerged('CHARACTER_STYLE');
  const isEdit = !!character;

  useEffect(() => {
    if (!open) return;
    const initial = character ? { ...character.data } : EMPTY;
    setForm(initial);
    // Expand the optional section only when there's already something in it.
    setShowDetails(hasDetails(initial));
  }, [open, character]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      ...form,
      name: form.name.trim(),
      alias: form.alias?.trim() || null,
      style: form.style?.trim() || '',
      note: form.note?.trim() || null,
    });
    onOpenChange(false);
  }

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

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-zinc-100">
              {isEdit ? 'Edit Character' : 'Add Character'}
            </Dialog.Title>
            <Dialog.Close className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200">
              <X size={16} />
            </Dialog.Close>
          </div>

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
                list="role-suggestions"
                value={form.style}
                onChange={(e) => set('style', e.target.value)}
                placeholder="Type anything — e.g. Queen, Court Wizard, Heir…"
                className={INPUT}
              />
              <datalist id="role-suggestions">
                {roleSuggestions.map((o) => (
                  <option key={o.value} value={o.label} />
                ))}
              </datalist>
            </div>

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
              {isEdit && onDelete && (
                <button
                  type="button"
                  onClick={() => { onDelete(); onOpenChange(false); }}
                  className="rounded-md border border-red-700/50 px-3 py-2 text-sm text-red-400 transition-colors hover:border-red-600 hover:bg-red-900/20"
                >
                  Delete
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
                {isEdit ? 'Save' : 'Add'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
