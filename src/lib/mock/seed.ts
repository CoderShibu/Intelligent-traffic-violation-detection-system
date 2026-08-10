import { rng, makePlate, makeOwner, type VehicleType, VEHICLE_TYPES } from "./plates";
import { CAMERA_ZONES } from "./locations";
import { VIOLATION_TYPES, type ViolationTypeKey } from "./violationTypes";

export type ViolationStatus = "paid" | "pending" | "disputed";

export interface Violation {
  id: string;
  plate: string;
  type: ViolationTypeKey;
  timestamp: number; // ms
  cameraId: string;
  location: string;  // area name
  fine: number;
  status: ViolationStatus;
  confidence: number;       // 0-1
  vehicleType: VehicleType;
  ownerName: string;
  ownerState: string;
  flagged?: boolean;
}

export interface PaymentRecord {
  id: string;
  violationId: string;
  plate: string;
  amount: number;
  method: "upi" | "cash";
  timestamp: number;
  receiptId: string;
}

const NOW = new Date("2026-05-14T09:30:00+05:30").getTime();

function pick<T>(arr: T[], r: () => number): T { return arr[Math.floor(r() * arr.length)]; }

export function buildSeed() {
  const r = rng(20260514);
  // Pool of ~30 vehicles, with some repeat offenders
  const vehicleCount = 32;
  const vehicles = Array.from({ length: vehicleCount }).map(() => {
    const plate = makePlate(r);
    return {
      plate,
      vehicleType: pick([...VEHICLE_TYPES], r) as VehicleType,
      ownerName: makeOwner(r),
      ownerState: plate.slice(0, 2),
    };
  });

  // Create ~70 violations over last 30 days, weighted to recent days
  const violations: Violation[] = [];
  const totalCount = 72;
  for (let i = 0; i < totalCount; i++) {
    // Bias: some vehicles are repeat offenders (first 6)
    const vIdx = r() < 0.45
      ? Math.floor(r() * 6)
      : Math.floor(r() * vehicleCount);
    const v = vehicles[vIdx];
    const type = pick(VIOLATION_TYPES, r).key;
    const meta = VIOLATION_TYPES.find(t => t.key === type)!;
    const cam = pick(CAMERA_ZONES, r);

    // Day offset: bias toward last 10 days
    const dayOffset = Math.floor(Math.pow(r(), 1.6) * 30);
    const hour = Math.floor(r() * 24);
    const minute = Math.floor(r() * 60);
    const ts = NOW - dayOffset * 86400_000 - (24 - hour) * 3600_000 + minute * 60_000;

    // Status: most paid for old, more pending for recent
    let status: ViolationStatus;
    const rs = r();
    if (dayOffset > 14) status = rs < 0.85 ? "paid" : rs < 0.95 ? "pending" : "disputed";
    else if (dayOffset > 5) status = rs < 0.55 ? "paid" : rs < 0.9 ? "pending" : "disputed";
    else status = rs < 0.25 ? "paid" : rs < 0.92 ? "pending" : "disputed";

    violations.push({
      id: `VG-${String(100000 + i)}`,
      plate: v.plate,
      type,
      timestamp: ts,
      cameraId: cam.id,
      location: cam.area,
      fine: meta.defaultFine,
      status,
      confidence: 0.82 + r() * 0.17,
      vehicleType: v.vehicleType,
      ownerName: v.ownerName,
      ownerState: v.ownerState,
    });
  }
  violations.sort((a, b) => b.timestamp - a.timestamp);

  // Payments derived from paid violations
  const payments: PaymentRecord[] = violations
    .filter(v => v.status === "paid")
    .map((v, i) => ({
      id: `PAY-${String(50000 + i)}`,
      violationId: v.id,
      plate: v.plate,
      amount: v.fine,
      method: r() < 0.7 ? "upi" : "cash",
      timestamp: v.timestamp + 3600_000 * (1 + Math.floor(r() * 48)),
      receiptId: `RCPT-${String(900000 + i)}`,
    }));

  return { violations, payments, vehicles, now: NOW };
}
