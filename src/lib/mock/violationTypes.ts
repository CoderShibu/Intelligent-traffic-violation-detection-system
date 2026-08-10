import {
  HardHat,
  ArrowLeftRight,
  TrafficCone,
  ShieldAlert,
  Gauge,
  Smartphone,
  ParkingSquare,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ViolationTypeKey =
  | "no_helmet"
  | "wrong_side"
  | "signal_jump"
  | "no_seatbelt"
  | "overspeeding"
  | "mobile_driving"
  | "illegal_parking"
  | "triple_riding";

export interface ViolationTypeMeta {
  key: ViolationTypeKey;
  label: string;
  icon: LucideIcon;
  color: string;       // tailwind text color
  bg: string;          // tailwind bg color (badge)
  hex: string;         // chart color
  defaultFine: number;
}

export const VIOLATION_TYPES: ViolationTypeMeta[] = [
  { key: "no_helmet",       label: "No Helmet",          icon: HardHat,        color: "text-red-300",     bg: "bg-red-500/15 border-red-500/40",         hex: "#ef4444", defaultFine: 1000 },
  { key: "wrong_side",      label: "Wrong Side Riding",  icon: ArrowLeftRight, color: "text-orange-300",  bg: "bg-orange-500/15 border-orange-500/40",   hex: "#f97316", defaultFine: 1500 },
  { key: "signal_jump",     label: "Signal Jump",        icon: TrafficCone,    color: "text-yellow-300",  bg: "bg-yellow-500/15 border-yellow-500/40",   hex: "#eab308", defaultFine: 1500 },
  { key: "no_seatbelt",     label: "No Seatbelt",        icon: ShieldAlert,    color: "text-blue-300",    bg: "bg-blue-500/15 border-blue-500/40",       hex: "#3b82f6", defaultFine: 1000 },
  { key: "overspeeding",    label: "Overspeeding",       icon: Gauge,          color: "text-purple-300",  bg: "bg-purple-500/15 border-purple-500/40",   hex: "#a855f7", defaultFine: 2000 },
  { key: "mobile_driving",  label: "Mobile While Driving", icon: Smartphone,   color: "text-zinc-300",    bg: "bg-zinc-500/15 border-zinc-500/40",       hex: "#a1a1aa", defaultFine: 2500 },
  { key: "illegal_parking", label: "Illegal Parking",    icon: ParkingSquare,  color: "text-teal-300",    bg: "bg-teal-500/15 border-teal-500/40",       hex: "#14b8a6", defaultFine: 500 },
  { key: "triple_riding",   label: "Triple Riding",      icon: Users,          color: "text-indigo-300",  bg: "bg-indigo-500/15 border-indigo-500/40",   hex: "#6366f1", defaultFine: 1200 },
];

export const VT_MAP: Record<ViolationTypeKey, ViolationTypeMeta> =
  Object.fromEntries(VIOLATION_TYPES.map(v => [v.key, v])) as never;
