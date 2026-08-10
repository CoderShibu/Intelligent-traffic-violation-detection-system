import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-primary/15 blur-2xl" />
        <div className="relative h-16 w-16 rounded-full border border-primary/30 bg-card flex items-center justify-center text-primary">
          {icon ?? <Inbox className="h-7 w-7" />}
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
