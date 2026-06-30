import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

type Props = {
  onAddCharacter: () => void;
};

export function CanvasEmptyState({ onAddCharacter }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-zinc-950/60">
      <p className="absolute select-none text-3xl font-semibold text-zinc-800/80">
        Your dynasty awaits
      </p>
      <div className="relative pointer-events-auto rounded-xl border border-zinc-800 bg-zinc-950 px-4">
        <EmptyState
          icon={Users}
          title="Your canvas is empty"
          description="Add your first character to start building the dynasty tree."
          action={
            <button
              onClick={onAddCharacter}
              className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
            >
              Add Character
            </button>
          }
        />
      </div>
    </div>
  );
}
