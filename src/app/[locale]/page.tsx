import { Building2, Car, MapPinned, type LucideIcon } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Entry = {
  key: "driver" | "fleet" | "customer";
  href: string;
  icon: LucideIcon;
  variant: "default" | "outline" | "accent";
};

const entries: Entry[] = [
  { key: "driver", href: "/register?role=driver", icon: Car, variant: "default" },
  { key: "fleet", href: "/register?role=fleet", icon: Building2, variant: "outline" },
  { key: "customer", href: "/request", icon: MapPinned, variant: "accent" },
];

const audiences = ["driver", "fleet", "customer"] as const;
const steps = ["step1", "step2", "step3"] as const;

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,rgb(var(--primary)/0.14),transparent)]"
        />
        <div className="container pb-12 pt-14 text-center md:pb-16 md:pt-24">
          <Reveal>
            <Badge>{t("hero.badge")}</Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] md:text-6xl">
              {t("hero.title")}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              {t("hero.subtitle")}
            </p>
          </Reveal>
        </div>

        {/* Three entry cards */}
        <div className="container pb-8">
          <ul className="grid gap-4 md:grid-cols-3">
            {entries.map((entry, i) => {
              const Icon = entry.icon;
              return (
                <li key={entry.key}>
                  <Reveal delay={0.1 + i * 0.07} className="h-full">
                    <Card className="flex h-full flex-col gap-5 p-6 transition-shadow hover:shadow-lift">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid h-12 w-12 place-items-center rounded-2xl",
                          entry.key === "customer"
                            ? "bg-accent/10 text-accent"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <div className="flex-1 space-y-1.5">
                        <h2 className="text-xl font-bold">{t(`entry.${entry.key}.title`)}</h2>
                        <p className="text-muted-foreground">{t(`entry.${entry.key}.description`)}</p>
                      </div>
                      <Button asChild variant={entry.variant} size="lg" className="w-full">
                        <Link href={entry.href}>{t(`entry.${entry.key}.cta`)}</Link>
                      </Button>
                    </Card>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="container pt-16" aria-labelledby="how-title">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="how-title" className="text-3xl font-extrabold md:text-4xl">
            {t("how.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("how.subtitle")}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {audiences.map((audience, i) => (
            <Reveal key={audience} delay={i * 0.07}>
              <Card className="h-full p-6">
                <h3 className="mb-5 text-lg font-bold">{t(`how.${audience}.title`)}</h3>
                <ol className="space-y-4">
                  {steps.map((step, n) => (
                    <li key={step} className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                      >
                        {n + 1}
                      </span>
                      <span className="text-sm leading-7 text-muted-foreground">
                        {t(`how.${audience}.${step}`)}
                      </span>
                    </li>
                  ))}
                </ol>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}