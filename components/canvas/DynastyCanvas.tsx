"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { toast } from "sonner";
import { CharacterNode } from "./CharacterNode";
import { RelationshipEdge } from "./RelationshipEdge";
import { Toolbar, type SidebarPanel } from "./Toolbar";
import { AddCharacterPanel } from "./AddCharacterPanel";
import { EditRelationshipPanel } from "./EditRelationshipPanel";
import { CanvasContext } from "./CanvasContext";
import { CustomOptionsPanel } from "@/components/name-bank/CustomOptionsPanel";
import {
  createCharacter,
  updateCharacter,
  deleteCharacter,
} from "@/app/actions/character";
import {
  updateRelationship,
  deleteRelationship,
} from "@/app/actions/relationship";
import type { CharacterData, RelationshipData } from "@/types/canvas";
import type { CharacterNodeType, RelationshipEdgeType, LegacyEdgeType } from "@/store/canvas";
import { CanvasEmptyState } from "@/components/canvas/CanvasEmptyState";
import { UnionNode } from './UnionNode';
import type { AnyCanvasNode } from '@/store/canvas';
import { migrateCanvas } from '@/lib/migrate-canvas';
import { useGenealogyLayout } from './useGenealogyLayout';

const nodeTypes = { character: CharacterNode, union: UnionNode } as const;
const edgeTypes = { relationship: RelationshipEdge } as const;

type Props = {
  dynastyId: string;
  dynastyName: string;
  initialNodes: CharacterNodeType[];
  initialEdges: LegacyEdgeType[];
  userId?: string;
};

export function DynastyCanvas({
  dynastyId,
  dynastyName,
  initialNodes,
  initialEdges,
  userId,
}: Props) {
  const isLoggedIn = !!userId;
  const migrated = useMemo(
    () => migrateCanvas(initialNodes as never, initialEdges as never),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [nodes, setNodes] = useState<AnyCanvasNode[]>(migrated.nodes as AnyCanvasNode[]);
  const [edges, setEdges] = useState<RelationshipEdgeType[]>(migrated.edges);
  const [gridVisible, setGridVisible] = useState(true);
  const [addCharacterOpen, setAddCharacterOpen] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState<SidebarPanel | null>(null);

  const { nodes: laidOutNodes, rows } = useGenealogyLayout(nodes, edges);
  void rows; // consumed in a later task

  const handleToggleSidebar = useCallback((panel: SidebarPanel) => {
    setSidebar((current) => (current === panel ? null : panel));
  }, []);

  const characterNodes = useMemo(
    () => nodes.filter((n): n is CharacterNodeType => n.type === 'character'),
    [nodes]
  );
  const editingCharacter = useMemo(
    () => characterNodes.find((n) => n.id === editingCharacterId),
    [characterNodes, editingCharacterId]
  );

  const editingEdge = useMemo(
    () => edges.find((e) => e.id === editingEdgeId) as RelationshipEdgeType | undefined,
    [edges, editingEdgeId]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<AnyCanvasNode>[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds) as AnyCanvasNode[]);
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<RelationshipEdgeType>[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds) as RelationshipEdgeType[]);
    },
    []
  );

  const handleAddCharacter = useCallback(
    async (data: CharacterData) => {
      const tempId = crypto.randomUUID();
      setNodes((nds) => [...nds, { id: tempId, type: "character", position: { x: 0, y: 0 }, data }]);
      try {
        const { id } = await createCharacter(dynastyId, data, { x: 0, y: 0 });
        setNodes((nds) => nds.map((n) => (n.id === tempId ? { ...n, id } : n)));
        toast.success(`${data.name} added to the dynasty`);
      } catch {
        setNodes((nds) => nds.filter((n) => n.id !== tempId));
        toast.error("Failed to save character");
      }
    },
    [dynastyId]
  );

  const handleUpdateCharacter = useCallback(
    async (data: CharacterData) => {
      if (!editingCharacterId) return;
      const id = editingCharacterId;
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
      );
      setEditingCharacterId(null);

      try {
        await updateCharacter(id, dynastyId, data);
      } catch {
        toast.error("Failed to save changes");
      }
    },
    [editingCharacterId, dynastyId]
  );

  const handleDeleteCharacter = useCallback(async () => {
    if (!editingCharacterId) return;
    const id = editingCharacterId;
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setEditingCharacterId(null);

    try {
      await deleteCharacter(id, dynastyId);
      toast.success("Character removed");
    } catch {
      toast.error("Failed to delete character");
    }
  }, [editingCharacterId, dynastyId]);

  const handleUpdateRelationship = useCallback(
    async (data: Partial<RelationshipData>) => {
      if (!editingEdgeId) return;
      const id = editingEdgeId;
      setEdges((eds) =>
        eds.map((e) =>
          e.id === id ? { ...e, data: { ...e.data, ...data } as RelationshipData } : e
        )
      );
      setEditingEdgeId(null);

      try {
        await updateRelationship(id, dynastyId, data);
      } catch {
        toast.error("Failed to save relationship");
      }
    },
    [editingEdgeId, dynastyId]
  );

  const handleDeleteRelationship = useCallback(async () => {
    if (!editingEdgeId) return;
    const id = editingEdgeId;
    setEdges((eds) => eds.filter((e) => e.id !== id));
    setEditingEdgeId(null);

    try {
      await deleteRelationship(id, dynastyId);
    } catch {
      toast.error("Failed to delete relationship");
    }
  }, [editingEdgeId, dynastyId]);

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: RelationshipEdgeType) => {
      setEditingEdgeId(edge.id);
    },
    []
  );

  return (
    <CanvasContext.Provider value={{ setEditingCharacterId }}>
      <div className="flex h-full w-full">
      <div className="relative flex-1 min-w-0 h-full">
        <ReactFlow
          nodes={laidOutNodes}
          edges={edges}
          onNodesChange={onNodesChange as (changes: NodeChange<AnyCanvasNode>[]) => void}
          onEdgesChange={onEdgesChange}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={["Backspace", "Delete"]}
          className="bg-zinc-950"
          proOptions={{ hideAttribution: false }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          nodesDraggable={false}
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
          onToggleGrid={() => setGridVisible((v) => !v)}
          activeSidebar={sidebar}
          onToggleSidebar={handleToggleSidebar}
          showCustomOptions={isLoggedIn}
        />

        {characterNodes.length === 0 && (
          <CanvasEmptyState onAddCharacter={() => setAddCharacterOpen(true)} />
        )}

        <AddCharacterPanel
          key="add"
          open={addCharacterOpen}
          onOpenChange={setAddCharacterOpen}
          onSubmit={handleAddCharacter}
          isLoggedIn={isLoggedIn}
        />

        {editingCharacterId && (
          <AddCharacterPanel
            key="edit"
            open={true}
            onOpenChange={(open) => {
              if (!open) setEditingCharacterId(null);
            }}
            character={editingCharacter}
            onSubmit={handleUpdateCharacter}
            onDelete={handleDeleteCharacter}
            isLoggedIn={isLoggedIn}
          />
        )}

        {editingEdgeId && (
          <EditRelationshipPanel
            open={true}
            onOpenChange={(open) => {
              if (!open) setEditingEdgeId(null);
            }}
            edge={editingEdge}
            onSubmit={handleUpdateRelationship}
            onDelete={handleDeleteRelationship}
            isLoggedIn={isLoggedIn}
          />
        )}
      </div>

      {sidebar === 'custom' && isLoggedIn && (
        <CustomOptionsPanel />
      )}
    </div>
    </CanvasContext.Provider>
  );
}
