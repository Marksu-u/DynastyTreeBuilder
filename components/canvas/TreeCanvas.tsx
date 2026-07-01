"use client";

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Background, BackgroundVariant, ConnectionMode, Controls,
  useReactFlow,
  type Connection,
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
import { ConnectionPopup } from '@/components/canvas/ConnectionPopup';
import { CatalogProvider } from '@/components/canvas/CatalogProvider';
import { CanvasContext } from '@/components/canvas/CanvasContext';
import { CanvasEmptyState } from '@/components/canvas/CanvasEmptyState';
import type { CharacterData, RelationshipData } from '@/types/canvas';

const nodeTypes = { character: CharacterNode, union: UnionNode } as const;
const edgeTypes = { relationship: RelationshipEdge } as const;

interface PendingConnection {
  source: string;
  target: string;
  screenX: number;
  screenY: number;
}

function TreeCanvasInner() {
  const nodes = useCanvasStore(s => s.nodes);
  const edges = useCanvasStore(s => s.edges);
  const onNodesChange = useCanvasStore(s => s.onNodesChange);
  const onEdgesChange = useCanvasStore(s => s.onEdgesChange);
  const addCharacter = useCanvasStore(s => s.addCharacter);
  const updateCharacter = useCanvasStore(s => s.updateCharacter);
  const deleteCharacter = useCanvasStore(s => s.deleteCharacter);
  const addUnion = useCanvasStore(s => s.addUnion);
  const updateRelationship = useCanvasStore(s => s.updateRelationship);
  const deleteRelationship = useCanvasStore(s => s.deleteRelationship);
  const tidyTreeAction = useCanvasStore(s => s.tidyTree);
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
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const { fitView, getNode } = useReactFlow();

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
    const { nodes: n, edges: e } = useCanvasStore.getState();
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
  }, []);

  const handleConnect = useCallback((connection: Connection) => {
    const sourceNode = getNode(connection.source);
    const targetNode = getNode(connection.target);
    if (!sourceNode || !targetNode || sourceNode.type !== 'character') return;

    if (targetNode.type === 'union') {
      toast('Connect directly to a person in this union instead', { duration: 3500 });
      return;
    }

    const container = containerRef.current?.getBoundingClientRect();
    const midX = container ? container.left + (container.width / 2) : window.innerWidth / 2;
    const midY = container ? container.top + (container.height / 2) : window.innerHeight / 2;

    setPendingConnection({
      source: connection.source,
      target: connection.target,
      screenX: midX,
      screenY: midY,
    });
  }, [getNode]);

  const handleConnectionChoice = useCallback((choice: 'partner' | 'child' | 'adopted') => {
    if (!pendingConnection) return;
    const { source, target } = pendingConnection;
    setPendingConnection(null);

    if (choice === 'partner') {
      addUnion({ parentIds: [source, target], childIds: [], adoptedIds: [] });
      toast.success('Union created — drag a connection to add children');
    } else if (choice === 'child') {
      addUnion({ parentIds: [source], childIds: [target], adoptedIds: [] });
      toast.success('Parent → child link created');
    } else {
      addUnion({ parentIds: [source], childIds: [], adoptedIds: [target] });
      toast.success('Adopted link created');
    }
  }, [pendingConnection, addUnion]);

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

  return (
    <CanvasContext.Provider value={{ setEditingCharacterId }}>
      <div className="flex h-full w-full">
        <div ref={containerRef} className="relative flex-1 min-w-0 h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange as (changes: import('@xyflow/react').NodeChange<AnyCanvasNode>[]) => void}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onEdgeClick={handleEdgeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            colorMode="dark"
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode={['Backspace', 'Delete']}
            className="bg-zinc-950"
            proOptions={{ hideAttribution: false }}
            defaultEdgeOptions={{ type: 'smoothstep' }}
            snapToGrid={gridVisible}
            snapGrid={[20, 20]}
          >
            {gridVisible && (
              <Background variant={BackgroundVariant.Dots} color="#3f3f46" size={1.5} gap={20} />
            )}
            <Controls showInteractive={false} className="!bottom-4 !left-auto !right-4 !top-auto" />
          </ReactFlow>

          <Toolbar
            onAddCharacter={() => setAddCharacterOpen(true)}
            onTidyTree={tidyTreeAction}
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

          {pendingConnection && (
            <ConnectionPopup
              x={pendingConnection.screenX}
              y={pendingConnection.screenY}
              onSelect={handleConnectionChoice}
              onDismiss={() => setPendingConnection(null)}
            />
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
