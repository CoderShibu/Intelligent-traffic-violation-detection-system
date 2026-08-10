import { cn } from "@/lib/utils";

export function ConfidenceBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(value * 1000) / 10;
  const color = value > 0.9 ? "bg-success" : value > 0.8 ? "bg-primary" : "bg-warning";
  return (
    <div className={cn("flex items-center gap-2 min-w-[120px]", className)}>
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}
