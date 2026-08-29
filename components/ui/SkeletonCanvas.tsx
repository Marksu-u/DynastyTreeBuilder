import { Skeleton } from "./Skeleton";

export function SkeletonCanvas() {
  return (
    <div className="relative h-full w-full bg-background">
      {/* Ghosted toolbar strip */}
      <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-lg" />
        ))}
      </div>

      {/* Ghost nodes */}
      <div className="absolute left-[15%] top-[30%]">
        <Skeleton className="h-14 w-32 rounded-lg" />
      </div>
      <div className="absolute left-[42%] top-[20%]">
        <Skeleton className="h-14 w-32 rounded-lg" />
      </div>
      <div className="absolute left-[62%] top-[42%]">
        <Skeleton className="h-14 w-32 rounded-lg" />
      </div>
    </div>
  );
}
