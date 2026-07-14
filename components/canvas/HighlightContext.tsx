"use client";

import { createContext, useContext } from 'react';

export interface HighlightContextValue {
  /** null = nothing hovered; otherwise the set of character ids in the active bloodline */
  activeCharIds: Set<string> | null;
  /** null = nothing hovered; otherwise the set of edge ids in the active bloodline */
  activeEdgeIds: Set<string> | null;
}

export const HighlightContext = createContext<HighlightContextValue>({
  activeCharIds: null,
  activeEdgeIds: null,
});

export function useHighlight() {
  return useContext(HighlightContext);
}
