import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useVigilens } from "@/lib/mock/store";
import { Plate } from "@/components/common/Plate";
import { ViolationBadge } from "@/components/common/ViolationBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatINR, formatIST, formatISTShort } from "@/lib/format";
import { CheckCircle2, Banknote, QrCode as QrIcon, Loader2, Download, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Violation, PaymentRecord } from "@/lib/mock/seed";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/EmptyState";

export const Route = createFileRoute("/payments")({
  head: () => ({ meta: [{ title: "Payments — Vigilens" }] }),
  component: PaymentsPage,
});

function PaymentsPage() {
  const violations = useVigilens(s => s.violations);
  const payments = useVigilens(s => s.payments);
  const recordPayment = useVigilens(s => s.recordPayment);
  const now = useVigilens(s => s.now);

  const pending = useMemo(
    () => violations.filter(v => v.status !== "paid").sort((a, b) => a.timestamp - b.timestamp),
    [violations]
  );

  const [selectedId, setSelectedId] = useState<string | null>(pending[0]?.id ?? null);
  const selected = pending.find(v => v.id === selectedId) ?? null;
  const [receipt, setReceipt] = useState<{ payment: PaymentRecord; violation: Violation } | null>(null);

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto">
      <Tabs defaultValue="pending">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="text-lg font-semibold">Fine Payments</h1>
            <p className="text-xs text-muted-foreground">{pending.length} pending · {formatINR(pending.reduce((s, v) => s + v.fine, 0))} outstanding</p>
          </div>
          <TabsList>
            <TabsTrigger value="pending">Pending Fines</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending">
          <div className="grid lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
              {pending.length === 0 && <EmptyState title="No pending fines" description="All fines have been collected." />}
              {pending.map(v => {
                const dueDate = v.timestamp + 14 * 86400_000;
                const overdue = dueDate < now;
                const isSel = selected?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={cn(
                      "w-full text-left glass-card rounded-lg p-3 transition border",
                      isSel ? "!border-primary/60 ring-1 ring-primary/40" : "",
                      overdue && !isSel && "!border-destructive/40"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Plate value={v.plate} size="sm" />
                      <ViolationBadge type={v.type} />
                      {overdue && (
                        <span className="ml-auto text-[10px] uppercase tracking-wider text-destructive font-semibold">Overdue</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Due {formatISTShort(dueDate)}</span>
                      <span className="font-semibold tabular-nums">{formatINR(v.fine + (overdue ? Math.round(v.fine * 0.2) : 0))}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-3">
              {selected ? (
                <PaymentPanel
                  violation={selected}
                  now={now}
                  onPaid={(method) => {
                    const p = recordPayment(selected.id, method);
                    if (p) {
                      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#3b82f6", "#10b981", "#f59e0b"] });
                      setReceipt({ payment: p, violation: selected });
                      toast.success("Payment recorded");
                      setSelectedId(pending.find(v => v.id !== selected.id)?.id ?? null);
                    }
                  }}
                />
              ) : (
                <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">Select a fine to begin payment</div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-card/60 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left">Receipt</th>
                    <th className="p-3 text-left">Vehicle</th>
                    <th className="p-3 text-left">Violation ID</th>
                    <th className="p-3 text-left">Method</th>
                    <th className="p-3 text-left">Timestamp</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="row-zebra">
                  {payments.slice(0, 50).map(p => (
                    <tr key={p.id} className="border-b border-border/40">
                      <td className="p-3 font-mono text-xs">{p.receiptId}</td>
                      <td className="p-3"><Plate value={p.plate} size="sm" /></td>
                      <td className="p-3 font-mono text-xs">{p.violationId}</td>
                      <td className="p-3"><span className="uppercase text-xs px-2 py-0.5 rounded border border-border">{p.method}</span></td>
                      <td className="p-3 text-xs whitespace-nowrap">{formatIST(p.timestamp)}</td>
                      <td className="p-3 text-right font-semibold tabular-nums">{formatINR(p.amount)}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => toast.success(`Receipt ${p.receiptId} downloaded`)}>
                          <Download className="h-3.5 w-3.5 mr-1" />PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none">
          {receipt && <Receipt payment={receipt.payment} violation={receipt.violation} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentPanel({ violation, now, onPaid }: { violation: Violation; now: number; onPaid: (m: "upi" | "cash") => void }) {
  const dueDate = violation.timestamp + 14 * 86400_000;
  const overdue = dueDate < now;
  const lateFee = overdue ? Math.round(violation.fine * 0.2) : 0;
  const total = violation.fine + lateFee;

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Plate value={violation.plate} />
          <ViolationBadge type={violation.type} />
        </div>
        <div className="text-xs text-muted-foreground font-mono">{violation.id}</div>
      </div>

      <div className="rounded-lg border border-border bg-background/40 p-4 space-y-2">
        <Row label="Base fine" value={formatINR(violation.fine)} />
        {lateFee > 0 && <Row label="Late fee (20%)" value={formatINR(lateFee)} tone="destructive" />}
        <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold">Total payable</span>
          <span className="text-2xl font-bold tabular-nums text-primary">{formatINR(total)}</span>
        </div>
        {overdue && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded p-2">
            <AlertTriangle className="h-3.5 w-3.5" /> Overdue · escalation notice will be sent if unpaid in 7 days
          </div>
        )}
      </div>

      <Tabs defaultValue="upi">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="upi"><QrIcon className="h-4 w-4 mr-1.5" /> UPI</TabsTrigger>
          <TabsTrigger value="cash"><Banknote className="h-4 w-4 mr-1.5" /> Cash</TabsTrigger>
        </TabsList>
        <TabsContent value="upi"><UpiPay total={total} onPaid={() => onPaid("upi")} /></TabsContent>
        <TabsContent value="cash"><CashPay total={total} onPaid={() => onPaid("cash")} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "destructive" }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", tone === "destructive" && "text-destructive")}>{value}</span>
    </div>
  );
}

function FakeQr({ size = 160 }: { size?: number }) {
  const cells = 21;
  const grid = Array.from({ length: cells * cells }).map((_, i) => {
    const x = i % cells, y = Math.floor(i / cells);
    // finder patterns
    const isFinder = (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7);
    if (isFinder) {
      const lx = x < 7 ? x : x - (cells - 7);
      const ly = y < 7 ? y : y - (cells - 7);
      const inOuter = lx === 0 || lx === 6 || ly === 0 || ly === 6;
      const inInner = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
      return inOuter || inInner ? 1 : 0;
    }
    return ((x * 13 + y * 7 + (x ^ y) * 3) % 5) < 2 ? 1 : 0;
  });
  const cs = size / cells;
  return (
    <svg width={size} height={size} className="rounded">
      <rect width={size} height={size} fill="white" />
      {grid.map((v, i) => v ? <rect key={i} x={(i % cells) * cs} y={Math.floor(i / cells) * cs} width={cs} height={cs} fill="black" /> : null)}
    </svg>
  );
}

function UpiPay({ total, onPaid }: { total: number; onPaid: () => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="grid sm:grid-cols-2 gap-4 mt-3">
      <div className="rounded-lg border border-border bg-background/40 p-4 flex flex-col items-center">
        <div className="text-xs text-muted-foreground mb-2">Scan to pay {formatINR(total)}</div>
        <FakeQr />
        <div className="mt-2 text-xs font-mono text-muted-foreground">vigilens@axisbank</div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">UPI ID</label>
          <Input placeholder="yourname@bank" defaultValue="user@oksbi" className="mt-1 bg-background/60" />
        </div>
        <Button
          className="w-full h-11"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => { setLoading(false); onPaid(); }, 1800);
          }}
        >
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Scan &amp; Pay {formatINR(total)}</>}
        </Button>
        <p className="text-[11px] text-muted-foreground">Sandbox UPI · No real charge will be made</p>
      </div>
    </div>
  );
}

function CashPay({ total, onPaid }: { total: number; onPaid: () => void }) {
  const [tendered, setTendered] = useState<string>(String(total));
  const change = Math.max(0, Number(tendered || 0) - total);
  const ok = Number(tendered || 0) >= total;
  return (
    <div className="rounded-lg border border-border bg-background/40 p-4 mt-3 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Amount due</label>
          <div className="mt-1 px-3 py-2 rounded border border-border bg-background/60 font-mono tabular-nums">{formatINR(total)}</div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Tendered</label>
          <Input type="number" value={tendered} onChange={e => setTendered(e.target.value)} className="mt-1 bg-background/60 font-mono" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Change</label>
          <div className={cn("mt-1 px-3 py-2 rounded border border-border bg-background/60 font-mono tabular-nums", change > 0 && "text-success border-success/40")}>
            {formatINR(change)}
          </div>
        </div>
      </div>
      <Button className="w-full h-11" disabled={!ok} onClick={onPaid}>
        <CheckCircle2 className="h-4 w-4 mr-2" /> Confirm Cash Payment
      </Button>
    </div>
  );
}

function Receipt({ payment, violation }: { payment: PaymentRecord; violation: Violation }) {
  return (
    <div className="receipt-paper rounded-lg overflow-hidden shadow-2xl">
      <div className="bg-[#0F1523] text-white p-4 flex items-center justify-between">
        <div>
          <div className="text-xs tracking-[0.3em] opacity-70">VIGILENS</div>
          <div className="text-lg font-semibold">Official Fine Receipt</div>
        </div>
        <CheckCircle2 className="h-8 w-8 text-success" />
      </div>
      <div className="p-5 space-y-3 text-sm">
        <RReceiptRow label="Receipt ID" value={<span className="font-mono">{payment.receiptId}</span>} />
        <RReceiptRow label="Violation ID" value={<span className="font-mono">{violation.id}</span>} />
        <RReceiptRow label="Vehicle" value={<Plate value={violation.plate} size="sm" />} />
        <RReceiptRow label="Violation" value={<ViolationBadge type={violation.type} />} />
        <RReceiptRow label="Location" value={violation.location} />
        <RReceiptRow label="Method" value={<span className="uppercase font-semibold">{payment.method}</span>} />
        <RReceiptRow label="Paid at" value={<span className="text-xs">{formatIST(payment.timestamp)}</span>} />
        <div className="border-t border-dashed border-zinc-400 pt-2 flex justify-between font-bold">
          <span>Amount Paid</span>
          <span className="tabular-nums">{formatINR(payment.amount)}</span>
        </div>
        <div className="pt-3 flex items-end justify-between">
          <div>
            <div className="text-[10px] text-zinc-600 uppercase">Digitally signed</div>
            <svg width="90" height="32" viewBox="0 0 90 32"><path d="M2 22 Q 12 4, 22 18 T 44 16 Q 60 26, 76 8" stroke="#1d4ed8" strokeWidth="1.5" fill="none" /></svg>
          </div>
          <div className="text-right text-[10px] text-zinc-600">
            <div>Traffic Authority</div>
            <div>Bengaluru Metro</div>
          </div>
        </div>
      </div>
      <div className="bg-zinc-200 text-zinc-700 text-[10px] text-center py-2">Thank you · Drive safely</div>
    </div>
  );
}

function RReceiptRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-900">{value}</span>
    </div>
  );
}
