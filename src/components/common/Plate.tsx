import { cn } from "@/lib/utils";

export function Plate({ value, size = "md", className }: { value: string; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span className={cn("plate", size === "sm" && "plate-sm", size === "lg" && "plate-lg", className)}>
      {value}
    </span>
  );
}
