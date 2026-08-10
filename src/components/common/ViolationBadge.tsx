import { VT_MAP, type ViolationTypeKey } from "@/lib/mock/violationTypes";
import { cn } from "@/lib/utils";

export function ViolationBadge({ type, className, showIcon = true }: { type: ViolationTypeKey; className?: string; showIcon?: boolean }) {
  const m = VT_MAP[type];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", m.bg, m.color, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {m.label}
    </span>
  );
}
