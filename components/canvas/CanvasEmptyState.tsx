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
            /* W5 in design.md §9: the empty canvas *is* the onboarding, so the
               one thing to do here is the tool's primary action and carries the
               accent fill. The import route stays a quiet text link beneath it —
               it is the alternative, not the invitation. */
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={onAddCharacter}
                className="cursor-pointer rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-zinc-950 transition-opacity hover:opacity-90"
              >
                Add the first character
              </button>
              {onImportJson && (
                <button
                  onClick={onImportJson}
                  className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  <Upload size={12} />
                  or import a JSON backup
                </button>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}
