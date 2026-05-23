"use client";

import { WITHIN_ROLES, OUTSIDE_ROLES } from "@/lib/role-definitions";
import { RoleCard } from "./RoleCard";
import type { CharacterRole } from "@/types/canvas";

interface Props {
  onAddToCanvas?: (name: string, role: CharacterRole) => void;
}

export function RoleSlots({ onAddToCanvas }: Props) {
  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-medium text-zinc-200">Role Slots</span>
        <span className="text-xs text-zinc-500">{WITHIN_ROLES.length + OUTSIDE_ROLES.length} roles</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section label="Within the house">
          {WITHIN_ROLES.map((def) => (
            <RoleCard key={def.role} definition={def} onAddToCanvas={onAddToCanvas} />
          ))}
        </Section>

        <Section label="Outside the house">
          {OUTSIDE_ROLES.map((def) => (
            <RoleCard key={def.role} definition={def} onAddToCanvas={onAddToCanvas} />
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-3">
      <p className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
        {label}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
