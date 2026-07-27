"use client";

import { useEffect, useState } from 'react';

/**
 * Returns a class name that suppresses per-node entrance animation while the
 * canvas is first populating.
 *
 * Without it, opening an existing tree fires one animation per card — thirty at
 * once on the example dynasty, potentially hundreds on a large house — which is
 * both a jank risk and the "animate everything" anti-pattern. The entrance is
 * meant to mark the single card a user just created, so it stays switched off
 * until the initial batch has mounted.
 */
export function useCanvasSettled(): string {
  const [settling, setSettling] = useState(true);

  useEffect(() => {
    // Two frames covers mount + React Flow's first measured layout pass; the
    // timeout is the backstop if the tab is backgrounded and frames never run.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setSettling(false));
    });
    const timer = setTimeout(() => setSettling(false), 400);
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      clearTimeout(timer);
    };
  }, []);

  return settling ? 'canvas-settling' : '';
}
