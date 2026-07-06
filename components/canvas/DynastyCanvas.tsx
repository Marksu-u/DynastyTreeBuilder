"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type NodeChange,
  type EdgeChange,
  type EdgeRemoveChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { toast } from "sonner";
import { CharacterNode } from "./CharacterNode";
import { RelationshipEdge } from "./RelationshipEdge";
import { Toolbar, type SidebarPanel } from "./Toolbar";
import { AddCharacterPanel } from "./AddCharacterPanel";
import { AddRelativePanel } from "./AddRelativePanel";
import { AddRelativeHint } from "./AddRelativeHint";
import { GenerationBands } from "./GenerationBands";
import { CanvasContext } from "./CanvasContext";
import { CustomOptionsPanel } from "@/components/name-bank/CustomOptionsPanel";
import {
  createCharacter,
  updateCharacter,
  deleteCharacter,
} from "@/app/actions/character";
import { addRelative, deleteRelativeEdges } from "@/app/actions/relationship";
import type { CharacterData } from "@/types/canvas";
import type { CharacterNodeType, RelationshipEdgeType, LegacyEdgeType } from "@/store/canvas";
import { CanvasEmptyState } from "@/components/canvas/CanvasEmptyState";
import { UnionNode } from './UnionNode';
import type { AnyCanvasNode } from '@/store/canvas';
import { migrateCanvas } from '@/lib/migrate-canvas';
import { useGenealogyLayout } from './useGenealogyLayout';
import { computeAddRelative, computeRemoveRelative, partnerUnionsOf, type AddRelativeInput, type RelativeKind } from '@/lib/relative-ops';
import { toPng } from "html-to-image";
import { triggerJsonDownload } from "@/lib/export";
import { exportDynasty, replaceDynastyFromExport } from "@/app/actions/dynasty";
import { parseImportFile } from "@/lib/import-canvas";

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
  const [gridVisible, setGridVisible] = useState(false);
  const [addCharacterOpen, setAddCharacterOpen] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState<SidebarPanel | null>(null);
  const [relPicker, setRelPicker] = useState<{ anchorId: string; kind: RelativeKind } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodes: laidOutNodes, rows } = useGenealogyLayout(nodes, edges);

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

  const onNodesChange = useCallback(
    (changes: NodeChange<AnyCanvasNode>[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds) as AnyCanvasNode[]);
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<RelationshipEdgeType>[]) => {
      const isRemove = (c: EdgeChange<RelationshipEdgeType>): c is EdgeRemoveChange => c.type === 'remove';
      const removeIds = changes.filter(isRemove).map((c) => c.id);
      const rest = changes.filter((c) => !isRemove(c));

      if (removeIds.length === 0) {
        setEdges((eds) => applyEdgeChanges(changes, eds) as RelationshipEdgeType[]);
        return;
      }

      const result = computeRemoveRelative(nodes, edges, removeIds);
      if (!result.ok) {
        toast.error(result.error);
        setEdges((eds) => applyEdgeChanges(rest, eds) as RelationshipEdgeType[]);
        return;
      }

      const prevNodes = nodes;
      const prevEdges = edges;
      setNodes(result.nodes);
      setEdges(applyEdgeChanges(rest, result.edges) as RelationshipEdgeType[]);

      if (result.pairEdges.length > 0) {
        deleteRelativeEdges(dynastyId, result.pairEdges).catch(() => {
          setNodes(prevNodes);
          setEdges(prevEdges);
          toast.error('Failed to delete — reverted');
        });
      }
    },
    [nodes, edges, dynastyId]
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

  const openAddRelative = useCallback((anchorId: string, kind: RelativeKind) => {
    setRelPicker({ anchorId, kind });
  }, []);

  const handleAddRelative = useCallback(async (input: AddRelativeInput) => {
    const result = computeAddRelative(nodes, edges, input);
    if (!result.ok) {
      toast.error(result.error === 'AMBIGUOUS_UNION' ? 'Pick which partner first' : result.error);
      return;
    }
    setRelPicker(null);

    const prevNodes = nodes;
    const prevEdges = edges;
    setNodes(result.nodes);
    setEdges(result.edges);

    try {
      const { id: realId } = await addRelative(dynastyId, input.person, result.pairEdges);
      if (realId !== result.personId) {
        const remap = (v: string) => (v === result.personId ? realId : v);
        setNodes(nds => nds.map(n => (n.id === result.personId ? { ...n, id: realId } : n)));
        setEdges(eds => eds.map(e => ({ ...e, source: remap(e.source), target: remap(e.target) })));
      }
      toast.success('Added to the tree');
    } catch {
      setNodes(prevNodes);
      setEdges(prevEdges);
      toast.error('Failed to save — reverted');
    }
  }, [nodes, edges, dynastyId]);

  const handleExport = useCallback(async () => {
    const element = containerRef.current?.querySelector<HTMLElement>('.react-flow');
    if (!element) return;
    try {
      const dataUrl = await toPng(element, {
        backgroundColor: '#09090b',
        filter: node => !(node instanceof Element && node.classList.contains('react-flow__panel')),
      });
      const link = document.createElement('a');
      link.download = `${dynastyName}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Exported as PNG');
    } catch { toast.error('Export failed'); }
  }, [dynastyName]);

  const handleExportJson = useCallback(async () => {
    try {
      const data = await exportDynasty(dynastyId);
      triggerJsonDownload(data, `${dynastyName}.json`);
      toast.success('Downloaded as JSON');
    } catch { toast.error('Export failed'); }
  }, [dynastyId, dynastyName]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!window.confirm("Import will permanently replace this dynasty's characters and relationships. Continue?")) {
      return;
    }
    try {
      const raw = await file.text();
      const data = parseImportFile(raw);
      const result = await replaceDynastyFromExport(dynastyId, data);
      const migrated = migrateCanvas(result.nodes as never, result.edges as never);
      setNodes(migrated.nodes as AnyCanvasNode[]);
      setEdges(migrated.edges);
      setEditingCharacterId(null);
      toast.success('Imported dynasty tree');
    } catch {
      toast.error("Couldn't read that file — is it a Dynasty Tree export?");
    }
  }, [dynastyId]);

  return (
    <CanvasContext.Provider value={{ setEditingCharacterId, openAddRelative }}>
      <div className="flex h-full w-full">
      <div ref={containerRef} className="relative flex-1 min-w-0 h-full">
        <ReactFlow
          nodes={laidOutNodes}
          edges={edges}
          onNodesChange={onNodesChange as (changes: NodeChange<AnyCanvasNode>[]) => void}
          onEdgesChange={onEdgesChange}
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
          <GenerationBands rows={rows} nodes={laidOutNodes} houseName={dynastyName} />
        </ReactFlow>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="hidden"
        />

        <Toolbar
          gridVisible={gridVisible}
          onToggleGrid={() => setGridVisible((v) => !v)}
          activeSidebar={sidebar}
          onToggleSidebar={handleToggleSidebar}
          showCustomOptions={isLoggedIn}
          onExport={handleExport}
          onExportJson={handleExportJson}
          onImportJson={handleImportClick}
        />

        {characterNodes.length === 0 && (
          <CanvasEmptyState onAddCharacter={() => setAddCharacterOpen(true)} onImportJson={handleImportClick} />
        )}

        <AddRelativeHint visible={characterNodes.length === 1 && !characterNodes[0].selected} />

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

        {relPicker && (() => {
          const anchor = characterNodes.find((n) => n.id === relPicker.anchorId);
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

      {sidebar === 'custom' && isLoggedIn && (
        <CustomOptionsPanel />
      )}
    </div>
    </CanvasContext.Provider>
  );
}
