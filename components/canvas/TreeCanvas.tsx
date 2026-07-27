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
import { AddCharacterPanel } from '@/components/canvas/AddCharacterPanel';
import { AddRelativePanel } from '@/components/canvas/AddRelativePanel';
import { AddRelativeHint } from '@/components/canvas/AddRelativeHint';
import { GenerationBands } from '@/components/canvas/GenerationBands';
import { CatalogProvider } from '@/components/canvas/CatalogProvider';
import { CanvasContext } from '@/components/canvas/CanvasContext';
import { CanvasEmptyState } from '@/components/canvas/CanvasEmptyState';
import { ExampleDynastyNotice } from '@/components/canvas/ExampleDynastyNotice';
import { useGenealogyLayout } from '@/components/canvas/useGenealogyLayout';
import { HighlightContext } from '@/components/canvas/HighlightContext';
import { useBloodlineHighlight } from '@/components/canvas/useBloodlineHighlight';
import { partnerUnionsOf, type AddRelativeInput, type RelativeKind } from '@/lib/relative-ops';
import { parseImportFile, buildCanvasFromExport, deriveExportRelationships } from '@/lib/import-canvas';
import {
  EXAMPLE_HOUSE_NAME, buildSeedCanvas, hasSeedBeenDecided,
  markSeedDecided, isShowingExample, setShowingExample,
} from '@/lib/seed-canvas';
import { useFitTree } from '@/components/canvas/useFitTree';
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

  const [addCharacterOpen, setAddCharacterOpen] = useState(false);
  const [relPicker, setRelPicker] = useState<{ anchorId: string; kind: RelativeKind } | null>(null);
  const [showExampleNotice, setShowExampleNotice] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const reactFlow = useReactFlow();

  const { nodes: laidOutNodes, rows } = useGenealogyLayout(nodes, edges);
  const { fitTree, bind: fitBind } = useFitTree(laidOutNodes, containerRef);

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
    const n = laidOutNodes; const e = edges;
    const data = {
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      dynasty: { name: 'My Dynasty', setting: 'FANTASY' as const, isPublic: false },
      characters: n.filter(nd => nd.type === 'character').map(nd => ({
        id: nd.id, name: (nd as CharacterNodeType).data.name,
        alias: (nd as CharacterNodeType).data.alias ?? null,
        flags: (nd as CharacterNodeType).data.flags ?? [],
        style: (nd as CharacterNodeType).data.style,
        gender: (nd as CharacterNodeType).data.gender,
        note: (nd as CharacterNodeType).data.note ?? null,
        posX: nd.position.x, posY: nd.position.y,
      })),
      relationships: deriveExportRelationships(n, e).map(r => ({
        id: crypto.randomUUID(), fromId: r.fromId, toId: r.toId,
        type: r.type, hook: null, isMutual: false,
      })),
    };
    triggerJsonDownload(data, 'dynasty-tree.json');
    toast.success('Downloaded as JSON');
  }, [laidOutNodes, edges]);

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

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (characterNodes.length > 0 && !window.confirm('Import will replace your current guest tree. Continue?')) {
      return;
    }
    try {
      const raw = await file.text();
      const data = parseImportFile(raw);
      const { nodes: importedNodes, edges: importedEdges } = buildCanvasFromExport(data);
      initCanvas(importedNodes, importedEdges);
      toast.success('Imported dynasty tree');
    } catch {
      toast.error("Couldn't read that file — is it a Dynasty Tree export?");
    }
  }, [characterNodes.length, initCanvas]);

  const handleClearExample = useCallback(() => {
    initCanvas([], []);
    setShowingExample(false);
    setShowExampleNotice(false);
    setAddCharacterOpen(true);
  }, [initCanvas]);

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
  }, [initCanvas]);

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
        <div ref={containerRef} className="relative flex-1 min-w-0 h-full">
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
            className="bg-zinc-950"
            proOptions={{ hideAttribution: false }}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            nodesDraggable={false}
          >
            {gridVisible && (
              <Background variant={BackgroundVariant.Dots} color="#3f3f46" size={1.5} gap={20} />
            )}
            <Controls showInteractive={false} className="!bottom-4 !left-auto !right-4 !top-auto" />
            <GenerationBands
              rows={rows}
              nodes={laidOutNodes}
              houseName={showExampleNotice ? EXAMPLE_HOUSE_NAME : 'Your Dynasty'}
            />
          </ReactFlow>
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
            showCustomOptions={false}
            onFitView={fitTree}
          />

          {characterNodes.length === 0 && (
            <CanvasEmptyState onAddCharacter={() => setAddCharacterOpen(true)} onImportJson={handleImportClick} />
          )}

          {showExampleNotice && characterNodes.length > 0 && (
            <ExampleDynastyNotice
              houseName={EXAMPLE_HOUSE_NAME}
              onClear={handleClearExample}
              onDismiss={handleDismissExample}
            />
          )}

          <AddRelativeHint visible={characterNodes.length === 1 && !characterNodes[0].selected} />

          <AddCharacterPanel
            key="add"
            open={addCharacterOpen}
            onOpenChange={setAddCharacterOpen}
            onSubmit={handleAddCharacter}
            isLoggedIn={false}
          />

          {editingCharacterId && (
            <AddCharacterPanel
              key="edit"
              open={true}
              onOpenChange={open => { if (!open) setEditingCharacterId(null); }}
              character={editingCharacter}
              onSubmit={handleUpdateCharacter}
              onDelete={handleDeleteCharacter}
              isLoggedIn={false}
            />
          )}

          {relPicker && (() => {
            const anchor = characterNodes.find(n => n.id === relPicker.anchorId);
            if (!anchor) return null;
            return (
              <AddRelativePanel
                anchor={anchor}
                kind={relPicker.kind}
                characters={characterNodes}
                unions={partnerUnionsOf(nodes, edges, relPicker.anchorId)}
                onSubmit={handleAddRelative}
                onClose={() => setRelPicker(null)}
              />
            );
          })()}
        </div>
      </div>
    </CanvasContext.Provider>
  );
}

export function TreeCanvas() {
  return (
    <CatalogProvider isLoggedIn={false}>
      <TreeCanvasInner />
    </CatalogProvider>
  );
}
