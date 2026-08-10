import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useVigilens } from "@/lib/mock/store";
import { Plate } from "@/components/common/Plate";
import { ViolationBadge } from "@/components/common/ViolationBadge";
import { StatusPill } from "@/components/common/StatusPill";
import { ConfidenceBar } from "@/components/common/ConfidenceBar";
import { EvidenceModal } from "@/components/violations/EvidenceModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR, formatIST } from "@/lib/format";
import { Search, Download, CheckCircle2, ChevronLeft, ChevronRight, Eye, Filter } from "lucide-react";
import { VIOLATION_TYPES } from "@/lib/mock/violationTypes";
import type { Violation } from "@/lib/mock/seed";
import { toast } from "sonner";

export const Route = createFileRoute("/violations")({
  head: () => ({ meta: [{ title: "Violations — Vigilens" }] }),
  component: ViolationsPage,
});

function ViolationsPage() {
  const violations = useVigilens(s => s.violations);
  const markPaid = useVigilens(s => s.markPaid);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Violation | null>(null);

  const filtered = useMemo(() => {
    return violations.filter(v => {
      if (q && !(v.plate.toLowerCase().includes(q.toLowerCase()) || v.id.toLowerCase().includes(q.toLowerCase()) || v.location.toLowerCase().includes(q.toLowerCase()))) return false;
      if (typeFilter !== "all" && v.type !== typeFilter) return false;
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      return true;
    });
  }, [violations, q, typeFilter, statusFilter]);

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggle = (id: string) => {
    setSelected(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const allSelected = slice.length > 0 && slice.every(v => selected.has(v.id));
  const toggleAll = () => {
    setSelected(s => {
      const n = new Set(s);
      if (allSelected) slice.forEach(v => n.delete(v.id));
      else slice.forEach(v => n.add(v.id));
      return n;
    });
  };

  const exportCsv = () => {
    const rows = [["ID", "Plate", "Type", "Timestamp", "Location", "Camera", "Fine", "Status", "Confidence"]];
    filtered.forEach(v => rows.push([v.id, v.plate, v.type, formatIST(v.timestamp), v.location, v.cameraId, String(v.fine), v.status, v.confidence.toFixed(3)]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vigilens-violations-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} violations to CSV`);
  };

  const bulkPay = () => {
    if (selected.size === 0) return;
    markPaid([...selected]);
    toast.success(`Marked ${selected.size} violations as paid`);
    setSelected(new Set());
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold">All Violations</h1>
          <p className="text-xs text-muted-foreground">{filtered.length.toLocaleString()} records · AI-verified</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={selected.size === 0} onClick={bulkPay}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark Paid ({selected.size})
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={e => { setQ(e.target.value); setPage(0); }}
            placeholder="Search by plate, ID, or location…"
            className="pl-9 bg-background/60 border-border"
            data-search-input
          />
        </div>
        <Filter className="h-4 w-4 text-muted-foreground ml-2" />
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px] bg-background/60"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {VIOLATION_TYPES.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[150px] bg-background/60"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card/60 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 w-8"><Checkbox checked={allSelected} onCheckedChange={toggleAll} /></th>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Vehicle</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Date & Time</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Confidence</th>
                <th className="p-3 text-right">Fine</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="row-zebra">
              {slice.map(v => (
                <tr key={v.id} className="border-b border-border/40 transition">
                  <td className="p-3"><Checkbox checked={selected.has(v.id)} onCheckedChange={() => toggle(v.id)} /></td>
                  <td className="p-3 font-mono text-xs">{v.id}</td>
                  <td className="p-3"><Plate value={v.plate} size="sm" /></td>
                  <td className="p-3"><ViolationBadge type={v.type} /></td>
                  <td className="p-3 text-xs whitespace-nowrap">{formatIST(v.timestamp)}</td>
                  <td className="p-3 text-xs">{v.location}</td>
                  <td className="p-3"><ConfidenceBar value={v.confidence} /></td>
                  <td className="p-3 text-right font-semibold tabular-nums">{formatINR(v.fine)}</td>
                  <td className="p-3"><StatusPill status={v.status} /></td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => setOpen(v)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Evidence
                    </Button>
                  </td>
                </tr>
              ))}
              {slice.length === 0 && (
                <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No violations match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground">
          <span>Showing {slice.length} of {filtered.length}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-mono">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <EvidenceModal violation={open} onOpenChange={(o) => !o && setOpen(null)} />
    </div>
  );
}
