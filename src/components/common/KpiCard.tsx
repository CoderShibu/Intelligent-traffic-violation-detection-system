import { CountUp } from "@/components/common/CountUp";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function KpiCard({
  label, value, icon: Icon, accent = "primary", trend, prefix = "", format,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "destructive";
  trend?: ReactNode;
  prefix?: string;
  format?: (n: number) => string;
}) {
  const ringColor = {
    primary: "from-primary/40 to-primary/0 text-primary",
    success: "from-success/40 to-success/0 text-success",
    warning: "from-warning/40 to-warning/0 text-warning",
    destructive: "from-destructive/40 to-destructive/0 text-destructive",
  }[accent];

  return (
    <div className="glass-card rounded-xl p-4 relative overflow-hidden animate-fade-up">
      <div className={cn("absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-40 bg-gradient-to-br", ringColor)} />
      <div className="flex items-start justify-between relative">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
        <div className={cn("h-8 w-8 rounded-lg border flex items-center justify-center", `border-${accent}/30`)}>
          <Icon className={cn("h-4 w-4", `text-${accent}`)} />
        </div>
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
        {prefix}<CountUp value={value} format={format} />
      </div>
      {trend && <div className="mt-1 text-xs text-muted-foreground">{trend}</div>}
    </div>
  );
}
