import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="container grid min-h-[50vh] place-items-center py-24 text-center">
      <div className="space-y-4">
        <p className="font-heading text-6xl font-extrabold text-primary">404</p>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
        <Button asChild size="lg">
          <Link href="/">{t("cta")}</Link>
        </Button>
      </div>
    </div>
  );
}