import { cn } from "@/lib/utils";
import type { ViolationStatus } from "@/lib/mock/seed";

const MAP: Record<ViolationStatus, { label: string; dot: string; ring: string }> = {
  paid:     { label: "Paid",     dot: "bg-success",     ring: "border-success/40 text-success" },
  pending:  { label: "Pending",  dot: "bg-destructive", ring: "border-destructive/40 text-destructive" },
  disputed: { label: "Disputed", dot: "bg-warning",     ring: "border-warning/40 text-warning" },
};

export function StatusPill({ status, className }: { status: ViolationStatus; className?: string }) {
  const m = MAP[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium", m.ring, className)}>
      <span className={cn("dot", m.dot)} />
      {m.label}
    </span>
  );
}
