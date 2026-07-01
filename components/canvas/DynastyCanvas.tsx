"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  type NodeChange,
  type EdgeChange,
  type Connection,
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
  updatePosition,
} from "@/app/actions/character";
import {
  createRelationship,
  updateRelationship,
  deleteRelationship,
} from "@/app/actions/relationship";
import type { CharacterData, RelationshipData } from "@/types/canvas";
import type { CharacterNodeType, RelationshipEdgeType, LegacyEdgeType } from "@/store/canvas";
import { CanvasEmptyState } from "@/components/canvas/CanvasEmptyState";
import { UnionNode } from './UnionNode';
import { ConnectionPopup } from './ConnectionPopup';
import type { UnionNodeType, AnyCanvasNode } from '@/store/canvas';
import { migrateCanvas } from '@/lib/migrate-canvas';
import { tidyTree } from '@/lib/tidy-tree';
import { createFamily } from '@/app/actions/relationship';

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
  const [pendingConnection, setPendingConnection] = useState<{ source: string; target: string; screenX: number; screenY: number } | null>(null);
  const [gridVisible, setGridVisible] = useState(true);
  const [addCharacterOpen, setAddCharacterOpen] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState<SidebarPanel | null>(null);
  const positionTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds) as AnyCanvasNode[];
        return recalcUnions(updated, edges);
      });

      for (const change of changes) {
        if (change.type !== 'position' || change.dragging !== false || !change.position) continue;
        const node = nodes.find(n => n.id === change.id);
        if (!node || node.type !== 'character') continue;
        const { id, position } = change;
        clearTimeout(positionTimers.current[id]);
        positionTimers.current[id] = setTimeout(() => {
          updatePosition(id, dynastyId, position.x, position.y).catch(() => {});
        }, 500);
      }
    },
    [dynastyId, edges, nodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<RelationshipEdgeType>[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds) as RelationshipEdgeType[]);
    },
    []
  );

  const handleConnect = useCallback((connection: Connection) => {
    const containerRect = document.querySelector('.react-flow')?.getBoundingClientRect();
    setPendingConnection({
      source: connection.source,
      target: connection.target,
      screenX: containerRect ? containerRect.left + containerRect.width / 2 : window.innerWidth / 2,
      screenY: containerRect ? containerRect.top + containerRect.height / 2 : window.innerHeight / 2,
    });
  }, []);

  const handleConnectionChoice = useCallback(async (choice: 'partner' | 'child' | 'adopted') => {
    if (!pendingConnection) return;
    const { source, target } = pendingConnection;
    setPendingConnection(null);

    const parentIds = choice === 'partner' ? [source, target] : [source];
    const childIds = choice === 'child' ? [target] : [];
    const adoptedIds = choice === 'adopted' ? [target] : [];

    const unionId = crypto.randomUUID();
    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);
    if (!sourceNode) return;

    const unionPos = choice === 'partner' && targetNode
      ? { x: (sourceNode.position.x + targetNode.position.x) / 2, y: Math.max(sourceNode.position.y, targetNode.position.y) + 40 }
      : { x: sourceNode.position.x, y: sourceNode.position.y + 80 };

    const unionNode: UnionNodeType = { id: unionId, type: 'union', position: unionPos, data: {} };
    const newEdges: RelationshipEdgeType[] = [
      ...parentIds.map(pid => ({ id: crypto.randomUUID(), type: 'relationship' as const, source: pid, target: unionId, data: { type: 'PARTNER' as const, isMutual: false } })),
      ...childIds.map(cid => ({ id: crypto.randomUUID(), type: 'relationship' as const, source: unionId, target: cid, data: { type: 'CHILD' as const, isMutual: false } })),
      ...adoptedIds.map(cid => ({ id: crypto.randomUUID(), type: 'relationship' as const, source: unionId, target: cid, data: { type: 'ADOPTED_CHILD' as const, isMutual: false } })),
    ];

    setNodes(nds => [...nds, unionNode]);
    setEdges(eds => [...eds, ...newEdges]);

    try {
      await createFamily(dynastyId, parentIds, childIds, adoptedIds);
      toast.success('Family link saved');
    } catch {
      setNodes(nds => nds.filter(n => n.id !== unionId));
      setEdges(eds => eds.filter(e => !newEdges.some(ne => ne.id === e.id)));
      toast.error('Failed to save family link');
    }
  }, [pendingConnection, nodes, dynastyId]);

  const handleTidyTree = useCallback(() => {
    setNodes(nds => {
      const positions = tidyTree(nds as never, edges as never);
      const updated = nds.map(n => n.type === 'character' && positions[n.id] ? { ...n, position: positions[n.id] } : n);
      return recalcUnions(updated, edges);
    });
  }, [edges]);

  const handleAddCharacter = useCallback(
    async (data: CharacterData) => {
      const count = nodes.filter(n => n.type === 'character').length;
      const position = {
        x: 80 + (count % 4) * 240,
        y: 80 + Math.floor(count / 4) * 200,
      };
      const tempId = crypto.randomUUID();

      setNodes((nds) => [
        ...nds,
        { id: tempId, type: "character", position, data },
      ]);

      try {
        const { id } = await createCharacter(dynastyId, data, position);
        setNodes((nds) => nds.map((n) => (n.id === tempId ? { ...n, id } : n)));
        toast.success(`${data.name} added to the dynasty`);
      } catch {
        setNodes((nds) => nds.filter((n) => n.id !== tempId));
        toast.error("Failed to save character");
      }
    },
    [dynastyId, nodes.length]
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

  function recalcUnions(ns: AnyCanvasNode[], es: RelationshipEdgeType[]): AnyCanvasNode[] {
    return ns.map(node => {
      if (node.type !== 'union') return node;
      const partnerEdges = es.filter(e => e.target === node.id && e.data?.type === 'PARTNER');
      const parents = partnerEdges.map(e => ns.find(n => n.id === e.source)).filter(Boolean) as AnyCanvasNode[];
      if (parents.length === 0) return node;
      if (parents.length === 1) return { ...node, position: { x: parents[0].position.x, y: parents[0].position.y + 80 } };
      return { ...node, position: {
        x: (parents[0].position.x + parents[1].position.x) / 2,
        y: Math.max(parents[0].position.y, parents[1].position.y) + 40,
      }};
    });
  }

  return (
    <CanvasContext.Provider value={{ setEditingCharacterId }}>
      <div className="flex h-full w-full">
      <div className="relative flex-1 min-w-0 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange as (changes: NodeChange<AnyCanvasNode>[]) => void}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={["Backspace", "Delete"]}
          className="bg-zinc-950"
          proOptions={{ hideAttribution: false }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
          snapToGrid={gridVisible}
          snapGrid={[20, 20]}
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

          {pendingConnection && (
            <ConnectionPopup
              x={pendingConnection.screenX}
              y={pendingConnection.screenY}
              onSelect={handleConnectionChoice}
              onDismiss={() => setPendingConnection(null)}
            />
          )}

        <Toolbar
          onAddCharacter={() => setAddCharacterOpen(true)}
          onTidyTree={handleTidyTree}
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
