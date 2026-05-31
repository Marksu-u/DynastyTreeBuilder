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
import { NameBank } from "@/components/name-bank/NameBank";
import { CanvasContext } from "./CanvasContext";
import { RoleSlots } from "@/components/name-bank/RoleSlots";
import { RelationshipTagsPanel } from "@/components/name-bank/RelationshipTagsPanel";
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
import type { CharacterNodeType, RelationshipEdgeType } from "@/store/canvas";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

const nodeTypes = { character: CharacterNode } as const;
const edgeTypes = { relationship: RelationshipEdge } as const;

type Props = {
  dynastyId: string;
  dynastyName: string;
  initialNodes: CharacterNodeType[];
  initialEdges: RelationshipEdgeType[];
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
  const [nodes, setNodes] = useState<CharacterNodeType[]>(initialNodes);
  const [edges, setEdges] = useState<RelationshipEdgeType[]>(initialEdges);
  const [gridVisible, setGridVisible] = useState(true);
  const [addCharacterOpen, setAddCharacterOpen] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState<SidebarPanel | null>(null);
  const positionTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleToggleSidebar = useCallback((panel: SidebarPanel) => {
    setSidebar((current) => (current === panel ? null : panel));
  }, []);

  const usedNames = useMemo(() => nodes.map((n) => n.data.name), [nodes]);

  const editingCharacter = useMemo(
    () => nodes.find((n) => n.id === editingCharacterId),
    [nodes, editingCharacterId]
  );

  const editingEdge = useMemo(
    () => edges.find((e) => e.id === editingEdgeId) as RelationshipEdgeType | undefined,
    [edges, editingEdgeId]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<CharacterNodeType>[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds) as CharacterNodeType[]);

      for (const change of changes) {
        if (change.type !== "position" || change.dragging !== false || !change.position) continue;
        const { id, position } = change;
        clearTimeout(positionTimers.current[id]);
        positionTimers.current[id] = setTimeout(() => {
          updatePosition(id, dynastyId, position.x, position.y).catch(() => {});
        }, 500);
      }
    },
    [dynastyId]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<RelationshipEdgeType>[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds) as RelationshipEdgeType[]);
    },
    []
  );

  const handleConnect = useCallback(
    async (connection: Connection) => {
      const tempId = crypto.randomUUID();
      const newEdge: RelationshipEdgeType = {
        id: tempId,
        type: "relationship",
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        data: { type: "UNKNOWN", isMutual: false },
      };
      setEdges((eds) => [...eds, newEdge]);

      try {
        const { id } = await createRelationship(dynastyId, connection.source, connection.target, {
          type: "UNKNOWN",
          isMutual: false,
        });
        setEdges((eds) => eds.map((e) => (e.id === tempId ? { ...e, id } : e)));
        toast("Connection created — click the line to set its type", { duration: 3500 });
      } catch {
        setEdges((eds) => eds.filter((e) => e.id !== tempId));
        toast.error("Failed to save connection");
      }
    },
    [dynastyId]
  );

  const handleAddCharacter = useCallback(
    async (data: CharacterData) => {
      const count = nodes.length;
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

  const handleAddFromSidebar = useCallback(
    async (name: string, role: string = "UNKNOWN") => {
      const data: CharacterData = {
        name, role, style: "OTHER", gender: "UNKNOWN", isFounder: false, isLost: false, generation: 0,
      };
      const count = nodes.length;
      const position = { x: 80 + (count % 4) * 240, y: 80 + Math.floor(count / 4) * 200 };
      const tempId = crypto.randomUUID();
      setNodes((nds) => [...nds, { id: tempId, type: "character", position, data }]);
      try {
        const { id } = await createCharacter(dynastyId, data, position);
        setNodes((nds) => nds.map((n) => (n.id === tempId ? { ...n, id } : n)));
        toast.success(`${name} added to the dynasty`);
      } catch {
        setNodes((nds) => nds.filter((n) => n.id !== tempId));
        toast.error("Failed to save character");
      }
    },
    [dynastyId, nodes.length] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <CanvasContext.Provider value={{ setEditingCharacterId }}>
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
          deleteKeyCode={["Backspace", "Delete"]}
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
          onToggleGrid={() => setGridVisible((v) => !v)}
          activeSidebar={sidebar}
          onToggleSidebar={handleToggleSidebar}
          showCustomOptions={isLoggedIn}
        />

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60">
            <EmptyState
              icon={Users}
              title="Your canvas is empty"
              description="Add your first character to start building the dynasty tree."
              action={
                <button
                  onClick={() => setAddCharacterOpen(true)}
                  className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
                >
                  Add Character
                </button>
              }
            />
          </div>
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

      {sidebar === 'names' && (
        <NameBank
          usedNames={usedNames}
          onAddToCanvas={(name) => handleAddFromSidebar(name)}
          isLoggedIn={isLoggedIn}
        />
      )}
      {sidebar === 'roles' && (
        <RoleSlots onAddToCanvas={handleAddFromSidebar} />
      )}
      {sidebar === 'tags' && (
        <RelationshipTagsPanel />
      )}
      {sidebar === 'custom' && isLoggedIn && (
        <CustomOptionsPanel />
      )}
    </div>
    </CanvasContext.Provider>
  );
}
