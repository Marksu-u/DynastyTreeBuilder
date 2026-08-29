import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware replacements for next/link and the router. Always import Link
// from here rather than from next/link: these add the `/fr` prefix on their
// own, so a French visitor clicking a link stays in French.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
