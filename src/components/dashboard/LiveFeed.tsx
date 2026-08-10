import { useVigilens } from "@/lib/mock/store";
import { useMemo, useState } from "react";
import { Plate } from "@/components/common/Plate";
import { ViolationBadge } from "@/components/common/ViolationBadge";
import { formatINR, formatISTShort } from "@/lib/format";
import { Camera, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Violation } from "@/lib/mock/seed";
import { EvidenceModal } from "@/components/violations/EvidenceModal";

export function LiveFeed({ range }: { range: "today" | "week" | "month" }) {
  const violations = useVigilens(s => s.violations);
  const now = useVigilens(s => s.now);
  const [open, setOpen] = useState<Violation | null>(null);

  const filtered = useMemo(() => {
    const cutoff = now - (range === "today" ? 86400_000 : range === "week" ? 7 * 86400_000 : 30 * 86400_000);
    return violations.filter(v => v.timestamp >= cutoff).slice(0, 12);
  }, [violations, now, range]);

  return (
    <>
      <div className="space-y-2">
        {filtered.map((v, i) => (
          <div
            key={v.id}
            className="glass-card rounded-lg p-3 flex items-center gap-3 animate-fade-up"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="h-12 w-16 rounded-md bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-muted-foreground shrink-0 scanline-mask">
              <Camera className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Plate value={v.plate} size="sm" />
                <ViolationBadge type={v.type} />
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono">{v.id}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.location}</span>
                <span>{formatISTShort(v.timestamp)}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-semibold tabular-nums">{formatINR(v.fine)}</div>
              <Button size="sm" variant="ghost" className="h-7 mt-1 text-primary hover:text-primary" onClick={() => setOpen(v)}>
                View Details
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">No violations in this range.</div>
        )}
      </div>
      <EvidenceModal violation={open} onOpenChange={(o) => !o && setOpen(null)} />
    </>
  );
}
