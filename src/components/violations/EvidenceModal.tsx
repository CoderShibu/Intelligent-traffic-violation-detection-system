import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Violation } from "@/lib/mock/seed";
import { Plate } from "@/components/common/Plate";
import { ViolationBadge } from "@/components/common/ViolationBadge";
import { ConfidenceBar } from "@/components/common/ConfidenceBar";
import { StatusPill } from "@/components/common/StatusPill";
import { formatINR, formatIST } from "@/lib/format";
import { Camera, MapPin, Clock, Hash } from "lucide-react";
import { useVigilens } from "@/lib/mock/store";

export function EvidenceModal({ violation, onOpenChange }: { violation: Violation | null; onOpenChange: (open: boolean) => void }) {
  const cameras = useVigilens(s => s.cameras);
  const cam = violation ? cameras.find(c => c.id === violation.cameraId) : null;

  return (
    <Dialog open={!!violation} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Evidence Snapshot</span>
            {violation && <ViolationBadge type={violation.type} />}
          </DialogTitle>
        </DialogHeader>
        {violation && (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative aspect-video rounded-lg overflow-hidden border border-border bg-gradient-to-br from-zinc-800 via-zinc-900 to-black scanline-mask">
              {/* simulated street scene */}
              <svg viewBox="0 0 400 225" className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#1f2937" />
                    <stop offset="1" stopColor="#0f172a" />
                  </linearGradient>
                </defs>
                <rect width="400" height="140" fill="url(#sky)" />
                <rect y="140" width="400" height="85" fill="#1a1a1a" />
                {/* road lines */}
                <g stroke="#fbbf24" strokeWidth="2" strokeDasharray="14 10">
                  <line x1="0" y1="180" x2="400" y2="180" />
                </g>
                {/* buildings */}
                <rect x="20" y="60" width="60" height="80" fill="#1f2937" />
                <rect x="90" y="40" width="40" height="100" fill="#111827" />
                <rect x="300" y="50" width="80" height="90" fill="#1f2937" />
                {/* vehicle */}
                <g transform="translate(160 130)">
                  <rect width="80" height="40" rx="6" fill="#2563eb" />
                  <rect x="8" y="6" width="64" height="20" rx="3" fill="#1e3a8a" />
                  <circle cx="18" cy="42" r="8" fill="#0a0a0a" />
                  <circle cx="62" cy="42" r="8" fill="#0a0a0a" />
                </g>
                {/* highlight box around plate */}
                <rect x="178" y="160" width="44" height="14" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2">
                  <animate attributeName="stroke-dashoffset" values="0;10" dur="1.5s" repeatCount="indefinite" />
                </rect>
                <text x="178" y="155" fill="#f59e0b" fontSize="9" fontFamily="monospace">DETECTED</text>
              </svg>
              <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 px-2 py-1 rounded text-[10px] font-mono">
                <span className="dot bg-destructive pulse-dot text-destructive" />
                REC · {violation.cameraId}
              </div>
              <div className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/60 px-2 py-1 rounded">
                {formatIST(violation.timestamp)}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-border p-3 bg-background/40">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Plate Close-Up</div>
                <div className="flex justify-center py-2 bg-black/40 rounded">
                  <Plate value={violation.plate} size="lg" />
                </div>
              </div>

              <div className="rounded-lg border border-border p-3 bg-background/40 space-y-2 text-sm">
                <Row icon={Hash} label="Violation ID" value={<span className="font-mono">{violation.id}</span>} />
                <Row icon={Camera} label="Camera" value={<span className="font-mono">{violation.cameraId}</span>} />
                <Row icon={MapPin} label="GPS" value={cam ? <span className="font-mono text-xs">{cam.lat.toFixed(4)}, {cam.lng.toFixed(4)}</span> : "—"} />
                <Row icon={Clock} label="Captured" value={<span className="text-xs">{formatIST(violation.timestamp)}</span>} />
              </div>

              <div className="rounded-lg border border-border p-3 bg-background/40">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">AI Confidence</div>
                <ConfidenceBar value={violation.confidence} />
              </div>

              <div className="rounded-lg border border-border p-3 bg-background/40 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Fine</div>
                  <div className="text-xl font-semibold tabular-nums">{formatINR(violation.fine)}</div>
                </div>
                <StatusPill status={violation.status} />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Camera; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground text-xs"><Icon className="h-3.5 w-3.5" />{label}</span>
      <span>{value}</span>
    </div>
  );
}
