"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type NodeChange,
  type EdgeChange,
  type EdgeRemoveChange,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from "@xyflow/react";
import { toast } from "sonner";
import { CharacterNode } from "./CharacterNode";
import { RelationshipEdge } from "./RelationshipEdge";
import { Toolbar } from "./Toolbar";
import { AddRelativeHint } from "./AddRelativeHint";
import { GenerationBands } from "./GenerationBands";
import { CanvasContext } from "./CanvasContext";
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
import { HighlightContext } from './HighlightContext';
import { useBloodlineHighlight } from './useBloodlineHighlight';
import { useFitTree } from './useFitTree';
import { useCanvasSettled } from './useCanvasSettled';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CanvasLegend } from './CanvasLegend';
import { ZoomControls } from './ZoomControls';
import { IdentityChip } from './IdentityChip';
import { Inspector, type InspectorMode } from './Inspector';
import { computeAddRelative, computeRemoveRelative, computeDeleteCharacter, partnerUnionsOf, type AddRelativeInput, type RelativeKind } from '@/lib/relative-ops';
import { triggerJsonDownload, exportCanvasToPng } from "@/lib/export";
import { exportDynasty, replaceDynastyFromExport } from "@/app/actions/dynasty";
import { parseImportFile } from "@/lib/import-canvas";

const nodeTypes = { character: CharacterNode, union: UnionNode } as const;
const edgeTypes = { relationship: RelationshipEdge } as const;

function getFriendlyErrorMessage(err: any): string {
  if (typeof window !== "undefined" && !navigator.onLine) {
    return "Network disconnected. Please check your internet connection.";
  }
  
  const msg = err?.message || "";
  
  // Rate limit check
  if (msg.includes("Too many requests") || msg.includes("Slow down")) {
    return "Too many requests. Please slow down and try again.";
  }
  
  // Rule or validation breaks
  if (
    msg.includes("not found") || 
    msg.includes("invalid") || 
    msg.includes("rule") ||
    msg.includes("validation") ||
    msg.includes("limit") ||
    msg.includes("restrict")
  ) {
    return msg;
  }
  
  // General server/masked errors
  if (
    msg.includes("Server Action") || 
    msg.includes("masked") || 
    msg.includes("digest") || 
    !msg
  ) {
    return "Server error. Please try again later.";
  }
  
  return msg;
}

type Props = {
  dynastyId: string;
  dynastyName: string;
  crestSeed: string;
  initialNodes: CharacterNodeType[];
  initialEdges: LegacyEdgeType[];
  userId?: string;
  onSaveStatusChange?: (status: 'saved' | 'saving' | 'error', errorReason?: string) => void;
  /** Top-right slot: account state, then the one accent action (design.md §9). */
  topRight?: React.ReactNode;
  /** Trailing top-left tool actions — the settings dialog trigger. */
  toolbarExtra?: React.ReactNode;
};

