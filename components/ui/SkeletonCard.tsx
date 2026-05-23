import { Skeleton } from "./Skeleton";

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <Skeleton className="mb-2 h-5 w-2/3" />
      <Skeleton className="mb-4 h-3.5 w-1/2" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
    </div>
  );
}
