import { Users, Upload } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

type Props = {
  onAddCharacter: () => void;
  onImportJson?: () => void;
};

export function CanvasEmptyState({ onAddCharacter, onImportJson }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60">
      <p className="absolute select-none text-3xl font-semibold text-zinc-800/80">
        Your dynasty awaits
      </p>
      <div className="relative pointer-events-auto rounded-xl border border-zinc-800 bg-background px-4">
        <EmptyState
          icon={Users}
          title="Your canvas is empty"
          description="Add your first character to start building the dynasty tree."
          action={
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onAddCharacter}
                className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100"
              >
                Add Character
              </button>
              {onImportJson && (
                <button
                  onClick={onImportJson}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  <Upload size={12} />
                  Import from file
                </button>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}
