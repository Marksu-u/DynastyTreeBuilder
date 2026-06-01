// store/canvas.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  Node, Edge, Connection, NodeChange, EdgeChange,
  applyNodeChanges, applyEdgeChanges,
} from '@xyflow/react';
import type { CharacterData, RelationshipData, UnionData } from '@/types/canvas';
import { migrateCanvas } from '@/lib/migrate-canvas';
import { tidyTree } from '@/lib/tidy-tree';

export type CharacterNodeType = Node<CharacterData, 'character'>;
export type UnionNodeType = Node<UnionData, 'union'>;
export type AnyCanvasNode = CharacterNodeType | UnionNodeType;
export type RelationshipEdgeType = Edge<RelationshipData, 'relationship'>;

type Snapshot = { nodes: AnyCanvasNode[]; edges: RelationshipEdgeType[] };

interface AddUnionParams {
  parentIds: string[];    // 1–2 character IDs
  childIds: string[];     // biological children IDs
  adoptedIds: string[];   // adopted children IDs
}

interface CanvasState {
  nodes: AnyCanvasNode[];
  edges: RelationshipEdgeType[];
  past: Snapshot[];
  future: Snapshot[];
  gridVisible: boolean;
  editingCharacterId: string | null;
  editingEdgeId: string | null;
  isDirty: boolean;

  onNodesChange: (changes: NodeChange<AnyCanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<RelationshipEdgeType>[]) => void;
  onConnect: (connection: Connection) => void;

  addCharacter: (data: CharacterData, position?: { x: number; y: number }) => void;
  updateCharacter: (id: string, data: Partial<CharacterData>) => void;
  deleteCharacter: (id: string) => void;
  addUnion: (params: AddUnionParams) => void;
  updateRelationship: (id: string, data: Partial<RelationshipData>) => void;
  deleteRelationship: (id: string) => void;
  tidyTree: () => void;

  undo: () => void;
  redo: () => void;
  toggleGrid: () => void;
  setEditingCharacterId: (id: string | null) => void;
  setEditingEdgeId: (id: string | null) => void;
  initCanvas: (nodes: AnyCanvasNode[], edges: RelationshipEdgeType[]) => void;
  markClean: () => void;
}

const MAX_HISTORY = 50;

function snap(state: Pick<CanvasState, 'nodes' | 'edges'>): Snapshot {
  return { nodes: state.nodes, edges: state.edges };
}

function recalcUnionPositions(
  nodes: AnyCanvasNode[],
  edges: RelationshipEdgeType[],
): AnyCanvasNode[] {
  return nodes.map(node => {
    if (node.type !== 'union') return node;
    const partnerEdges = edges.filter(e => e.target === node.id && e.data?.type === 'PARTNER');
    const parents = partnerEdges
      .map(e => nodes.find(n => n.id === e.source))
      .filter((n): n is AnyCanvasNode => !!n);
    if (parents.length === 0) return node;
    if (parents.length === 1) {
      return { ...node, position: { x: parents[0].position.x, y: parents[0].position.y + 80 } };
    }
    return {
      ...node,
      position: {
        x: (parents[0].position.x + parents[1].position.x) / 2,
        y: Math.max(parents[0].position.y, parents[1].position.y) + 40,
      },
    };
  });
}

