import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useVigilens, selectVehicleByPlate } from "@/lib/mock/store";
import { Plate } from "@/components/common/Plate";
import { ViolationBadge } from "@/components/common/ViolationBadge";
import { StatusPill } from "@/components/common/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bike, Car, Truck, Flame, AlertTriangle, FileText, Flag, Plus } from "lucide-react";
import { formatINR, formatIST } from "@/lib/format";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vehicles")({
  head: () => ({ meta: [{ title: "Vehicle Search — Vigilens" }] }),
  component: VehicleSearch,
});

function VehicleSearch() {
  const violations = useVigilens(s => s.violations);
  const searchHistory = useVigilens(s => s.searchHistory);
  const addSearch = useVigilens(s => s.addSearch);
  const toggleFlag = useVigilens(s => s.toggleFlag);
  const flagged = useVigilens(s => s.flaggedPlates);

  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const profile = submitted ? selectVehicleByPlate(submitted) : null;

  const search = (val: string) => {
    const plate = val.trim().toUpperCase();
    if (!plate) return;
    addSearch(plate);
    setSubmitted(plate);
  };

  const suggestions = Array.from(new Set(violations.map(v => v.plate))).slice(0, 8);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold mb-3">Vehicle Lookup</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); search(q); }}
          className="glass-card rounded-xl p-3 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Enter vehicle number plate (e.g. KA-01-AB-1234)…"
              className="pl-9 h-11 font-mono uppercase tracking-wider bg-background/60"
              data-search-input
            />
          </div>
          <Button type="submit" className="h-11 px-6">Search</Button>
        </form>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {searchHistory.length > 0 ? "Recent:" : "Try:"}
          </span>
          {(searchHistory.length > 0 ? searchHistory : suggestions).slice(0, 8).map(p => (
            <button
              key={p}
              onClick={() => { setQ(p); search(p); }}
              className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:border-primary/40 hover:text-primary transition font-mono"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {!profile && submitted && (
        <EmptyState
          title="No record found"
          description={`No violations on file for ${submitted}. This vehicle has a clean record.`}
        />
      )}
      {!submitted && (
        <EmptyState
          icon={<Search className="h-7 w-7" />}
          title="Search for a vehicle"
          description="Enter a number plate above to view its complete violation history, owner details, and risk assessment."
        />
      )}

      {profile && (
        <div className="space-y-4 animate-fade-up">
          {profile.risk === "REPEAT" && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-destructive">Repeat Offender Detected</div>
                <div className="text-sm text-destructive/80">{profile.recentCount} violations in the last 30 days. Recommend escalation to traffic court.</div>
              </div>
            </div>
          )}

          <div className="glass-card rounded-xl p-5">
            <div className="flex items-start gap-5 flex-wrap">
              <div className="h-20 w-20 rounded-xl border border-border bg-background/60 flex items-center justify-center text-primary">
                {profile.vehicleType === "bike" ? <Bike className="h-9 w-9" /> : profile.vehicleType === "truck" ? <Truck className="h-9 w-9" /> : <Car className="h-9 w-9" />}
              </div>
              <div className="flex-1 min-w-[260px]">
                <Plate value={profile.plate} size="lg" />
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <Field label="Owner" value={profile.ownerName} />
                  <Field label="Registered State" value={profile.ownerState} />
                  <Field label="Vehicle Type" value={profile.vehicleType.toUpperCase()} />
                  <Field label="Total Violations" value={String(profile.totalCount)} />
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <RiskBadge risk={profile.risk} />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="Total" value={formatINR(profile.totalFines)} />
                  <Stat label="Paid"  value={formatINR(profile.paid)}  tone="success" />
                  <Stat label="Due"   value={formatINR(profile.due)}   tone={profile.due > 0 ? "destructive" : "muted"} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
              <Button size="sm" variant="outline" onClick={() => toast.success(`Report generated for ${profile.plate}`)}>
                <FileText className="h-4 w-4 mr-1.5" /> Generate Report
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast.success(`New fine initiated for ${profile.plate}`)}>
                <Plus className="h-4 w-4 mr-1.5" /> Initiate Fine
              </Button>
              <Button
                size="sm"
                variant={flagged.has(profile.plate) ? "destructive" : "outline"}
                onClick={() => { toggleFlag(profile.plate); toast.success(`${flagged.has(profile.plate) ? "Unflagged" : "Flagged"} ${profile.plate}`); }}
              >
                <Flag className="h-4 w-4 mr-1.5" /> {flagged.has(profile.plate) ? "Unflag" : "Flag Vehicle"}
              </Button>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">Violation Timeline</h2>
            <div className="relative pl-6">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
              <div className="space-y-3">
                {profile.violations.map(v => (
                  <div key={v.id} className="relative">
                    <div className="absolute -left-[18px] top-3 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                    <div className="glass-card rounded-lg p-3 flex items-center gap-3 flex-wrap">
                      <ViolationBadge type={v.type} />
                      <span className="text-xs text-muted-foreground">{formatIST(v.timestamp)}</span>
                      <span className="text-xs">at {v.location}</span>
                      <span className="ml-auto font-semibold tabular-nums">{formatINR(v.fine)}</span>
                      <StatusPill status={v.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function Stat({ label, value, tone = "primary" }: { label: string; value: string; tone?: "primary" | "success" | "destructive" | "muted" }) {
  const cls = {
    primary: "text-primary",
    success: "text-success",
    destructive: "text-destructive",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <div className="rounded-md border border-border bg-background/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-semibold tabular-nums", cls)}>{value}</div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: "LOW" | "MEDIUM" | "HIGH" | "REPEAT" }) {
  const map = {
    LOW: { cls: "border-success/40 bg-success/10 text-success", icon: null },
    MEDIUM: { cls: "border-warning/40 bg-warning/10 text-warning", icon: null },
    HIGH: { cls: "border-destructive/40 bg-destructive/10 text-destructive", icon: null },
    REPEAT: { cls: "border-destructive/60 bg-destructive/15 text-destructive", icon: <Flame className="h-3.5 w-3.5" /> },
  } as const;
  const m = map[risk];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wider", m.cls)}>
      {m.icon}
      {risk === "REPEAT" ? "REPEAT OFFENDER" : `${risk} RISK`}
    </span>
  );
}
