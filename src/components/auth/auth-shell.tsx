import { Card } from "@/components/ui/card";

type AuthShellProps = { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode };

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="container grid place-items-center py-10 md:py-16">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-extrabold md:text-4xl">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <Card className="space-y-6 p-6 md:p-8">{children}</Card>
        {footer && <p className="text-center text-sm text-muted-foreground">{footer}</p>}
      </div>
    </div>
  );
}
