"use client";

import { useEffect } from "react";
import { scrollProgress, bandForProgress } from "@/lib/beat-mapping";

/**
 * Reveals the hero tree one generation at a time as the reader scrolls.
 *
 * Renders nothing. It reaches for elements the server already rendered rather
 * than taking the SVG as a prop, which would duplicate the whole markup into the
 * RSC payload.
 *
 * The staging is opt-in from the DOM's point of view: the tree is fully visible
 * until this effect adds `.dt-staged`. If the bundle fails, JS is off, motion is
 * reduced, or the viewport is small, the reader simply sees the finished house.
 *
 * A rAF-throttled scroll listener rather than IntersectionObserver — the
 * decision logic is a pure function this way (see lib/beat-mapping.ts), and it
 * behaves identically everywhere rather than depending on observer delivery.
 */
export function TreeScrollStager() {
  useEffect(() => {
    const wrapper = document.getElementById("dt-tree");
    if (!wrapper) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 767px)").matches;
    if (reduced || small) return;

    const bands = Array.from(wrapper.querySelectorAll<SVGGElement>(".dt-gen"));
    const beats = Array.from(document.querySelectorAll<HTMLElement>("[data-beat]"));
    if (bands.length === 0 || beats.length === 0) return;

    wrapper.classList.add("dt-staged");

    // Per-stage framing, precomputed on the server (see lib/landing-tree.ts).
    const fitLayer = wrapper.querySelector<SVGGElement>(".dt-fit");
    const fits = fitLayer?.dataset.fit?.split("|") ?? [];

    // Bidirectional: the band follows scroll position in both directions, so
    // scrolling back up un-grows the house rather than leaving it finished.
    let current = -1;
    const show = (deepest: number) => {
      if (deepest === current) return;
      current = deepest;
      bands.forEach((band, i) => {
        band.dataset.visible = i <= deepest ? "true" : "false";
      });
      // CSS transform rather than the SVG attribute — the attribute cannot be
      // transitioned, and the view pulling back is most of the effect.
      if (fitLayer && fits[deepest]) fitLayer.style.transform = fits[deepest];
    };

    const first = beats[0];
    const last = beats[beats.length - 1];

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const progress = scrollProgress(
          first.getBoundingClientRect().top,
          last.getBoundingClientRect().bottom,
          window.innerHeight,
        );
        show(bandForProgress(progress, bands.length));
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
