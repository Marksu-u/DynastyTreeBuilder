import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/routing";

// Root-level 404, reached only by paths the proxy does not rewrite into a
// locale. There is no root layout above this file — the real one lives in
// app/[locale]/layout.tsx — so rather than render a bare, unstyled page we send
// the visitor to the default locale, where the themed and translated 404 lives.
export default function RootNotFound() {
  redirect(`/${defaultLocale}/not-found`);
}
