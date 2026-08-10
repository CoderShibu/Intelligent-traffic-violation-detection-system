// Deterministic PRNG (mulberry32) for reproducible mock data
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STATE_CODES = ["KA", "MH", "DL", "TN", "AP", "TS", "KL", "GJ", "UP", "RJ"];
const LETTERS = "ABCDEFGHJKLMNPRSTUVWXYZ";

export function makePlate(r: () => number): string {
  const st = STATE_CODES[Math.floor(r() * STATE_CODES.length)];
  const dist = String(1 + Math.floor(r() * 60)).padStart(2, "0");
  const a = LETTERS[Math.floor(r() * LETTERS.length)] + LETTERS[Math.floor(r() * LETTERS.length)];
  const num = String(1000 + Math.floor(r() * 9000));
  return `${st}-${dist}-${a}-${num}`;
}

const FIRST = ["Rohan", "Ananya", "Vikram", "Priya", "Arjun", "Meera", "Karthik", "Sneha", "Rahul", "Divya", "Aditya", "Pooja", "Sanjay", "Neha", "Manoj"];
const LAST = ["Sharma", "Iyer", "Reddy", "Patel", "Nair", "Kumar", "Gowda", "Rao", "Menon", "Shetty", "Verma", "Singh"];

export function makeOwner(r: () => number) {
  return `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
}

export const VEHICLE_TYPES = ["bike", "car", "truck"] as const;
export type VehicleType = typeof VEHICLE_TYPES[number];
