"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslations } from "next-intl";
import {
  ReactFlow,
  Background, BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import { toast } from 'sonner';
import { triggerJsonDownload, exportCanvasToPng } from '@/lib/export';
import { useCanvasStore } from '@/store/canvas';
import type { AnyCanvasNode, CharacterNodeType } from '@/store/canvas';
import { CharacterNode } from '@/components/canvas/CharacterNode';
import { UnionNode } from '@/components/canvas/UnionNode';
import { RelationshipEdge } from '@/components/canvas/RelationshipEdge';
import { Toolbar } from '@/components/canvas/Toolbar';
import { AddRelativeHint } from '@/components/canvas/AddRelativeHint';
import { GenerationBands } from '@/components/canvas/GenerationBands';
import { CanvasContext } from '@/components/canvas/CanvasContext';
import { CanvasEmptyState } from '@/components/canvas/CanvasEmptyState';
import { ExampleDynastyNotice } from '@/components/canvas/ExampleDynastyNotice';
import { useGenealogyLayout } from '@/components/canvas/useGenealogyLayout';
import { HighlightContext } from '@/components/canvas/HighlightContext';
import { useBloodlineHighlight } from '@/components/canvas/useBloodlineHighlight';
import { partnerUnionsOf, type AddRelativeInput, type RelativeKind } from '@/lib/relative-ops';
import { parseImportFile, buildCanvasFromExport, buildGuestExport } from '@/lib/import-canvas';
import {
  EXAMPLE_HOUSE_NAME, EXAMPLE_CREST_SEED, buildSeedCanvas, hasSeedBeenDecided,
  markSeedDecided, isShowingExample, setShowingExample,
} from '@/lib/seed-canvas';
import { useFitTree } from '@/components/canvas/useFitTree';
import { useCanvasSettled } from '@/components/canvas/useCanvasSettled';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CanvasLegend } from '@/components/canvas/CanvasLegend';
import { ZoomControls } from '@/components/canvas/ZoomControls';
import { Inspector, type InspectorMode } from '@/components/canvas/Inspector';
import { IdentityChip } from '@/components/canvas/IdentityChip';
import { AccountChip } from '@/components/canvas/AccountChip';
import { DynastySettingsDialog, type HouseSettings } from '@/components/dashboard/DynastySettingsDialog';
import { useGuestHouse, useGuestDynastyStore } from '@/store/guest-dynasty';
import type { CharacterData } from '@/types/canvas';

const nodeTypes = { character: CharacterNode, union: UnionNode } as const;
const edgeTypes = { relationship: RelationshipEdge } as const;

