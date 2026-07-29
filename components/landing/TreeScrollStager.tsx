"use client";

import { useEffect } from "react";
import { activeBeat, bandForBeat } from "@/lib/beat-mapping";

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

    // Two generations at rest: a single row of founders reads as an empty page
    // rather than as a family tree.
    const START = Math.min(1, bands.length - 1);

    // Monotonic: once a generation is revealed it stays. Re-hiding on scroll-up
    // reads as flicker rather than as the house un-growing.
    let high = START;
    const show = (upTo: number) => {
      if (upTo <= high) return;
      high = upTo;
      bands.forEach((band, i) => {
        band.dataset.visible = i <= high ? "true" : "false";
      });
    };

    bands.forEach((band, i) => {
      band.dataset.visible = i <= START ? "true" : "false";
    });

    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const tops = beats.map((el) => el.getBoundingClientRect().top);
        const beat = activeBeat(tops, window.innerHeight);
        show(bandForBeat(beat, beats.length, bands.length, START));
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
