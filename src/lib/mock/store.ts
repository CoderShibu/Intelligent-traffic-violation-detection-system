import { create } from "zustand";
import { buildSeed, type Violation, type PaymentRecord, type ViolationStatus } from "./seed";
import { VIOLATION_TYPES, type ViolationTypeKey } from "./violationTypes";
import { CAMERA_ZONES, type CameraZone } from "./locations";

interface State {
  now: number;
  violations: Violation[];
  payments: PaymentRecord[];
  cameras: CameraZone[];
  fineConfig: Record<ViolationTypeKey, number>;
  searchHistory: string[];
  flaggedPlates: Set<string>;
  demoMode: boolean;
  notify: { email: boolean; sms: boolean; push: boolean };

  markPaid: (ids: string[], method?: "upi" | "cash") => void;
  setStatus: (id: string, status: ViolationStatus) => void;
  recordPayment: (violationId: string, method: "upi" | "cash") => PaymentRecord | null;
  addSearch: (plate: string) => void;
  toggleFlag: (plate: string) => void;
  updateFine: (key: ViolationTypeKey, amount: number) => void;
  addCamera: (z: Omit<CameraZone, "id">) => void;
  updateCamera: (id: string, patch: Partial<CameraZone>) => void;
  removeCamera: (id: string) => void;
  setDemoMode: (v: boolean) => void;
  setNotify: (k: keyof State["notify"], v: boolean) => void;
}

const seed = buildSeed();

const fineConfig = Object.fromEntries(
  VIOLATION_TYPES.map(v => [v.key, v.defaultFine])
) as Record<ViolationTypeKey, number>;

export const useVigilens = create<State>((set, get) => ({
  now: seed.now,
  violations: seed.violations,
  payments: seed.payments,
  cameras: [...CAMERA_ZONES],
  fineConfig,
  searchHistory: ["KA-01-AB-1234", "MH-12-CD-9876"],
  flaggedPlates: new Set(),
  demoMode: true,
  notify: { email: true, sms: true, push: false },

  markPaid: (ids, method = "upi") => {
    const idSet = new Set(ids);
    const newPayments: PaymentRecord[] = [];
    set(s => {
      const violations = s.violations.map(v => {
        if (idSet.has(v.id) && v.status !== "paid") {
          newPayments.push({
            id: `PAY-${Date.now()}-${v.id}`,
            violationId: v.id,
            plate: v.plate,
            amount: v.fine,
            method,
            timestamp: Date.now(),
            receiptId: `RCPT-${Math.floor(Math.random() * 1_000_000)}`,
          });
          return { ...v, status: "paid" as ViolationStatus };
        }
        return v;
      });
      return { violations, payments: [...newPayments, ...s.payments] };
    });
  },

  setStatus: (id, status) => set(s => ({
    violations: s.violations.map(v => v.id === id ? { ...v, status } : v),
  })),

  recordPayment: (violationId, method) => {
    const v = get().violations.find(x => x.id === violationId);
    if (!v || v.status === "paid") return null;
    const rec: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      violationId,
      plate: v.plate,
      amount: v.fine,
      method,
      timestamp: Date.now(),
      receiptId: `RCPT-${Math.floor(Math.random() * 1_000_000)}`,
    };
    set(s => ({
      violations: s.violations.map(x => x.id === violationId ? { ...x, status: "paid" } : x),
      payments: [rec, ...s.payments],
    }));
    return rec;
  },

  addSearch: (plate) => set(s => ({
    searchHistory: [plate, ...s.searchHistory.filter(p => p !== plate)].slice(0, 8),
  })),

  toggleFlag: (plate) => set(s => {
    const next = new Set(s.flaggedPlates);
    if (next.has(plate)) next.delete(plate); else next.add(plate);
    return { flaggedPlates: next };
  }),

  updateFine: (key, amount) => set(s => ({
    fineConfig: { ...s.fineConfig, [key]: amount },
  })),

  addCamera: (z) => set(s => ({
    cameras: [...s.cameras, { ...z, id: `CAM-${String(s.cameras.length + 1).padStart(3, "0")}` }],
  })),
  updateCamera: (id, patch) => set(s => ({
    cameras: s.cameras.map(c => c.id === id ? { ...c, ...patch } : c),
  })),
  removeCamera: (id) => set(s => ({ cameras: s.cameras.filter(c => c.id !== id) })),

  setDemoMode: (v) => set({ demoMode: v }),
  setNotify: (k, v) => set(s => ({ notify: { ...s.notify, [k]: v } })),
}));

// Selectors / helpers
export function selectVehicleByPlate(plate: string) {
  const state = useVigilens.getState();
  const vs = state.violations.filter(v => v.plate.toUpperCase() === plate.toUpperCase());
  if (vs.length === 0) return null;
  const first = vs[0];
  const totalFines = vs.reduce((s, v) => s + v.fine, 0);
  const paid = vs.filter(v => v.status === "paid").reduce((s, v) => s + v.fine, 0);
  const due = totalFines - paid;
  // recent 30 days count
  const cutoff = state.now - 30 * 86400_000;
  const recentCount = vs.filter(v => v.timestamp >= cutoff).length;
  let risk: "LOW" | "MEDIUM" | "HIGH" | "REPEAT" = "LOW";
  if (recentCount >= 5) risk = "REPEAT";
  else if (vs.length >= 3) risk = "HIGH";
  else if (vs.length >= 2) risk = "MEDIUM";

  return {
    plate: first.plate,
    vehicleType: first.vehicleType,
    ownerName: first.ownerName,
    ownerState: first.ownerState,
    violations: vs,
    totalCount: vs.length,
    totalFines,
    paid,
    due,
    risk,
    recentCount,
    flagged: state.flaggedPlates.has(first.plate),
  };
}
