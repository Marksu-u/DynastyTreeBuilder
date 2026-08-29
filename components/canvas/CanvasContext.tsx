"use client";

import { createContext, useContext } from 'react';

export interface CanvasContextType {
  setEditingCharacterId: (id: string | null) => void;
  openAddRelative?: (anchorId: string, kind: 'partner' | 'child' | 'parent') => void;
}

export const CanvasContext = createContext<CanvasContextType | null>(null);

export function useCanvasContext() {
  return useContext(CanvasContext);
}