const safeStorage = {
  getItem: (name: string) => (typeof window === 'undefined' ? null : localStorage.getItem(name)),
  setItem: (name: string, value: string) => { if (typeof window !== 'undefined') localStorage.setItem(name, value); },
  removeItem: (name: string) => { if (typeof window !== 'undefined') localStorage.removeItem(name); },
};

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      past: [],
      future: [],
      gridVisible: true,
      editingCharacterId: null,
      editingEdgeId: null,
      isDirty: false,

      onNodesChange: (changes) => {
        const hasPositionChange = changes.some(c => c.type === 'position' || c.type === 'remove');
        const newNodes = applyNodeChanges(changes, get().nodes) as AnyCanvasNode[];
        const finalNodes = recalcUnionPositions(newNodes, get().edges);
        set({ nodes: finalNodes, ...(hasPositionChange ? { isDirty: true } : {}) });
      },

      onEdgesChange: (changes) => {
        const hasRemoval = changes.some(c => c.type === 'remove');
        set({
          edges: applyEdgeChanges(changes, get().edges) as RelationshipEdgeType[],
          ...(hasRemoval ? { isDirty: true } : {}),
        });
      },

      // onConnect is kept for compatibility but the popup intercepts it in TreeCanvas
      onConnect: (connection) => {
        const state = get();
        const newEdge: RelationshipEdgeType = {
          id: crypto.randomUUID(), type: 'relationship',
          source: connection.source, target: connection.target,
          sourceHandle: connection.sourceHandle, targetHandle: connection.targetHandle,
          data: { type: 'CHILD', isMutual: false },
        };
        set({
          edges: [...state.edges, newEdge],
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [], isDirty: true,
        });
      },

      addCharacter: (data, position) => {
        const state = get();
        const count = state.nodes.filter(n => n.type === 'character').length;
        const pos = position ?? { x: 80 + (count % 4) * 240, y: 80 + Math.floor(count / 4) * 200 };
        const newNode: CharacterNodeType = { id: crypto.randomUUID(), type: 'character', position: pos, data };
        set({
          nodes: [...state.nodes, newNode],
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [], isDirty: true,
        });
      },

      updateCharacter: (id, data) => {
        const state = get();
        set({
          nodes: state.nodes.map(n => n.id === id ? { ...n, data: { ...(n.data as CharacterData), ...data } } : n) as AnyCanvasNode[],
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [], editingCharacterId: null, isDirty: true,
        });
      },

      deleteCharacter: (id) => {
        const state = get();
        const newEdges = state.edges.filter(e => e.source !== id && e.target !== id);
        // Remove orphaned union nodes (unions with no remaining partners or children)
        const referencedUnions = new Set(newEdges.flatMap(e => [e.source, e.target]));
        const newNodes = state.nodes.filter(n => n.type !== 'union' || referencedUnions.has(n.id))
          .filter(n => n.id !== id);
        set({
          nodes: newNodes, edges: newEdges,
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [], editingCharacterId: null, isDirty: true,
        });
      },

      addUnion: ({ parentIds, childIds, adoptedIds }) => {
        const state = get();
        const parents = parentIds.map(id => state.nodes.find(n => n.id === id)).filter(Boolean) as AnyCanvasNode[];
        if (parents.length === 0) return;

        const unionId = crypto.randomUUID();
        let unionPos: { x: number; y: number };
        if (parents.length === 1) {
          unionPos = { x: parents[0].position.x, y: parents[0].position.y + 80 };
        } else {
          unionPos = {
            x: (parents[0].position.x + parents[1].position.x) / 2,
            y: Math.max(parents[0].position.y, parents[1].position.y) + 40,
          };
        }

        const unionNode: UnionNodeType = { id: unionId, type: 'union', position: unionPos, data: {} };
        const newEdges: RelationshipEdgeType[] = [
          ...parentIds.map(pid => ({
            id: crypto.randomUUID(), type: 'relationship' as const,
            source: pid, target: unionId,
            data: { type: 'PARTNER' as const, isMutual: false },
          })),
          ...childIds.map(cid => ({
            id: crypto.randomUUID(), type: 'relationship' as const,
            source: unionId, target: cid,
            data: { type: 'CHILD' as const, isMutual: false },
          })),
          ...adoptedIds.map(cid => ({
            id: crypto.randomUUID(), type: 'relationship' as const,
            source: unionId, target: cid,
            data: { type: 'ADOPTED_CHILD' as const, isMutual: false },
          })),
        ];

        set({
          nodes: [...state.nodes, unionNode],
          edges: [...state.edges, ...newEdges],
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [], isDirty: true,
        });
      },

      updateRelationship: (id, data) => {
        const state = get();
        set({
          edges: state.edges.map(e =>
            e.id === id ? { ...e, data: { ...e.data, ...data } as RelationshipData } : e
          ),
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [], editingEdgeId: null, isDirty: true,
        });
      },

      deleteRelationship: (id) => {
        const state = get();
        set({
          edges: state.edges.filter(e => e.id !== id),
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [], editingEdgeId: null, isDirty: true,
        });
      },

      tidyTree: () => {
        const state = get();
        const positions = tidyTree(state.nodes, state.edges as never);
        const newNodes = state.nodes.map(n =>
          n.type === 'character' && positions[n.id]
            ? { ...n, position: positions[n.id] }
            : n
        );
        const finalNodes = recalcUnionPositions(newNodes, state.edges);
        set({
          nodes: finalNodes,
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [], isDirty: true,
        });
      },

      undo: () => {
        const { past, nodes, edges, future } = get();
        if (past.length === 0) return;
        const prev = past[past.length - 1];
        set({ nodes: prev.nodes, edges: prev.edges, past: past.slice(0, -1), future: [{ nodes, edges }, ...future].slice(0, MAX_HISTORY) });
      },

      redo: () => {
        const { future, nodes, edges, past } = get();
        if (future.length === 0) return;
        const next = future[0];
        set({ nodes: next.nodes, edges: next.edges, past: [...past, { nodes, edges }].slice(-MAX_HISTORY), future: future.slice(1) });
      },

      toggleGrid: () => set(s => ({ gridVisible: !s.gridVisible })),
      setEditingCharacterId: (id) => set({ editingCharacterId: id }),
      setEditingEdgeId: (id) => set({ editingEdgeId: id }),

      initCanvas: (nodes, edges) => {
        const migrated = migrateCanvas(nodes as never, edges);
        set({ nodes: migrated.nodes as AnyCanvasNode[], edges: migrated.edges, past: [], future: [], isDirty: false });
      },

      markClean: () => set({ isDirty: false }),
    }),
    {
      name: 'dynasty-tree-guest',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges, gridVisible: state.gridVisible }),
    }
  )
);
