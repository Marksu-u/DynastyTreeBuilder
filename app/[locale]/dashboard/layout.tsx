import type { Metadata } from "next";

/**
 * Keeps the whole signed-in workspace out of the index. A layout, not three
 * page exports: metadata is inherited, so this also covers /dashboard/new,
 * which is a client component and cannot export metadata of its own.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
