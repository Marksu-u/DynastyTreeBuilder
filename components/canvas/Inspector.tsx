"use client";

import { useEffect, useMemo, useState } from 'react';
import { X, Trash2, Plus, Heart, Baby, ArrowUp, Link2, UserPlus, AlertTriangle } from 'lucide-react';
import type { CharacterData, CharacterFlag, CharacterGender } from '@/types/canvas';
import type { AnyCanvasNode, CharacterNodeType, RelationshipEdgeType } from '@/store/canvas';
import { characterLinks, type LinkedPerson } from '@/lib/character-links';
import { relativeContext, type RelativeKind, type AddRelativeInput } from '@/lib/relative-ops';
// The same caps the Server Action enforces, so the field stops you rather than
// the save failing after the fact.
import { MAX_ALIAS, MAX_CHARACTER_NAME, MAX_NOTE } from '@/lib/schemas';

const GENDERS: { value: CharacterGender; label: string }[] = [
  { value: 'UNKNOWN', label: 'None' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'NON_BINARY', label: 'Non-binary' },
];

const CHARACTER_FLAGS: { value: CharacterFlag; label: string }[] = [
  { value: 'FOUNDER', label: 'Founder' },
  { value: 'BASTARD', label: 'Bastard' },
  { value: 'ADOPTED', label: 'Adopted' },
  { value: 'EXILE', label: 'Exile' },
  { value: 'DECEASED', label: 'Deceased' },
];

const KIND_LABEL: Record<RelativeKind, string> = {
  partner: 'partner', child: 'child', parent: 'parent',
};

const EMPTY: CharacterData = {
  name: '', alias: '', flags: [], style: '', gender: 'UNKNOWN', note: '',
};

type Tab = 'details' | 'links' | 'notes';

/** Every way a character is looked at or brought into the tree. */
export type InspectorMode =
  | { kind: 'edit'; character: CharacterNodeType }
  | { kind: 'create' }
  | {
      kind: 'relative';
      anchor: CharacterNodeType;
      relative: RelativeKind;
      characters: CharacterNodeType[];
      unions: { unionId: string; partnerIds: string[] }[];
    };

/**
 * Identity of what the panel is pointed at. Two modes with the same key are the
 * same subject and can swap freely; a different key is a change of subject, and
 * that is what the unsaved-changes guard watches.
 */
export function inspectorKeyFor(mode: InspectorMode): string {
  switch (mode.kind) {
    case 'edit': return `edit:${mode.character.id}`;
    case 'create': return 'create';
    case 'relative': return `relative:${mode.anchor.id}:${mode.relative}`;
  }
}

/** What the draft is compared against to decide whether anything was typed. */
function baselineFor(mode: InspectorMode): CharacterData {
  return mode.kind === 'edit' ? { ...mode.character.data } : { ...EMPTY };
}

function initialUnionId(mode: InspectorMode): string | undefined {
  return mode.kind === 'relative'
    ? relativeContext(mode.relative, mode.unions).defaultUnionId
    : undefined;
}

function sameCharacterData(a: CharacterData, b: CharacterData): boolean {
  return (
    a.name === b.name &&
    (a.alias ?? '') === (b.alias ?? '') &&
    a.style === b.style &&
    a.gender === b.gender &&
    (a.note ?? '') === (b.note ?? '') &&
    a.flags.join() === b.flags.join()
  );
}

function subjectLabel(mode: InspectorMode): string {
  switch (mode.kind) {
    case 'edit': return mode.character.data.name || 'This character';
    case 'create': return 'This new character';
    case 'relative': return `This new ${KIND_LABEL[mode.relative]}`;
  }
}

/* Fields are --background inside a --surface-1 panel: the input is *darker*
   than the card, not lighter (design.md §10). */
const FIELD =
  'w-full rounded-md border border-zinc-700 bg-background px-2.5 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600';

