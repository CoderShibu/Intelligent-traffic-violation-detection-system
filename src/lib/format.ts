import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TZ = "Asia/Kolkata";

export function formatINR(n: number): string {
  return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
}

export function formatIST(d: Date | string | number): string {
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  return format(toZonedTime(date, TZ), "dd MMM yyyy, hh:mm a");
}

export function formatISTTime(d: Date | string | number): string {
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  return format(toZonedTime(date, TZ), "hh:mm:ss a");
}

export function formatISTShort(d: Date | string | number): string {
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  return format(toZonedTime(date, TZ), "dd MMM, hh:mm a");
}
