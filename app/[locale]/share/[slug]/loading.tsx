import { SkeletonCanvas } from "@/components/ui/SkeletonCanvas";

export default function ShareLoading() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-800 px-4">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-16 animate-pulse rounded bg-zinc-800" />
      </header>
      <div className="flex-1 overflow-hidden">
        <SkeletonCanvas />
      </div>
    </div>
  );
}
