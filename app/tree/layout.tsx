import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guest Canvas",
  description:
    "Build a dynasty tree instantly — no account needed. Save to your account to keep it.",
  alternates: { canonical: "/tree" },
};

export default function TreeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
