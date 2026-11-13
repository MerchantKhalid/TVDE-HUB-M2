import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SaveBarProps = { dirty: boolean; pending: boolean; dirtyText: string; cleanText: string; saveLabel: string; savingLabel: string };

/** Sticky on mobile (sits above the bottom tab bar) so the primary action is always reachable. */
export function SaveBar({ dirty, pending, dirtyText, cleanText, saveLabel, savingLabel }: SaveBarProps) {
  return (
    <div className="sticky bottom-20 z-30 md:bottom-4">
      <Card className="flex items-center justify-between gap-3 p-3 shadow-lift">
        <p className="pl-2 text-sm text-muted-foreground" aria-live="polite">
          {dirty ? dirtyText : cleanText}
        </p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? savingLabel : saveLabel}
        </Button>
      </Card>
    </div>
  );
}
