"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background, BackgroundVariant, Controls,
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
import { CharacterDialog } from '@/components/canvas/CharacterDialog';
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
import { useGuestHouse, useGuestDynastyStore } from '@/store/guest-dynasty';
import type { CharacterData } from '@/types/canvas';

const nodeTypes = { character: CharacterNode, union: UnionNode } as const;
const edgeTypes = { relationship: RelationshipEdge } as const;

function TreeCanvasInner() {
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
    toast.success('Downloaded as JSON');
  }, [laidOutNodes, edges, houseName, houseSetting, houseCrestSeed]);

  const handleAddCharacter = useCallback((data: CharacterData) => {
    addCharacter(data);
    toast.success(`${data.name} added to the dynasty`);
  }, [addCharacter]);

  const handleUpdateCharacter = useCallback((data: CharacterData) => {
    if (!editingCharacterId) return;
    updateCharacter(editingCharacterId, data);
  }, [editingCharacterId, updateCharacter]);

  const handleDeleteCharacter = useCallback(() => {
    if (!editingCharacterId) return;
    deleteCharacter(editingCharacterId);
    toast.success('Character removed');
  }, [editingCharacterId, deleteCharacter]);

  const openAddRelative = useCallback((anchorId: string, kind: RelativeKind) => {
    setRelPicker({ anchorId, kind });
  }, []);

  const handleAddRelative = useCallback((input: AddRelativeInput) => {
    const error = addRelative(input);
    if (error) { toast.error(error === 'AMBIGUOUS_UNION' ? 'Pick which partner first' : error); return; }
    setRelPicker(null);
    toast.success('Added to the tree');
  }, [addRelative]);

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
      toast.success('Imported dynasty tree');
    } catch {
      toast.error("Couldn't read that file — is it a Dynasty Tree export?");
    }
  }, [initCanvas, setHouse]);

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
    <CanvasContext.Provider value={{ setEditingCharacterId, openAddRelative }}>
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
            <Controls showInteractive={false} className="!bottom-4 !left-auto !right-4 !top-auto" />
            <GenerationBands
              rows={rows}
              nodes={laidOutNodes}
              houseName={houseName}
              crestSeed={houseCrestSeed}
            />
          </ReactFlow>
          <div className="canvas-vignette" aria-hidden="true" />
          {characterNodes.length > 0 && <CanvasLegend />}
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
          />

          {characterNodes.length === 0 && (
            <CanvasEmptyState onAddCharacter={() => setAddCharacterOpen(true)} onImportJson={handleImportClick} />
          )}

          <ConfirmDialog
            open={pendingImport !== null}
            onOpenChange={(open) => { if (!open) setPendingImport(null); }}
            title="Replace your current tree?"
            description="Importing a file replaces everything on this canvas. Your current guest tree cannot be recovered afterwards."
            confirmLabel="Replace tree"
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

          {addCharacterOpen && (
            <CharacterDialog
              mode={{ kind: 'create' }}
              onClose={() => setAddCharacterOpen(false)}
              onSubmitCharacter={handleAddCharacter}
            />
          )}

          {editingCharacter && (
            <CharacterDialog
              mode={{ kind: 'edit', character: editingCharacter }}
              onClose={() => setEditingCharacterId(null)}
              onSubmitCharacter={handleUpdateCharacter}
              onDelete={handleDeleteCharacter}
            />
          )}

          {relPicker && (() => {
            const anchor = characterNodes.find(n => n.id === relPicker.anchorId);
            if (!anchor) return null;
            return (
              <CharacterDialog
                mode={{
                  kind: 'relative',
                  anchor,
                  relative: relPicker.kind,
                  characters: characterNodes,
                  unions: partnerUnionsOf(nodes, edges, relPicker.anchorId),
                }}
                onClose={() => setRelPicker(null)}
                onSubmitRelative={handleAddRelative}
              />
            );
          })()}
        </div>
      </div>
    </CanvasContext.Provider>
  );
}

export function TreeCanvas() {
  return <TreeCanvasInner />;
}
