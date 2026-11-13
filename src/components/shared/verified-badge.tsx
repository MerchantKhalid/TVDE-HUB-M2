import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

export function VerifiedBadge({ className }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <Badge variant="gold" className={className}>
      <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
      {t("verified")}
    </Badge>
  );
}