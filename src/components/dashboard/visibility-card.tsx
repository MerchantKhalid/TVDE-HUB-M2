"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";
import { setAvailabilityAction, setPublishedAction } from "@/lib/actions/profile";
import { AVAILABILITY_STATUSES } from "@/lib/constants";

type VisibilityCardProps = {
  kind: "DRIVER" | "FLEET";
  published: boolean;
  publishable: boolean;
  /** i18n keys under "completeness.blockers" */
  blockers: string[];
  availability?: (typeof AVAILABILITY_STATUSES)[number];
};

export function VisibilityCard({ kind, published, publishable, blockers, availability }: VisibilityCardProps) {
  const t = useTranslations("dashboard.visibility");
  const tb = useTranslations("completeness.blockers");
  const ta = useTranslations("enums.availability");
  const te = useTranslations("errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isPublished, setIsPublished] = useState(published);
  const [currentAvailability, setCurrentAvailability] = useState(availability);

  function togglePublished(next: boolean) {
    startTransition(async () => {
      const result = await setPublishedAction(next);
      if (!result.ok) {
        toast.error(te.has(result.error) ? te(result.error) : te("unknown"));
        return;
      }
      setIsPublished(next);
      toast.success(next ? t("nowPublic") : t("nowHidden"));
      router.refresh();
    });
  }

  function changeAvailability(value: string) {
    startTransition(async () => {
      const result = await setAvailabilityAction(value);
      if (!result.ok) {
        toast.error(te.has(result.error) ? te(result.error) : te("unknown"));
        return;
      }
      setCurrentAvailability(value as (typeof AVAILABILITY_STATUSES)[number]);
      toast.success(t("availabilityUpdated"));
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t(kind === "DRIVER" ? "descriptionDriver" : "descriptionFleet")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/40 p-4">
          <div className="flex items-center gap-3">
            {isPublished ? (
              <Eye aria-hidden="true" className="h-5 w-5 text-primary" />
            ) : (
              <EyeOff aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <label htmlFor="published-switch" className="text-sm font-semibold">
                {isPublished ? t("public") : t("hidden")}
              </label>
              <p className="text-sm text-muted-foreground">{isPublished ? t("publicHint") : t("hiddenHint")}</p>
            </div>
          </div>
          <Switch
            id="published-switch"
            checked={isPublished}
            onCheckedChange={togglePublished}
            disabled={pending || (!isPublished && !publishable)}
            label={t("title")}
          />
        </div>

        {!publishable && (
          <Alert variant="info" title={t("needsBeforePublishing")}>
            <ul className="list-disc space-y-0.5 pl-5">
              {blockers.map((blocker) => (
                <li key={blocker}>{tb(blocker)}</li>
              ))}
            </ul>
          </Alert>
        )}

        {kind === "DRIVER" && currentAvailability && (
          <div className="space-y-1.5">
            <label htmlFor="availability-quick" className="text-sm font-semibold">
              {t("availability")}
            </label>
            <Select
              id="availability-quick"
              value={currentAvailability}
              disabled={pending}
              onChange={(event) => changeAvailability(event.target.value)}
            >
              {AVAILABILITY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ta(status)}
                </option>
              ))}
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
