type Props = { className?: string };

export function Skeleton({ className = "" }: Props) {
  return <div className={`animate-pulse rounded bg-zinc-800 ${className}`} />;
}
