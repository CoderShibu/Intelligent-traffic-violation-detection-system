import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useVigilens } from "@/lib/mock/store";
import { VIOLATION_TYPES, VT_MAP } from "@/lib/mock/violationTypes";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Clock, Percent, IndianRupee, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Vigilens" }] }),
  component: AnalyticsPage,
});

const RANGES = { "7d": 7, "30d": 30, "3m": 90 } as const;
type RangeKey = keyof typeof RANGES;

function AnalyticsPage() {
  const violations = useVigilens(s => s.violations);
  const now = useVigilens(s => s.now);
  const [range, setRange] = useState<RangeKey>("30d");

  const cutoff = now - RANGES[range] * 86400_000;
  const inRange = useMemo(() => violations.filter(v => v.timestamp >= cutoff), [violations, cutoff]);

  // by type
  const byType = useMemo(() => VIOLATION_TYPES.map(t => ({
    name: t.label,
    value: inRange.filter(v => v.type === t.key).length,
    color: t.hex,
  })).sort((a, b) => b.value - a.value), [inRange]);

  // daily trend
  const days = RANGES[range];
  const daily = useMemo(() => {
    const arr: { date: string; count: number; ts: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const start = dayStart.getTime();
      const end = start + 86400_000;
      const count = violations.filter(v => v.timestamp >= start && v.timestamp < end).length;
      arr.push({ date: dayStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), count, ts: start });
    }
    // 7d moving average
    return arr.map((d, i) => {
      const slice = arr.slice(Math.max(0, i - 6), i + 1);
      const avg = slice.reduce((s, x) => s + x.count, 0) / slice.length;
      return { ...d, avg: +avg.toFixed(1) };
    });
  }, [violations, now, days]);

  // status donut
  const status = useMemo(() => [
    { name: "Paid", value: inRange.filter(v => v.status === "paid").length, color: "#10b981" },
    { name: "Pending", value: inRange.filter(v => v.status === "pending").length, color: "#ef4444" },
    { name: "Disputed", value: inRange.filter(v => v.status === "disputed").length, color: "#f59e0b" },
  ], [inRange]);

  // heatmap 7x24
  const heatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    inRange.forEach(v => {
      const d = new Date(v.timestamp);
      grid[d.getDay()][d.getHours()]++;
    });
    const max = Math.max(1, ...grid.flat());
    return { grid, max };
  }, [inRange]);

  // top locations
  const topLocations = useMemo(() => {
    const counts: Record<string, number> = {};
    inRange.forEach(v => { counts[v.location] = (counts[v.location] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 10);
  }, [inRange]);

  // KPIs
  const kpis = useMemo(() => {
    const mostCommon = byType[0]?.name ?? "—";
    let busiestHour = 0, max = 0;
    heatmap.grid.forEach(row => row.forEach((v, h) => { if (v > max) { max = v; busiestHour = h; } }));
    const paid = status.find(s => s.name === "Paid")?.value ?? 0;
    const collectionRate = inRange.length ? Math.round((paid / inRange.length) * 100) : 0;
    const avgFine = inRange.length ? Math.round(inRange.reduce((s, v) => s + v.fine, 0) / inRange.length) : 0;
    const platesCounts: Record<string, number> = {};
    inRange.forEach(v => { platesCounts[v.plate] = (platesCounts[v.plate] || 0) + 1; });
    const topRepeat = Object.entries(platesCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      mostCommon,
      busiestHour: `${String(busiestHour).padStart(2, "0")}:00 - ${String((busiestHour + 1) % 24).padStart(2, "0")}:00`,
      collectionRate,
      avgFine,
      topRepeat: topRepeat ? `${topRepeat[0]} (${topRepeat[1]})` : "—",
    };
  }, [byType, heatmap, status, inRange]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold">Analytics & Insights</h1>
          <p className="text-xs text-muted-foreground">{inRange.length} violations · last {RANGES[range]} days</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-border p-0.5 bg-card">
            {(Object.keys(RANGES) as RangeKey[]).map(k => (
              <button key={k}
                onClick={() => setRange(k)}
                className={cn("px-3 py-1 text-xs rounded-full transition", range === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {k === "7d" ? "Last 7 days" : k === "30d" ? "Last 30 days" : "Last 3 months"}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.success("Analytics PDF report queued for download")}>
            <Download className="h-4 w-4 mr-1.5" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiTile icon={TrendingUp} label="Most common" value={kpis.mostCommon} />
        <KpiTile icon={Clock} label="Busiest hour" value={kpis.busiestHour} />
        <KpiTile icon={Percent} label="Collection rate" value={`${kpis.collectionRate}%`} accent="success" />
        <KpiTile icon={IndianRupee} label="Avg fine" value={formatINR(kpis.avgFine)} />
        <KpiTile icon={Flame} label="Top offender" value={kpis.topRepeat} accent="destructive" mono />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3">Violations by Type</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byType} layout="vertical" margin={{ left: 16, right: 16 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={11} width={140} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(59,130,246,0.08)" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {byType.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Payment Status</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={status} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                {status.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3">Daily Trend (with 7-day moving average)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={daily}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={10} interval={Math.max(0, Math.floor(daily.length / 12))} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="count" name="Daily" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="avg" name="7-day avg" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3">Peak Time Analysis · Hour × Day</h3>
          <Heatmap grid={heatmap.grid} max={heatmap.max} />
        </div>
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-3">Top 10 Locations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topLocations} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={10} />
              <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={10} width={110} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(59,130,246,0.08)" }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "rgba(20,28,50,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 12,
  color: "white",
} as const;

function KpiTile({ icon: Icon, label, value, accent = "primary", mono }: {
  icon: typeof TrendingUp; label: string; value: string;
  accent?: "primary" | "success" | "destructive"; mono?: boolean;
}) {
  return (
    <div className="glass-card rounded-xl p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <div className={cn("mt-1.5 text-base font-semibold truncate", mono && "font-mono", `text-${accent}`)}>{value}</div>
    </div>
  );
}

function Heatmap({ grid, max }: { grid: number[][]; max: number }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex gap-1 ml-10 mb-1">
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="w-5 text-[9px] text-muted-foreground text-center">{h % 3 === 0 ? h : ""}</div>
          ))}
        </div>
        {grid.map((row, di) => (
          <div key={di} className="flex items-center gap-1 mb-1">
            <div className="w-9 text-[10px] text-muted-foreground text-right">{days[di]}</div>
            {row.map((v, h) => {
              const intensity = v / max;
              return (
                <div
                  key={h}
                  title={`${days[di]} ${h}:00 — ${v} violations`}
                  className="w-5 h-5 rounded-sm border border-white/5"
                  style={{ background: `rgba(59,130,246,${0.08 + intensity * 0.85})` }}
                />
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0.1, 0.3, 0.5, 0.7, 0.95].map((a, i) => (
            <div key={i} className="w-4 h-3 rounded-sm" style={{ background: `rgba(59,130,246,${a})` }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
