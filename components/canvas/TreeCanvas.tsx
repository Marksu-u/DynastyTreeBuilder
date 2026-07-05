"use client";

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background, BackgroundVariant, Controls,
  useReactFlow,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { triggerJsonDownload } from '@/lib/export';
import { useCanvasStore } from '@/store/canvas';
import type { AnyCanvasNode, CharacterNodeType, RelationshipEdgeType } from '@/store/canvas';
import { CharacterNode } from '@/components/canvas/CharacterNode';
import { UnionNode } from '@/components/canvas/UnionNode';
import { RelationshipEdge } from '@/components/canvas/RelationshipEdge';
import { Toolbar } from '@/components/canvas/Toolbar';
import { AddCharacterPanel } from '@/components/canvas/AddCharacterPanel';
import { EditRelationshipPanel } from '@/components/canvas/EditRelationshipPanel';
import { AddRelativePanel } from '@/components/canvas/AddRelativePanel';
import { GenerationBands } from '@/components/canvas/GenerationBands';
import { CatalogProvider } from '@/components/canvas/CatalogProvider';
import { CanvasContext } from '@/components/canvas/CanvasContext';
import { CanvasEmptyState } from '@/components/canvas/CanvasEmptyState';
import { useGenealogyLayout } from '@/components/canvas/useGenealogyLayout';
import { partnerUnionsOf, type AddRelativeInput, type RelativeKind } from '@/lib/relative-ops';
import type { CharacterData, RelationshipData } from '@/types/canvas';

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
  const updateRelationship = useCanvasStore(s => s.updateRelationship);
  const deleteRelationship = useCanvasStore(s => s.deleteRelationship);
  const editingCharacterId = useCanvasStore(s => s.editingCharacterId);
  const setEditingCharacterId = useCanvasStore(s => s.setEditingCharacterId);
  const editingEdgeId = useCanvasStore(s => s.editingEdgeId);
  const setEditingEdgeId = useCanvasStore(s => s.setEditingEdgeId);
  const gridVisible = useCanvasStore(s => s.gridVisible);
  const undo = useCanvasStore(s => s.undo);
  const redo = useCanvasStore(s => s.redo);
  const canUndo = useCanvasStore(s => s.past.length > 0);
  const canRedo = useCanvasStore(s => s.future.length > 0);
  const toggleGrid = useCanvasStore(s => s.toggleGrid);

  const [addCharacterOpen, setAddCharacterOpen] = useState(false);
  const [relPicker, setRelPicker] = useState<{ anchorId: string; kind: RelativeKind } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  const { nodes: laidOutNodes, rows } = useGenealogyLayout(nodes, edges);

  const characterNodes = useMemo(
    () => nodes.filter((n): n is CharacterNodeType => n.type === 'character'),
    [nodes]
  );

  const editingCharacter = useMemo(
    () => characterNodes.find(n => n.id === editingCharacterId),
    [characterNodes, editingCharacterId]
  );

  const editingEdge = useMemo(
    () => edges.find(e => e.id === editingEdgeId) as RelationshipEdgeType | undefined,
    [edges, editingEdgeId]
  );

  const handleExport = useCallback(async () => {
    await fitView({ duration: 0, padding: 0.15 });
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    const element = containerRef.current?.querySelector<HTMLElement>('.react-flow');
    if (!element) return;
    try {
      const dataUrl = await toPng(element, {
        backgroundColor: '#09090b',
        filter: node => !(node instanceof Element && node.classList.contains('react-flow__panel')),
      });
      const link = document.createElement('a');
      link.download = 'dynasty-tree.png';
      link.href = dataUrl;
      link.click();
      toast.success('Exported as PNG');
    } catch { toast.error('Export failed'); }
  }, [fitView]);

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
      relationships: e.map(edge => ({
        id: edge.id, fromId: edge.source, toId: edge.target,
        type: edge.data?.type ?? 'CHILD',
        hook: edge.data?.hook ?? null, isMutual: edge.data?.isMutual ?? false,
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

  const handleUpdateRelationship = useCallback((data: Partial<RelationshipData>) => {
    if (!editingEdgeId) return;
    updateRelationship(editingEdgeId, data);
  }, [editingEdgeId, updateRelationship]);

  const handleDeleteRelationship = useCallback(() => {
    if (!editingEdgeId) return;
    deleteRelationship(editingEdgeId);
  }, [editingEdgeId, deleteRelationship]);

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: RelationshipEdgeType) => {
    setEditingEdgeId(edge.id);
  }, [setEditingEdgeId]);

  const openAddRelative = useCallback((anchorId: string, kind: RelativeKind) => {
    setRelPicker({ anchorId, kind });
  }, []);

  const handleAddRelative = useCallback((input: AddRelativeInput) => {
    const error = addRelative(input);
    if (error) { toast.error(error === 'AMBIGUOUS_UNION' ? 'Pick which partner first' : error); return; }
    setRelPicker(null);
    toast.success('Added to the tree');
  }, [addRelative]);

  return (
    <CanvasContext.Provider value={{ setEditingCharacterId, openAddRelative }}>
      <div className="flex h-full w-full">
        <div ref={containerRef} className="relative flex-1 min-w-0 h-full">
          <ReactFlow
            nodes={laidOutNodes}
            edges={edges}
            onNodesChange={onNodesChange as (changes: import('@xyflow/react').NodeChange<AnyCanvasNode>[]) => void}
            onEdgesChange={onEdgesChange}
            onEdgeClick={handleEdgeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            colorMode="dark"
            fitView
            fitViewOptions={{ padding: 0.2 }}
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
            <GenerationBands rows={rows} nodes={laidOutNodes} houseName="Your Dynasty" />
          </ReactFlow>

          <Toolbar
            gridVisible={gridVisible}
            onToggleGrid={toggleGrid}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onExport={handleExport}
            onExportJson={handleExportJson}
            showCustomOptions={false}
          />

          {characterNodes.length === 0 && (
            <CanvasEmptyState onAddCharacter={() => setAddCharacterOpen(true)} />
          )}

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

          {editingEdgeId && (
            <EditRelationshipPanel
              open={true}
              onOpenChange={open => { if (!open) setEditingEdgeId(null); }}
              edge={editingEdge}
              onSubmit={handleUpdateRelationship}
              onDelete={handleDeleteRelationship}
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
