"use client";

import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
} from '@xyflow/react';
import { toast } from 'sonner';
import { useCanvasStore } from '@/store/canvas';
import { CharacterNode } from '@/components/canvas/CharacterNode';
import { RelationshipEdge } from '@/components/canvas/RelationshipEdge';
import { Toolbar } from '@/components/canvas/Toolbar';
import { AddCharacterPanel } from '@/components/canvas/AddCharacterPanel';
import { EditRelationshipPanel } from '@/components/canvas/EditRelationshipPanel';
import { NameBank } from '@/components/name-bank/NameBank';
import { RoleSlots } from '@/components/name-bank/RoleSlots';
import type { CharacterData, CharacterRole, RelationshipData } from '@/types/canvas';
import type { RelationshipEdgeType } from '@/store/canvas';

// Defined outside component to avoid recreating on every render
const nodeTypes = { character: CharacterNode } as const;
const edgeTypes = { relationship: RelationshipEdge } as const;

export function TreeCanvas() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const addCharacter = useCanvasStore((s) => s.addCharacter);
  const updateCharacter = useCanvasStore((s) => s.updateCharacter);
  const deleteCharacter = useCanvasStore((s) => s.deleteCharacter);
  const updateRelationship = useCanvasStore((s) => s.updateRelationship);
  const deleteRelationship = useCanvasStore((s) => s.deleteRelationship);
  const editingCharacterId = useCanvasStore((s) => s.editingCharacterId);
  const setEditingCharacterId = useCanvasStore((s) => s.setEditingCharacterId);
  const editingEdgeId = useCanvasStore((s) => s.editingEdgeId);
  const setEditingEdgeId = useCanvasStore((s) => s.setEditingEdgeId);
  const gridVisible = useCanvasStore((s) => s.gridVisible);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const canUndo = useCanvasStore((s) => s.past.length > 0);
  const canRedo = useCanvasStore((s) => s.future.length > 0);
  const toggleGrid = useCanvasStore((s) => s.toggleGrid);

  const [addCharacterOpen, setAddCharacterOpen] = useState(false);
  const [sidebar, setSidebar] = useState<'names' | 'roles' | null>(null);

  const usedNames = useCanvasStore((s) => s.nodes.map((n) => n.data.name));

  const handleToggleSidebar = useCallback((panel: 'names' | 'roles') => {
    setSidebar((current) => (current === panel ? null : panel));
  }, []);

  const editingCharacter = useMemo(
    () => nodes.find((n) => n.id === editingCharacterId),
    [nodes, editingCharacterId]
  );

  const editingEdge = useMemo(
    () => edges.find((e) => e.id === editingEdgeId) as RelationshipEdgeType | undefined,
    [edges, editingEdgeId]
  );

  const handleAddCharacter = useCallback(
    (data: CharacterData) => {
      addCharacter(data);
      toast.success(`${data.name} added to the dynasty`);
    },
    [addCharacter]
  );

  const handleAddFromSidebar = useCallback(
    (name: string, role: CharacterRole = 'UNKNOWN') => {
      addCharacter({ name, role, style: 'OTHER', gender: 'UNKNOWN', isFounder: false, isLost: false });
      toast.success(`${name} added to the dynasty`);
    },
    [addCharacter]
  );

  const handleUpdateCharacter = useCallback(
    (data: CharacterData) => {
      if (!editingCharacterId) return;
      updateCharacter(editingCharacterId, data);
    },
    [editingCharacterId, updateCharacter]
  );

  const handleDeleteCharacter = useCallback(() => {
    if (!editingCharacterId) return;
    deleteCharacter(editingCharacterId);
    toast.success('Character removed');
  }, [editingCharacterId, deleteCharacter]);

  const handleUpdateRelationship = useCallback(
    (data: Partial<RelationshipData>) => {
      if (!editingEdgeId) return;
      updateRelationship(editingEdgeId, data);
    },
    [editingEdgeId, updateRelationship]
  );

  const handleDeleteRelationship = useCallback(() => {
    if (!editingEdgeId) return;
    deleteRelationship(editingEdgeId);
  }, [editingEdgeId, deleteRelationship]);

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: RelationshipEdgeType) => {
      setEditingEdgeId(edge.id);
    },
    [setEditingEdgeId]
  );

  const handleConnect = useCallback(
    (connection: Parameters<typeof onConnect>[0]) => {
      onConnect(connection);
      toast('Connection created — click the line to set its type', {
        duration: 3500,
        description: 'Default type is Unknown',
      });
    },
    [onConnect]
  );

  return (
    <div className="flex h-full w-full">
      <div className="relative flex-1 min-w-0 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
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
      >
        {gridVisible && (
          <Background
            variant={BackgroundVariant.Dots}
            color="#3f3f46"
            size={1.5}
            gap={20}
          />
        )}
        <Controls
          showInteractive={false}
          className="!bottom-4 !left-auto !right-4 !top-auto"
        />
      </ReactFlow>

      <Toolbar
          onAddCharacter={() => setAddCharacterOpen(true)}
          gridVisible={gridVisible}
          onToggleGrid={toggleGrid}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          activeSidebar={sidebar}
          onToggleSidebar={handleToggleSidebar}
        />

      {nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-semibold text-zinc-700">Your dynasty awaits</p>
            <p className="mt-1 text-sm text-zinc-600">
              Click <span className="text-zinc-500">Add Character</span> in the toolbar to begin
            </p>
          </div>
        </div>
      )}

      {/* Add new character */}
      <AddCharacterPanel
        key="add"
        open={addCharacterOpen}
        onOpenChange={setAddCharacterOpen}
        onSubmit={handleAddCharacter}
      />

      {/* Edit existing character */}
      {editingCharacterId && (
        <AddCharacterPanel
          key="edit"
          open={true}
          onOpenChange={(open) => { if (!open) setEditingCharacterId(null); }}
          character={editingCharacter}
          onSubmit={handleUpdateCharacter}
          onDelete={handleDeleteCharacter}
        />
      )}

      {/* Edit relationship */}
      {editingEdgeId && (
        <EditRelationshipPanel
          open={true}
          onOpenChange={(open) => { if (!open) setEditingEdgeId(null); }}
          edge={editingEdge}
          onSubmit={handleUpdateRelationship}
          onDelete={handleDeleteRelationship}
        />
      )}
      </div>

      {sidebar === 'names' && (
        <NameBank
          usedNames={usedNames}
          onAddToCanvas={(name) => handleAddFromSidebar(name)}
          isLoggedIn={false}
        />
      )}
      {sidebar === 'roles' && (
        <RoleSlots onAddToCanvas={handleAddFromSidebar} />
      )}
    </div>
  );
}
