import { Skeleton } from "@/components/ui/Skeleton";
import { SkeletonCanvas } from "@/components/ui/SkeletonCanvas";

export default function DynastyLoading() {
  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-800 px-4">
        <span className="text-sm text-zinc-400">← Dynasties</span>
        <span className="text-zinc-700">/</span>
        <Skeleton className="h-4 w-32" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <SkeletonCanvas />
      </div>
    </div>
  );
}
