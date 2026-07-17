// store/canvas.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  Node, Edge, NodeChange, EdgeChange,
  applyNodeChanges, applyEdgeChanges,
} from '@xyflow/react';
import type { CharacterData, RelationshipData, UnionData, LegacyRelationshipType } from '@/types/canvas';
import { migrateCanvas } from '@/lib/migrate-canvas';
import { computeAddRelative, computeDeleteCharacter, computeRemoveRelative, type AddRelativeInput } from '@/lib/relative-ops';

export type CharacterNodeType = Node<CharacterData, 'character'>;
export type UnionNodeType = Node<UnionData, 'union'>;
export type AnyCanvasNode = CharacterNodeType | UnionNodeType;
export type RelationshipEdgeType = Edge<RelationshipData, 'relationship'>;
/** Edge type used at server→client boundaries before migrateCanvas runs. */
export type LegacyEdgeType = Edge<Omit<RelationshipData, 'type'> & { type: LegacyRelationshipType }, 'relationship'>;

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
  isDirty: boolean;

  onNodesChange: (changes: NodeChange<AnyCanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<RelationshipEdgeType>[]) => void;

  addCharacter: (data: CharacterData, position?: { x: number; y: number }) => void;
  updateCharacter: (id: string, data: Partial<CharacterData>) => void;
  deleteCharacter: (id: string) => void;
  addUnion: (params: AddUnionParams) => void;
  addRelative: (input: AddRelativeInput) => string | null;

  undo: () => void;
  redo: () => void;
  toggleGrid: () => void;
  setEditingCharacterId: (id: string | null) => void;
  initCanvas: (nodes: AnyCanvasNode[], edges: RelationshipEdgeType[]) => void;
  markClean: () => void;
}

const MAX_HISTORY = 50;

function snap(state: Pick<CanvasState, 'nodes' | 'edges'>): Snapshot {
  return { nodes: state.nodes, edges: state.edges };
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
      gridVisible: false,
      editingCharacterId: null,
      isDirty: false,

      onNodesChange: (changes) => {
        const isRemove = (c: NodeChange<AnyCanvasNode>): c is { id: string; type: 'remove' } => c.type === 'remove';
        const removeIds = changes.filter(isRemove).map((c) => c.id);
        const rest = changes.filter((c) => !isRemove(c));

        if (removeIds.length === 0) {
          set({
            nodes: applyNodeChanges(changes, get().nodes) as AnyCanvasNode[],
          });
          return;
        }

        const state = get();
        let nextNodes = state.nodes;
        let nextEdges = state.edges;

        for (const id of removeIds) {
          const node = state.nodes.find(n => n.id === id);
          if (node && node.type === 'character') {
            const res = computeDeleteCharacter(nextNodes, nextEdges, id);
            nextNodes = res.nodes;
            nextEdges = res.edges;
          } else {
            nextNodes = nextNodes.filter(n => n.id !== id);
          }
        }

        set({
          nodes: applyNodeChanges(rest, nextNodes) as AnyCanvasNode[],
          edges: nextEdges,
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [],
          isDirty: true,
        });
      },

      onEdgesChange: (changes) => {
        const isRemove = (c: EdgeChange<RelationshipEdgeType>): c is { id: string; type: 'remove' } => c.type === 'remove';
        const removeIds = changes.filter(isRemove).map((c) => c.id);
        const rest = changes.filter((c) => !isRemove(c));

        if (removeIds.length === 0) {
          set({
            edges: applyEdgeChanges(changes, get().edges) as RelationshipEdgeType[],
          });
          return;
        }

        const state = get();
        const selectedNodeIds = new Set(state.nodes.filter((n) => n.selected && n.type === 'character').map((n) => n.id));
        const removedEdges = state.edges.filter((e) => removeIds.includes(e.id));
        const isSideEffect = removedEdges.some((e) => selectedNodeIds.has(e.source) || selectedNodeIds.has(e.target));

        if (isSideEffect) {
          set({
            edges: applyEdgeChanges(changes, state.edges) as RelationshipEdgeType[],
          });
          return;
        }

        const result = computeRemoveRelative(state.nodes, state.edges, removeIds);
        if (!result.ok) {
          return;
        }

        set({
          nodes: result.nodes,
          edges: applyEdgeChanges(rest, result.edges) as RelationshipEdgeType[],
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [],
          isDirty: true,
        });
      },

      addCharacter: (data, position) => {
        const state = get();
        const newNode: CharacterNodeType = {
          id: crypto.randomUUID(), type: 'character',
          position: position ?? { x: 0, y: 0 }, data,
        };
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
        const { nodes: newNodes, edges: newEdges } = computeDeleteCharacter(state.nodes, state.edges, id);
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

      addRelative: (input) => {
        const state = get();
        const result = computeAddRelative(state.nodes, state.edges, input);
        if (!result.ok) return result.error;
        set({
          nodes: result.nodes, edges: result.edges,
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [], isDirty: true,
        });
        return null;
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