/**
 * The inspector — the right slot of the workspace slot map (design.md §9).
 *
 * 292px, floating, closable, tabbed. This is the reusable half of the shell:
 * every tool in the suite puts its per-object editor here, so the geometry and
 * the chrome are fixed even though the fields are not.
 *
 * It is the *only* character surface. Editing, creating and adding a relative
 * all happen here rather than in a modal — adding a person is the most frequent
 * thing anyone does in this tool, and a dialog blacks out the canvas at exactly
 * the moment you want to see where the new person lands.
 */
export function Inspector({
  mode,
  nodes,
  edges,
  onSave,
  onCreate,
  onSubmitRelative,
  onDelete,
  onClose,
  onSelect,
  onAddRelative,
  onRestoreMode,
}: {
  mode: InspectorMode;
  nodes: AnyCanvasNode[];
  edges: RelationshipEdgeType[];
  /** edit */
  onSave?: (data: CharacterData) => void;
  /** create */
  onCreate?: (data: CharacterData) => void;
  /** relative */
  onSubmitRelative?: (input: AddRelativeInput) => void;
  /** edit */
  onDelete?: () => void;
  onClose: () => void;
  /** Open another character in the panel — the Links tab is navigable. */
  onSelect: (id: string) => void;
  onAddRelative?: (anchorId: string, kind: RelativeKind) => void;
  /**
   * The user chose to keep an unsaved draft rather than follow the canvas.
   * The parent has already moved on, so it needs putting back — otherwise its
   * idea of what is selected and the panel's disagree.
   */
  onRestoreMode?: (mode: InspectorMode) => void;
}) {
  /**
   * `active` is what the panel is *showing*; `mode` is what the canvas is
   * *asking* for. They diverge only while a confirmation is up. The panel is
   * deliberately not remounted by key on mode change — the draft has to outlive
   * the request long enough to ask about it.
   */
  const [active, setActive] = useState<InspectorMode>(mode);
  const [pendingMode, setPendingMode] = useState<InspectorMode | null>(null);
  const [form, setForm] = useState<CharacterData>(() => baselineFor(mode));
  const [tab, setTab] = useState<Tab>('details');
  const [unionId, setUnionId] = useState<string | undefined>(() => initialUnionId(mode));
  const [linking, setLinking] = useState(false);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = active.kind === 'edit';
  const ctx = active.kind === 'relative' ? relativeContext(active.relative, active.unions) : null;
  const dirty = !sameCharacterData(form, baselineFor(active));

  function adopt(next: InspectorMode) {
    setActive(next);
    setForm(baselineFor(next));
    setUnionId(initialUnionId(next));
    setPendingMode(null);
    setTab('details');
    setLinking(false);
    setSearch('');
    setSubmitting(false);
  }

  // Reconcile during render rather than in an effect — this is derived state,
  // and an effect would paint one frame of the wrong subject first.
  const requestedKey = inspectorKeyFor(mode);
  if (requestedKey !== inspectorKeyFor(active)) {
    if (!dirty) {
      adopt(mode);
    } else if (!pendingMode || inspectorKeyFor(pendingMode) !== requestedKey) {
      // Something is unsaved: keep showing it and ask. A second click elsewhere
      // while the question is up just re-points the question.
      setPendingMode(mode);
    }
  } else if (mode !== active) {
    // Same subject, fresher node data — e.g. the save we just made landed.
    // Adopting the new object re-baselines the draft so it reads as clean.
    setActive(mode);
  }

  // Tells the toaster to sit clear of this panel — see the [data-inspector]
  // rule in globals.css. An attribute on the document rather than lifted state,
  // because the <Toaster> lives in the root layout, far from this component.
  useEffect(() => {
    document.documentElement.dataset.inspector = 'open';
    return () => { delete document.documentElement.dataset.inspector; };
  }, []);

  const links = useMemo(
    () => (isEdit ? characterLinks(nodes, edges, active.character.id) : null),
    [isEdit, nodes, edges, active],
  );

  const nameById = useMemo(
    () => new Map(active.kind === 'relative' ? active.characters.map(c => [c.id, c.data.name]) : []),
    [active],
  );

  const candidates = useMemo(() => {
    if (active.kind !== 'relative') return [];
    return active.characters.filter(c =>
      c.id !== active.anchor.id &&
      !c.data.isGhost &&
      c.data.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [active, search]);

  const contextIncomplete = !!ctx?.showUnionChoice && !unionId;
  const canSubmit = !!form.name.trim() && !contextIncomplete && !submitting && dirty;

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

  function submitRelative(person: AddRelativeInput['person']) {
    if (active.kind !== 'relative' || submitting) return;
    setSubmitting(true);
    // Blank the draft before handing off. The parent clears relPicker, which
    // re-points `mode` at the anchor — and a draft still holding what we just
    // committed would read as unsaved and pop the guard on the way out.
    setForm({ ...EMPTY });
    onSubmitRelative?.({
      anchorId: active.anchor.id,
      kind: active.relative,
      person,
      adopted: form.flags.includes('ADOPTED') || undefined,
      unionId,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    if (active.kind === 'relative') {
      submitRelative({ newData: cleaned(), newId: crypto.randomUUID() });
      return;
    }
    if (active.kind === 'create') {
      const data = cleaned();
      setForm({ ...EMPTY });   // same reason as submitRelative
      onCreate?.(data);
      return;
    }
    // Edit: the parent writes the node, `mode` arrives carrying the new data,
    // and re-baselining against it is what flips the button back to "Saved".
    onSave?.(cleaned());
  }

  function keepEditing() {
    const restore = active;
    setPendingMode(null);
    onRestoreMode?.(restore);
  }

  const title =
    active.kind === 'edit' ? (active.character.data.name || 'Unnamed')
      : active.kind === 'create' ? 'New character'
        : `Add ${KIND_LABEL[active.relative]}`;

  const subtitle = active.kind === 'relative' ? `for ${active.anchor.data.name}` : null;

  const tabs: Tab[] = isEdit ? ['details', 'links', 'notes'] : ['details', 'notes'];

  return (
    <aside
      aria-label={`Inspector — ${title}`}
      className="absolute bottom-4 right-4 top-[74px] z-20 flex w-[292px] flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/97 shadow-2xl backdrop-blur-sm"
    >
      {/* The unsaved-changes guard. Inside the panel, not a modal over the
          canvas: the question is about this panel, and the canvas behind it is
          exactly what the user was reaching for when they triggered it.
          Semantics are a rule and an icon here, never a fill (design.md §4). */}
      {pendingMode && (
        <div
          role="alertdialog"
          aria-label="Unsaved changes"
          className="absolute inset-0 z-10 flex flex-col justify-center gap-4 border-l-2 border-l-warning bg-zinc-900/98 p-5 backdrop-blur-sm"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" />
            <div>
              <p className="text-[13px] font-medium text-zinc-100">Unsaved changes</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-400">
                {subjectLabel(active)} has changes you haven&apos;t saved. Opening{' '}
                {pendingMode.kind === 'edit'
                  ? (pendingMode.character.data.name || 'another character')
                  : pendingMode.kind === 'create'
                    ? 'a new character'
                    : `a new ${KIND_LABEL[pendingMode.relative]}`}{' '}
                will discard them.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              autoFocus
              onClick={keepEditing}
              className="cursor-pointer rounded-md bg-zinc-100 py-2 text-[13px] font-medium text-zinc-900 transition-colors hover:bg-white"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={() => adopt(pendingMode)}
              className="cursor-pointer rounded-md border border-destructive/50 py-2 text-[13px] font-medium text-destructive transition-colors hover:border-destructive"
            >
              Discard and continue
            </button>
          </div>
        </div>
      )}

      <header className="flex shrink-0 items-start justify-between gap-2 border-b border-zinc-800 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-zinc-100">{title}</p>
          {subtitle && (
            <p className="truncate text-[11px] text-zinc-500">{subtitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close inspector"
          className="mt-0.5 shrink-0 cursor-pointer rounded p-0.5 text-zinc-500 transition-colors hover:text-zinc-200"
        >
          <X size={14} />
        </button>
      </header>

      {/* Relative mode's one real branch: a new person, or someone already on
          the canvas. A segmented control rather than the modal's footer link —
          it is a choice about what you are doing, so it belongs at the top. */}
      {active.kind === 'relative' && (
        <div className="shrink-0 border-b border-zinc-800 px-4 py-2.5">
          <div className="flex overflow-hidden rounded-md border border-zinc-700">
            <SegBtn active={!linking} onClick={() => setLinking(false)}>
              <UserPlus size={11} /> New person
            </SegBtn>
            <SegBtn active={linking} onClick={() => setLinking(true)} divider>
              <Link2 size={11} /> Existing
            </SegBtn>
          </div>
        </div>
      )}

      {!linking && (
        <nav className="flex shrink-0 gap-4 border-b border-zinc-800 px-4">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-current={tab === t}
              /* The active tab is one of the four allowed accent uses — the
                 active state of a tab (design.md §3). */
              className={`cursor-pointer border-b-[1.5px] py-2.5 text-xs capitalize transition-colors ${
                tab === t
                  ? 'border-accent font-medium text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      )}

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          {linking && active.kind === 'relative' ? (
            <>
              {ctx?.showUnionChoice && (
                <UnionChoice
                  unions={active.unions}
                  anchorName={active.anchor.data.name}
                  nameById={nameById}
                  value={unionId}
                  onChange={setUnionId}
                />
              )}
              <Field label="Search">
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search characters…"
                  className={FIELD}
                />
              </Field>
              {candidates.length === 0 ? (
                <p className="py-2 text-center text-[11px] text-zinc-600">
                  No matching characters
                </p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {candidates.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        disabled={submitting || contextIncomplete}
                        onClick={() => submitRelative({ existingId: c.id })}
                        className="w-full cursor-pointer truncate rounded px-1.5 py-1 text-left text-[13px] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40"
                      >
                        {c.data.name}
                        {c.data.alias && (
                          <span className="ml-1 text-[11px] italic text-zinc-500">
                            &quot;{c.data.alias}&quot;
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : tab === 'details' ? (
            <>
              <Field label={isEdit ? 'Name' : 'Name *'}>
                <input
                  autoFocus={!isEdit}
                  required
                  maxLength={MAX_CHARACTER_NAME}
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Aegon Targaryen"
                  className={FIELD}
                />
              </Field>

              <Field label="Alias">
                <input
                  maxLength={MAX_ALIAS}
                  value={form.alias ?? ''}
                  onChange={(e) => set('alias', e.target.value)}
                  placeholder='"The Heir"'
                  className={FIELD}
                />
              </Field>

              <div className="flex gap-2.5">
                <Field label="Role" className="min-w-0 flex-1">
                  <input
                    value={form.style}
                    onChange={(e) => set('style', e.target.value)}
                    placeholder="Heir"
                    className={FIELD}
                  />
                </Field>
                <Field label="Gender" className="min-w-0 flex-1">
                  <select
                    value={form.gender}
                    onChange={(e) => set('gender', e.target.value as CharacterGender)}
                    className={FIELD}
                  >
                    {GENDERS.map((g) => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Flags">
                <div className="flex flex-wrap gap-1.5">
                  {CHARACTER_FLAGS.map(({ value, label }) => {
                    const on = form.flags.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleFlag(value)}
                        aria-pressed={on}
                        className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                          on
                            ? 'border-accent text-accent'
                            : 'border-zinc-600 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {ctx?.showUnionChoice && active.kind === 'relative' && (
                <UnionChoice
                  unions={active.unions}
                  anchorName={active.anchor.data.name}
                  nameById={nameById}
                  value={unionId}
                  onChange={setUnionId}
                />
              )}
            </>
          ) : tab === 'links' && links ? (
            <>
              <LinkGroup
                icon={<Heart size={11} />}
                label="Partners"
                addLabel="Add partner"
                people={links.partners}
                onSelect={onSelect}
                onAdd={onAddRelative && isEdit
                  ? () => onAddRelative(active.character.id, 'partner') : undefined}
              />
              <LinkGroup
                icon={<ArrowUp size={11} />}
                label="Parents"
                addLabel="Add parent"
                people={links.parents}
                onSelect={onSelect}
                onAdd={onAddRelative && isEdit
                  ? () => onAddRelative(active.character.id, 'parent') : undefined}
              />
              <LinkGroup
                icon={<Baby size={11} />}
                label="Children"
                addLabel="Add child"
                people={links.children}
                onSelect={onSelect}
                onAdd={onAddRelative && isEdit
                  ? () => onAddRelative(active.character.id, 'child') : undefined}
              />
            </>
          ) : (
            <Field label="Plot hook">
              <textarea
                maxLength={MAX_NOTE}
                value={form.note ?? ''}
                onChange={(e) => set('note', e.target.value)}
                placeholder="Why this person matters at the table."
                rows={8}
                className={`${FIELD} resize-none leading-relaxed`}
              />
            </Field>
          )}
        </div>

        {!linking && (
          <footer className="flex shrink-0 items-center gap-2 border-t border-zinc-800 p-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 cursor-pointer rounded-md bg-zinc-100 py-2 text-[13px] font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isEdit ? (dirty ? 'Save' : 'Saved') : 'Add'}
            </button>
            {/* Destructive is never red at rest (design.md §4) — it earns its
                colour on hover, same as DynastyCard's trash. */}
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label={`Delete ${active.character.data.name}`}
                className="cursor-pointer rounded-md p-2 text-zinc-600 transition-colors hover:text-destructive"
              >
                <Trash2 size={15} />
              </button>
            )}
          </footer>
        )}
      </form>
    </aside>
  );
}

function SegBtn({
  active, onClick, divider = false, children,
}: {
  active: boolean; onClick: () => void; divider?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-1.5 text-[11px] transition-colors ${
        divider ? 'border-l border-zinc-700' : ''
      } ${active ? 'bg-zinc-800 font-medium text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      {children}
    </button>
  );
}

function UnionChoice({
  unions, anchorName, nameById, value, onChange,
}: {
  unions: { unionId: string; partnerIds: string[] }[];
  anchorName: string;
  nameById: Map<string, string>;
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  return (
    <Field label="With which partner?">
      <div className="flex flex-col gap-1">
        {unions.map((u) => (
          <button
            key={u.unionId}
            type="button"
            onClick={() => onChange(u.unionId)}
            aria-pressed={value === u.unionId}
            className={`cursor-pointer rounded border px-2 py-1.5 text-left text-[12px] transition-colors ${
              value === u.unionId
                ? 'border-zinc-400 bg-zinc-800 text-zinc-100'
                : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            {u.partnerIds.length > 0
              ? `With ${u.partnerIds.map((id) => nameById.get(id) ?? 'Unknown').join(' & ')}`
              : `${anchorName} alone`}
          </button>
        ))}
      </div>
    </Field>
  );
}

function Field({
  label, className = '', children,
}: {
  label: string; className?: string; children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[11px] font-medium text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function LinkGroup({
  icon, label, addLabel, people, onSelect, onAdd,
}: {
  icon: React.ReactNode;
  label: string;
  /** Spelled out rather than derived from `label` — "Children" does not
   *  singularise by dropping a letter. */
  addLabel: string;
  people: LinkedPerson[];
  onSelect: (id: string) => void;
  onAdd?: () => void;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">
          {icon}
          {label}
        </span>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            aria-label={addLabel}
            className="cursor-pointer rounded p-0.5 text-zinc-600 transition-colors hover:text-zinc-300"
          >
            <Plus size={13} />
          </button>
        )}
      </div>

      {people.length === 0 ? (
        <p className="text-[11px] text-zinc-600">None</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {people.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                disabled={p.isGhost}
                onClick={() => onSelect(p.id)}
                className="flex w-full cursor-pointer items-center justify-between gap-2 rounded px-1.5 py-1 text-left text-[13px] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-default disabled:text-zinc-600 disabled:hover:bg-transparent"
              >
                <span className={`truncate ${p.isGhost ? 'italic' : ''}`}>
                  {p.isGhost ? 'Unknown' : p.name}
                </span>
                {p.adopted && (
                  <span className="shrink-0 text-[10px] text-success">Adopted</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
