import type { ElementType } from "react";

type Props = {
  icon: ElementType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <Icon size={40} className="text-zinc-600" />
      <div>
        <p className="text-sm font-medium text-zinc-300">{title}</p>
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
