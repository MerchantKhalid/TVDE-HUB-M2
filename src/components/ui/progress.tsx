import { cn } from "@/lib/utils";

type ProgressProps = { value: number; label: string; className?: string };

export function Progress({ value, label, className }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn("h-3 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          clamped >= 80 ? "bg-primary" : clamped >= 50 ? "bg-gold" : "bg-accent",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