function TreeCanvasInner() {
  const t = useTranslations('canvas');
  const nodes = useCanvasStore(s => s.nodes);
  const edges = useCanvasStore(s => s.edges);
  const onNodesChange = useCanvasStore(s => s.onNodesChange);
  const onEdgesChange = useCanvasStore(s => s.onEdgesChange);
  const addCharacter = useCanvasStore(s => s.addCharacter);
  const addRelative = useCanvasStore(s => s.addRelative);
  const updateCharacter = useCanvasStore(s => s.updateCharacter);
  const deleteCharacter = useCanvasStore(s => s.deleteCharacter);
  const editingCharacterId = useCanvasStore(s => s.editingCharacterId);
  const setEditingCharacterId = useCanvasStore(s => s.setEditingCharacterId);
  const gridVisible = useCanvasStore(s => s.gridVisible);
  const undo = useCanvasStore(s => s.undo);
  const redo = useCanvasStore(s => s.redo);
  const canUndo = useCanvasStore(s => s.past.length > 0);
  const canRedo = useCanvasStore(s => s.future.length > 0);
  const toggleGrid = useCanvasStore(s => s.toggleGrid);
  const initCanvas = useCanvasStore(s => s.initCanvas);

  // Hydration-safe read — the plate reaches the DOM, so it must not read the
  // store directly. See store/guest-dynasty.ts.
  const { name: houseName, setting: houseSetting, crestSeed: houseCrestSeed } = useGuestHouse();
  const setHouse = useGuestDynastyStore(s => s.setHouse);
  const ensureCrestSeed = useGuestDynastyStore(s => s.ensureCrestSeed);
  const adoptExample = useGuestDynastyStore(s => s.adoptExample);
  const resetHouse = useGuestDynastyStore(s => s.resetHouse);

  const [addCharacterOpen, setAddCharacterOpen] = useState(false);
  const [relPicker, setRelPicker] = useState<{ anchorId: string; kind: RelativeKind } | null>(null);
  const [showExampleNotice, setShowExampleNotice] = useState(false);
  const [pendingImport, setPendingImport] = useState<File | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const reactFlow = useReactFlow();

  const { nodes: laidOutNodes, rows } = useGenealogyLayout(nodes, edges);
  const { fitTree, bind: fitBind } = useFitTree(laidOutNodes, containerRef);
  const settlingClass = useCanvasSettled();

  const highlight = useBloodlineHighlight(nodes, edges);
  const highlightValue = useMemo(
    () => ({ chars: highlight.chars, edges: highlight.edges, pinned: highlight.pinned, onUnionHover: highlight.onUnionHover }),
    [highlight.chars, highlight.edges, highlight.pinned, highlight.onUnionHover],
  );

  const characterNodes = useMemo(
    () => nodes.filter((n): n is CharacterNodeType => n.type === 'character'),
    [nodes]
  );

  const editingCharacter = useMemo(
    () => characterNodes.find(n => n.id === editingCharacterId),
    [characterNodes, editingCharacterId]
  );

  /**
   * One panel, three modes. Precedence matters: hitting "+" on the inspector's
   * Links tab has to show the relative form rather than the person you started
   * from, and once that submits, relPicker clears and the panel falls back to
   * the character still selected underneath — so you land back where you were.
   */
  const inspectorMode = useMemo<InspectorMode | null>(() => {
    if (relPicker) {
      const anchor = characterNodes.find(n => n.id === relPicker.anchorId);
      if (anchor) {
        return {
          kind: 'relative',
          anchor,
          relative: relPicker.kind,
          characters: characterNodes,
          unions: partnerUnionsOf(nodes, edges, relPicker.anchorId),
        };
      }
    }
    if (addCharacterOpen) return { kind: 'create' };
    if (editingCharacter) return { kind: 'edit', character: editingCharacter };
    return null;
  }, [relPicker, addCharacterOpen, editingCharacter, characterNodes, nodes, edges]);

  const closeInspector = useCallback(() => {
    setRelPicker(null);
    setAddCharacterOpen(false);
    setEditingCharacterId(null);
  }, [setEditingCharacterId]);

  /**
   * Opening one subject closes the others, so the most recent click always
   * wins — the inspector itself is what asks about an unsaved draft before
   * following. Add-relative is the deliberate exception: it leaves the
   * selection alone so the panel can fall back to the anchor afterwards.
   */
  const openEdit = useCallback((id: string | null) => {
    setRelPicker(null);
    setAddCharacterOpen(false);
    setEditingCharacterId(id);
  }, [setEditingCharacterId]);

  const openCreate = useCallback(() => {
    setRelPicker(null);
    setEditingCharacterId(null);
    setAddCharacterOpen(true);
  }, [setEditingCharacterId]);

  /** The panel kept an unsaved draft; put our state back to match it. */
  const restoreInspectorMode = useCallback((m: InspectorMode) => {
    if (m.kind === 'edit') { openEdit(m.character.id); return; }
    if (m.kind === 'create') { openCreate(); return; }
    setAddCharacterOpen(false);
    setRelPicker({ anchorId: m.anchor.id, kind: m.relative });
  }, [openEdit, openCreate]);

  const handleExport = useCallback(async () => {
    await exportCanvasToPng(reactFlow, containerRef, 'dynasty-tree');
  }, [reactFlow]);

  const handleExportJson = useCallback(() => {
    const data = buildGuestExport(laidOutNodes, edges, {
      name: houseName,
      setting: houseSetting,
      crestSeed: houseCrestSeed,
    });
    triggerJsonDownload(data, `${houseName || 'dynasty-tree'}.json`);
    toast.success(t('toasts.downloadedJson'));
  }, [laidOutNodes, edges, houseName, houseSetting, houseCrestSeed, t]);

  // Moved here from the retired GuestBanner: the store ships an empty seed so
  // the server and the browser's first render agree, and the arms are minted
  // after mount. The identity chip is the thing that draws them now.
  useEffect(() => { ensureCrestSeed(); }, [ensureCrestSeed]);

  const handleSaveHouse = useCallback((next: HouseSettings) => {
    setHouse({
      name: next.name.trim() || houseName,
      setting: next.setting,
      crestSeed: next.crestSeed,
    });
    return true;
  }, [setHouse, houseName]);

  const handleAddCharacter = useCallback((data: CharacterData) => {
    addCharacter(data);
    setAddCharacterOpen(false);
    toast.success(t('toasts.added', { name: data.name }));
  }, [addCharacter, t]);

  const handleUpdateCharacter = useCallback((data: CharacterData) => {
    if (!editingCharacterId) return;
    updateCharacter(editingCharacterId, data);
  }, [editingCharacterId, updateCharacter]);

  const handleDeleteCharacter = useCallback(() => {
    if (!editingCharacterId) return;
    deleteCharacter(editingCharacterId);
    toast.success(t('toasts.removed'));
  }, [editingCharacterId, deleteCharacter, t]);

  const openAddRelative = useCallback((anchorId: string, kind: RelativeKind) => {
    setAddCharacterOpen(false);
    setRelPicker({ anchorId, kind });
  }, []);

  const handleAddRelative = useCallback((input: AddRelativeInput) => {
    const error = addRelative(input);
    if (error) { toast.error(error === 'AMBIGUOUS_UNION' ? t('toasts.pickPartner') : error); return; }
    setRelPicker(null);
    toast.success(t('toasts.addedToTree'));
  }, [addRelative, t]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const runImport = useCallback(async (file: File) => {
    try {
      const raw = await file.text();
      const data = parseImportFile(raw);
      const { nodes: importedNodes, edges: importedEdges } = buildCanvasFromExport(data);
      initCanvas(importedNodes, importedEdges);
      // The file describes a whole house, not just its people. isPublic is
      // deliberately ignored — a guest tree has nothing to publish.
      setHouse({
        name: data.dynasty.name,
        setting: data.dynasty.setting,
        ...(data.dynasty.crestSeed ? { crestSeed: data.dynasty.crestSeed } : {}),
      });
      toast.success(t('toasts.imported'));
    } catch {
      toast.error(t('toasts.unreadableFile'));
    }
  }, [initCanvas, setHouse, t]);

  // Importing over existing work is destructive, so it asks first — holding the
  // chosen file until the answer comes back rather than blocking on confirm().
  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (characterNodes.length > 0) {
      setPendingImport(file);
      return;
    }
    void runImport(file);
  }, [characterNodes.length, runImport]);

  const handleClearExample = useCallback(() => {
    initCanvas([], []);
    // The tree and the house go together — keeping House Thorne's name and arms
    // over an empty canvas would be a leftover, not a starting point.
    resetHouse();
    setShowingExample(false);
    setShowExampleNotice(false);
    setAddCharacterOpen(true);
  }, [initCanvas, resetHouse]);

  const handleDismissExample = useCallback(() => {
    // The tree stays — they may want to build on it — but it is theirs now.
    setShowingExample(false);
    setShowExampleNotice(false);
  }, []);

  // First-run seeding. Must wait for the persist middleware to rehydrate,
  // otherwise a returning visitor's saved tree is still an empty array at mount
  // and we would seed straight over it.
  useEffect(() => {
    let cancelled = false;

    async function seedIfFirstRun() {
      if (hasSeedBeenDecided()) {
        setShowExampleNotice(isShowingExample());
        return;
      }
      if (useCanvasStore.getState().nodes.length > 0) {
        markSeedDecided('skipped');
        return;
      }

      const seed = await buildSeedCanvas();
      // Re-check after the await: the visitor may have added someone while the
      // fixture chunk was still downloading.
      if (cancelled || useCanvasStore.getState().nodes.length > 0) return;

      initCanvas(seed.nodes, seed.edges);
      adoptExample(EXAMPLE_HOUSE_NAME, EXAMPLE_CREST_SEED);
      markSeedDecided('seeded');
      setShowingExample(true);
      setShowExampleNotice(true);
    }

    if (useCanvasStore.persist.hasHydrated()) {
      void seedIfFirstRun();
      return () => { cancelled = true; };
    }

    const unsub = useCanvasStore.persist.onFinishHydration(() => void seedIfFirstRun());
    return () => { cancelled = true; unsub(); };
  }, [initCanvas, adoptExample]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || e.key.toLowerCase() !== 'z') return;

      const target = e.target as HTMLElement | null;
      const isEditable = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isEditable) return;

      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <CanvasContext.Provider value={{ setEditingCharacterId: openEdit, openAddRelative }}>
      <div className="flex h-full w-full">
        <div ref={containerRef} className={`relative flex-1 min-w-0 h-full ${settlingClass}`}>
          <HighlightContext.Provider value={highlightValue}>
          <ReactFlow
            nodes={laidOutNodes}
            edges={edges}
            onNodesChange={onNodesChange as (changes: import('@xyflow/react').NodeChange<AnyCanvasNode>[]) => void}
            onEdgesChange={onEdgesChange}
            onNodeMouseEnter={highlight.onNodeMouseEnter}
            onNodeMouseLeave={highlight.onNodeMouseLeave}
            onNodeClick={highlight.onNodeClick}
            onEdgeMouseEnter={highlight.onEdgeMouseEnter}
            onEdgeMouseLeave={highlight.onEdgeMouseLeave}
            onPaneClick={highlight.onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            colorMode="dark"
            {...fitBind}
            deleteKeyCode={['Backspace', 'Delete']}
            className="bg-background"
            proOptions={{ hideAttribution: false }}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            nodesDraggable={false}
          >
            {/* Always on: the faint warm dots give the ground a surface. The
                toggle raises the same dots to a working grid. */}
            <Background
              variant={BackgroundVariant.Dots}
              color={gridVisible ? 'var(--canvas-dot-strong)' : 'var(--canvas-dot)'}
              size={gridVisible ? 1.5 : 1.2}
              gap={20}
            />
            <GenerationBands
              rows={rows}
              nodes={laidOutNodes}
              houseName={houseName}
              crestSeed={houseCrestSeed}
            />
          </ReactFlow>
          <div className="canvas-vignette" aria-hidden="true" />

          {/* Bottom-left slot: zoom, legend beneath it (design.md §9). */}
          <div className="absolute bottom-4 left-4 z-20 flex flex-col items-start gap-2">
            <ZoomControls />
            {characterNodes.length > 0 && <CanvasLegend />}
          </div>
          </HighlightContext.Provider>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />

          <Toolbar
            gridVisible={gridVisible}
            onToggleGrid={toggleGrid}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onExport={handleExport}
            onExportJson={handleExportJson}
            onImportJson={handleImportClick}
            onFitView={fitTree}
            extra={
              <DynastySettingsDialog
                initial={{
                  name: houseName,
                  setting: houseSetting,
                  crestSeed: houseCrestSeed,
                }}
                onSave={handleSaveHouse}
              />
            }
          />

          {/* Guest mode gets the same three slots as the account workspace —
              guest/account parity is a bug class here, not a nicety. The only
              differences: no dashboard to go back to, and the account chip
              says guest and offers a way in. */}
          <IdentityChip
            name={houseName}
            crestSeed={houseCrestSeed}
            stats={`${characterNodes.length} · ${rows.length} gen`}
          />

          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            <AccountChip mode="guest" />
          </div>

          {characterNodes.length === 0 && (
            <CanvasEmptyState onAddCharacter={openCreate} onImportJson={handleImportClick} />
          )}

          <ConfirmDialog
            open={pendingImport !== null}
            onOpenChange={(open) => { if (!open) setPendingImport(null); }}
            title={t('replaceTree.title')}
            description={t('replaceTree.description')}
            confirmLabel={t('replaceTree.confirmLabel')}
            destructive
            onConfirm={() => { const f = pendingImport; setPendingImport(null); if (f) void runImport(f); }}
          />

          {showExampleNotice && characterNodes.length > 0 && (
            <ExampleDynastyNotice
              houseName={EXAMPLE_HOUSE_NAME}
              onClear={handleClearExample}
              onDismiss={handleDismissExample}
            />
          )}

          <AddRelativeHint visible={characterNodes.length === 1 && !characterNodes[0].selected} />

          {/* The right slot — the only character surface there is. Editing,
              creating and adding a relative are all this one panel, so the
              canvas is never blacked out by a dialog (design.md §9). */}
          {inspectorMode && (
            <Inspector
              mode={inspectorMode}
              nodes={nodes}
              edges={edges}
              onSave={handleUpdateCharacter}
              onCreate={handleAddCharacter}
              onSubmitRelative={handleAddRelative}
              onDelete={handleDeleteCharacter}
              onClose={closeInspector}
              onRestoreMode={restoreInspectorMode}
              onSelect={openEdit}
              onAddRelative={openAddRelative}
            />
          )}
        </div>
      </div>
    </CanvasContext.Provider>
  );
}

export function TreeCanvas() {
  return <TreeCanvasInner />;
}
