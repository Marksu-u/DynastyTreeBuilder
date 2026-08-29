import { notFound } from "next/navigation";

// Catch-all inside the locale segment.
//
// Without it, an unmatched path such as /fr/nowhere matches no route at all, so
// Next falls back to its built-in 404 — untranslated, unstyled, and outside the
// locale layout. Routing it through `notFound()` renders
// app/[locale]/not-found.tsx instead, in the right language.
export default function CatchAllNotFound() {
  notFound();
}
