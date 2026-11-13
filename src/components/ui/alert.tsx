import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const styles = {
  error: { box: "border-accent/30 bg-accent/10", icon: AlertCircle, tone: "text-accent" },
  success: { box: "border-primary/30 bg-primary/10", icon: CheckCircle2, tone: "text-primary" },
  info: { box: "border-border bg-muted", icon: Info, tone: "text-muted-foreground" },
} as const;

type AlertProps = {
  variant?: keyof typeof styles;
  title?: string;
  children?: React.ReactNode;
  className?: string;
};

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  const { box, icon: Icon, tone } = styles[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-xl border p-4 text-sm", box, className)}
    >
      <Icon aria-hidden="true" className={cn("mt-0.5 h-5 w-5 shrink-0", tone)} />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-foreground/90">{children}</div>}
      </div>
    </div>
  );
}
