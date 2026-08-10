import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useVigilens } from "@/lib/mock/store";
import { KpiCard } from "@/components/common/KpiCard";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { CityMap } from "@/components/dashboard/CityMap";
import { ShieldAlert, IndianRupee, Clock, Camera } from "lucide-react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Command Dashboard — Vigilens" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { violations, payments, now, cameras } = useVigilens();
  const [range, setRange] = useState<"today" | "week" | "month">("today");

  const stats = useMemo(() => {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const today = startOfToday.getTime();
    const violationsToday = violations.filter(v => v.timestamp >= today).length;
    const finesCollected = payments.filter(p => p.timestamp >= today - 30 * 86400_000).reduce((s, p) => s + p.amount, 0);
    const pending = violations.filter(v => v.status !== "paid").length;
    return { violationsToday, finesCollected, pending, cameras: cameras.length };
  }, [violations, payments, now, cameras]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Violations Today" value={stats.violationsToday} icon={ShieldAlert} accent="warning" trend={<span className="text-warning">▲ 12% vs yesterday</span>} />
        <KpiCard label="Fines Collected" value={stats.finesCollected} icon={IndianRupee} accent="success" prefix="₹" format={(n) => n.toLocaleString("en-IN")} trend={<span>Last 30 days</span>} />
        <KpiCard label="Pending Payments" value={stats.pending} icon={Clock} accent="destructive" trend={<span className="text-destructive">Overdue: {Math.round(stats.pending * 0.3)}</span>} />
        <KpiCard label="Active Cameras" value={stats.cameras} icon={Camera} accent="primary" trend={<span className="text-success">All systems online</span>} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider">Live Violation Feed</h2>
              <p className="text-xs text-muted-foreground">Real-time AI-detected events streaming from active cameras</p>
            </div>
            <div className="flex rounded-full border border-border p-0.5 bg-card">
              {(["today", "week", "month"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full transition capitalize",
                    range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r === "today" ? "Today" : r === "week" ? "This Week" : "This Month"}
                </button>
              ))}
            </div>
          </div>
          <LiveFeed range={range} />
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider">Camera Hotspots</h2>
            <p className="text-xs text-muted-foreground mb-3">Live feed locations across the city</p>
            <CityMap />
          </div>
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3">Today at a glance</h3>
            <div className="space-y-2 text-sm">
              <Row label="Total fines billed" value={formatINR(violations.filter(v => v.timestamp >= now - 86400_000).reduce((s, v) => s + v.fine, 0))} />
              <Row label="Avg. confidence" value="93.4%" />
              <Row label="Disputed cases" value={String(violations.filter(v => v.status === "disputed").length)} />
              <Row label="Top violation" value="No Helmet" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