export function DynastyCanvas({
  dynastyId,
  dynastyName,
  crestSeed,
  initialNodes,
  initialEdges,
  onSaveStatusChange,
  topRight,
  toolbarExtra,
}: Props) {
  const reactFlow = useReactFlow();
  const router = useRouter();
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
  const [relPicker, setRelPicker] = useState<{ anchorId: string; kind: RelativeKind } | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingImport, setPendingImport] = useState<File | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodes: laidOutNodes, rows } = useGenealogyLayout(nodes, edges);
  const { fitTree, bind: fitBind } = useFitTree(laidOutNodes, containerRef);
  const settlingClass = useCanvasSettled();

  const highlight = useBloodlineHighlight(nodes, edges);
  const highlightValue = useMemo(
    () => ({ chars: highlight.chars, edges: highlight.edges, pinned: highlight.pinned, onUnionHover: highlight.onUnionHover }),
    [highlight.chars, highlight.edges, highlight.pinned, highlight.onUnionHover],
  );

  const performSave = useCallback(
    async <T,>(action: () => Promise<T>, successMessage?: string, errorMessage?: string): Promise<T> => {
      setPendingCount((c) => c + 1);
      onSaveStatusChange?.('saving');
      try {
        const res = await action();
        setPendingCount((c) => {
          const nextCount = c - 1;
          if (nextCount === 0) {
            onSaveStatusChange?.('saved');
          }
          return nextCount;
        });
        if (successMessage) {
          toast.success(successMessage);
        }
        return res;
      } catch (err) {
        const friendlyError = getFriendlyErrorMessage(err);
        setPendingCount((c) => {
          const nextCount = c - 1;
          onSaveStatusChange?.('error', friendlyError);
          return nextCount;
        });
        if (errorMessage) {
          toast.error(`${errorMessage}: ${friendlyError}`);
        } else {
          toast.error(`Failed to save: ${friendlyError}`);
        }
        throw err;
      }
    },
    [onSaveStatusChange]
  );

  const characterNodes = useMemo(
    () => nodes.filter((n): n is CharacterNodeType => n.type === 'character'),
    [nodes]
  );
  const editingCharacter = useMemo(
    () => characterNodes.find((n) => n.id === editingCharacterId),
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
      const anchor = characterNodes.find((n) => n.id === relPicker.anchorId);
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
  }, []);

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
  }, []);

  const openCreate = useCallback(() => {
    setRelPicker(null);
    setEditingCharacterId(null);
    setAddCharacterOpen(true);
  }, []);

  /** The panel kept an unsaved draft; put our state back to match it. */
  const restoreInspectorMode = useCallback((m: InspectorMode) => {
    if (m.kind === 'edit') { openEdit(m.character.id); return; }
    if (m.kind === 'create') { openCreate(); return; }
    setAddCharacterOpen(false);
    setRelPicker({ anchorId: m.anchor.id, kind: m.relative });
  }, [openEdit, openCreate]);

  const onNodesChange = useCallback(
    (changes: NodeChange<AnyCanvasNode>[]) => {
      const isRemove = (c: NodeChange<AnyCanvasNode>): c is NodeChange<AnyCanvasNode> & { type: 'remove' } => c.type === 'remove';
      const removeIds = changes.filter(isRemove).map((c) => c.id);

      if (removeIds.length === 0) {
        setNodes((nds) => applyNodeChanges(changes, nds) as AnyCanvasNode[]);
        return;
      }

      const characterIds = removeIds.filter(id => {
        const node = nodes.find(n => n.id === id);
        return node && node.type === 'character';
      });

      if (characterIds.length === 0) {
        setNodes((nds) => applyNodeChanges(changes, nds) as AnyCanvasNode[]);
        return;
      }

      const prevNodes = nodes;
      const prevEdges = edges;

      let nextNodes = nodes;
      let nextEdges = edges;
      for (const id of characterIds) {
        const res = computeDeleteCharacter(nextNodes, nextEdges, id);
        nextNodes = res.nodes;
        nextEdges = res.edges;
      }
      nextNodes = nextNodes.filter((n) => !removeIds.includes(n.id));

      setNodes(nextNodes);
      setEdges(nextEdges);

      performSave(
        () => Promise.all(characterIds.map((id) => deleteCharacter(id, dynastyId))),
        characterIds.length === 1 ? 'Character removed' : 'Characters removed',
        'Failed to delete — reverted'
      ).catch(() => {
        setNodes(prevNodes);
        setEdges(prevEdges);
      });
    },
    [nodes, edges, dynastyId, performSave]
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

      const selectedNodeIds = new Set(nodes.filter((n) => n.selected && n.type === 'character').map((n) => n.id));
      const removedEdges = edges.filter((e) => removeIds.includes(e.id));
      const isSideEffect = removedEdges.some((e) => selectedNodeIds.has(e.source) || selectedNodeIds.has(e.target));

      if (isSideEffect) {
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
        performSave(
          () => deleteRelativeEdges(dynastyId, result.pairEdges),
          'Relationships updated',
          'Failed to delete — reverted'
        ).catch(() => {
          setNodes(prevNodes);
          setEdges(prevEdges);
        });
      }
    },
    [nodes, edges, dynastyId, performSave]
  );

  const handleAddCharacter = useCallback(
    async (data: CharacterData) => {
      const tempId = crypto.randomUUID();
      setNodes((nds) => [...nds, { id: tempId, type: "character", position: { x: 0, y: 0 }, data }]);
      setAddCharacterOpen(false);
      try {
        const { id } = await performSave(
          () => createCharacter(dynastyId, data, { x: 0, y: 0 }),
          `${data.name} added to the dynasty`,
          "Failed to save character"
        );
        setNodes((nds) => nds.map((n) => (n.id === tempId ? { ...n, id } : n)));
      } catch {
        setNodes((nds) => nds.filter((n) => n.id !== tempId));
      }
    },
    [dynastyId, performSave]
  );

  const handleUpdateCharacter = useCallback(
    async (data: CharacterData) => {
      if (!editingCharacterId) return;
      const id = editingCharacterId;
      const prevNodes = nodes;
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
      );
      // The selection survives a save: the editor is the inspector now, not a
      // modal that closes behind you. Delete still clears it — see below.

      try {
        await performSave(
          () => updateCharacter(id, dynastyId, data),
          "Changes saved",
          "Failed to save changes"
        );
      } catch {
        setNodes(prevNodes);
      }
    },
    [editingCharacterId, dynastyId, nodes, performSave]
  );

  const handleDeleteCharacter = useCallback(async () => {
    if (!editingCharacterId) return;
    const id = editingCharacterId;
    const prevNodes = nodes;
    const prevEdges = edges;

    const { nodes: nextNodes, edges: nextEdges } = computeDeleteCharacter(nodes, edges, id);

    setNodes(nextNodes);
    setEdges(nextEdges);
    setEditingCharacterId(null);

    try {
      await performSave(
        () => deleteCharacter(id, dynastyId),
        "Character removed",
        "Failed to delete character"
      );
    } catch {
      setNodes(prevNodes);
      setEdges(prevEdges);
    }
  }, [editingCharacterId, dynastyId, nodes, edges, performSave]);

  const openAddRelative = useCallback((anchorId: string, kind: RelativeKind) => {
    setAddCharacterOpen(false);
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
      const { id: realId } = await performSave(
        () => addRelative(dynastyId, input.person, result.pairEdges),
        'Added to the tree',
        'Failed to save — reverted'
      );
      if (realId !== result.personId) {
        const remap = (v: string) => (v === result.personId ? realId : v);
        setNodes(nds => nds.map(n => (n.id === result.personId ? { ...n, id: realId } : n)));
        setEdges(eds => eds.map(e => ({ ...e, source: remap(e.source), target: remap(e.target) })));
      }
    } catch {
      setNodes(prevNodes);
      setEdges(prevEdges);
    }
  }, [nodes, edges, dynastyId, performSave]);

  const handleExport = useCallback(async () => {
    await exportCanvasToPng(reactFlow, containerRef, dynastyName);
  }, [reactFlow, dynastyName]);

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

  const runImport = useCallback(async (file: File) => {
    try {
      const raw = await file.text();
      const data = parseImportFile(raw);
      const result = await replaceDynastyFromExport(dynastyId, data);
      const migrated = migrateCanvas(result.nodes as never, result.edges as never);
      setNodes(migrated.nodes as AnyCanvasNode[]);
      setEdges(migrated.edges);
      setEditingCharacterId(null);
      // The header, crest, and band label are server-rendered from the dynasty
      // row, which the import just rewrote.
      router.refresh();
      toast.success('Imported dynasty tree');
    } catch {
      toast.error("Couldn't read that file — is it a Dynasty Tree export?");
    }
  }, [dynastyId, router]);

  // Importing is destructive and hits the database, so it asks first — holding
  // the chosen file until the answer comes back rather than blocking on
  // confirm().
  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPendingImport(file);
  }, []);

  return (
    <CanvasContext.Provider value={{ setEditingCharacterId: openEdit, openAddRelative }}>
      <div className="flex h-full w-full">
      <div ref={containerRef} className={`relative flex-1 min-w-0 h-full ${settlingClass}`}>
        <HighlightContext.Provider value={highlightValue}>
        <ReactFlow
          nodes={laidOutNodes}
          edges={edges}
          onNodesChange={onNodesChange as (changes: NodeChange<AnyCanvasNode>[]) => void}
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
          deleteKeyCode={["Backspace", "Delete"]}
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
          <GenerationBands rows={rows} nodes={laidOutNodes} houseName={dynastyName} crestSeed={crestSeed} />
        </ReactFlow>
        <div className="canvas-vignette" aria-hidden="true" />

        {/* Bottom-left slot: zoom, with the legend beneath it (design.md §9).
            One stack, so an expanded legend pushes nothing out of the corner. */}
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
          onToggleGrid={() => setGridVisible((v) => !v)}
          onExport={handleExport}
          onExportJson={handleExportJson}
          onImportJson={handleImportClick}
          onFitView={fitTree}
          extra={toolbarExtra}
        />

        {/* Top-centre: document identity. The stat pair is live because this
            component owns the graph — the retired header could only ever have
            shown the server-rendered count. */}
        <IdentityChip
          name={dynastyName}
          crestSeed={crestSeed}
          stats={`${characterNodes.length} · ${rows.length} gen`}
          backHref="/dashboard"
          backLabel="Back to your dynasties"
        />

        {topRight && (
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
            {topRight}
          </div>
        )}

        <ConfirmDialog
          open={pendingImport !== null}
          onOpenChange={(open) => { if (!open) setPendingImport(null); }}
          title={`Replace "${dynastyName}"?`}
          description="Importing a file permanently replaces every character and relationship in this dynasty. This cannot be undone."
          confirmLabel="Replace dynasty"
          destructive
          onConfirm={() => { const f = pendingImport; setPendingImport(null); if (f) void runImport(f); }}
        />

        {characterNodes.length === 0 && (
          <CanvasEmptyState onAddCharacter={openCreate} onImportJson={handleImportClick} />
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
            onDelete={() => void handleDeleteCharacter()}
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
