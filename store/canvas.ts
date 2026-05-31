import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import type { CharacterData, RelationshipData } from '@/types/canvas';

export type CharacterNodeType = Node<CharacterData, 'character'>;
export type RelationshipEdgeType = Edge<RelationshipData, 'relationship'>;

type Snapshot = { nodes: CharacterNodeType[]; edges: RelationshipEdgeType[] };

interface CanvasState {
  nodes: CharacterNodeType[];
  edges: RelationshipEdgeType[];
  past: Snapshot[];
  future: Snapshot[];
  gridVisible: boolean;
  editingCharacterId: string | null;
  editingEdgeId: string | null;
  isDirty: boolean;

  onNodesChange: (changes: NodeChange<CharacterNodeType>[]) => void;
  onEdgesChange: (changes: EdgeChange<RelationshipEdgeType>[]) => void;
  onConnect: (connection: Connection) => void;

  addCharacter: (data: CharacterData, position?: { x: number; y: number }) => void;
  updateCharacter: (id: string, data: Partial<CharacterData>) => void;
  deleteCharacter: (id: string) => void;
  updateRelationship: (id: string, data: Partial<RelationshipData>) => void;
  deleteRelationship: (id: string) => void;

  undo: () => void;
  redo: () => void;

  toggleGrid: () => void;
  setEditingCharacterId: (id: string | null) => void;
  setEditingEdgeId: (id: string | null) => void;

  initCanvas: (nodes: CharacterNodeType[], edges: RelationshipEdgeType[]) => void;
  markClean: () => void;
}

const MAX_HISTORY = 50;

function snap(state: Pick<CanvasState, 'nodes' | 'edges'>): Snapshot {
  return { nodes: state.nodes, edges: state.edges };
}

// Safe localStorage wrapper for SSR
const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
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
        const hasPositionChange = changes.some(
          (c) => c.type === 'position' || c.type === 'remove'
        );
        set({
          nodes: applyNodeChanges(changes, get().nodes) as CharacterNodeType[],
          ...(hasPositionChange ? { isDirty: true } : {}),
        });
      },

      onEdgesChange: (changes) => {
        const hasRemoval = changes.some((c) => c.type === 'remove');
        set({
          edges: applyEdgeChanges(changes, get().edges) as RelationshipEdgeType[],
          ...(hasRemoval ? { isDirty: true } : {}),
        });
      },

      onConnect: (connection) => {
        const state = get();
        const newEdge: RelationshipEdgeType = {
          id: crypto.randomUUID(),
          type: 'relationship',
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
          data: { type: 'PARENT', isMutual: false },
        };
        set({
          edges: [...state.edges, newEdge],
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [],
          isDirty: true,
        });
      },

      addCharacter: (data, position) => {
        const state = get();
        const count = state.nodes.length;
        const pos = position ?? {
          x: 80 + (count % 4) * 240,
          y: 80 + Math.floor(count / 4) * 200,
        };
        const newNode: CharacterNodeType = {
          id: crypto.randomUUID(),
          type: 'character',
          position: pos,
          data,
        };
        set({
          nodes: [...state.nodes, newNode],
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [],
          isDirty: true,
        });
      },

      updateCharacter: (id, data) => {
        const state = get();
        set({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...data } } : n
          ),
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [],
          editingCharacterId: null,
          isDirty: true,
        });
      },

      deleteCharacter: (id) => {
        const state = get();
        set({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.source !== id && e.target !== id),
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [],
          editingCharacterId: null,
          isDirty: true,
        });
      },

      updateRelationship: (id, data) => {
        const state = get();
        set({
          edges: state.edges.map((e) =>
            e.id === id ? { ...e, data: { ...e.data, ...data } as RelationshipData } : e
          ),
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [],
          editingEdgeId: null,
          isDirty: true,
        });
      },

      deleteRelationship: (id) => {
        const state = get();
        set({
          edges: state.edges.filter((e) => e.id !== id),
          past: [...state.past.slice(-(MAX_HISTORY - 1)), snap(state)],
          future: [],
          editingEdgeId: null,
          isDirty: true,
        });
      },

      undo: () => {
        const { past, nodes, edges, future } = get();
        if (past.length === 0) return;
        const prev = past[past.length - 1];
        set({
          nodes: prev.nodes,
          edges: prev.edges,
          past: past.slice(0, -1),
          future: [{ nodes, edges }, ...future].slice(0, MAX_HISTORY),
        });
      },

      redo: () => {
        const { future, nodes, edges, past } = get();
        if (future.length === 0) return;
        const next = future[0];
        set({
          nodes: next.nodes,
          edges: next.edges,
          past: [...past, { nodes, edges }].slice(-MAX_HISTORY),
          future: future.slice(1),
        });
      },

      toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),

      setEditingCharacterId: (id) => set({ editingCharacterId: id }),
      setEditingEdgeId: (id) => set({ editingEdgeId: id }),

      initCanvas: (nodes, edges) =>
        set({ nodes, edges, past: [], future: [], isDirty: false }),

      markClean: () => set({ isDirty: false }),
    }),
    {
      name: 'dynasty-tree-guest',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        gridVisible: state.gridVisible,
        // isDirty, past, future, editingCharacterId, editingEdgeId intentionally excluded
      }),
    }
  )
);
