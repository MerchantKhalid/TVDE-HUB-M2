import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

export function LegalNotice() {
  const t = useTranslations("legal");
  return (
    <aside
      aria-label={t("noticeTitle")}
      className="flex gap-3 rounded-2xl border bg-muted/60 p-4 text-sm text-muted-foreground"
    >
      <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>{t("notice")}</p>
    </aside>
  );
}