import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/shared/logo";
import { LegalNotice } from "@/components/shared/legal-notice";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("footer");

  const columns = [
    {
      title: t("company"),
      links: [
        { href: "/about", label: t("about") },
        { href: "/faq", label: t("faq") },
        { href: "/contact", label: t("contact") },
      ],
    },
    {
      title: t("legal"),
      links: [
        { href: "/privacy", label: t("privacy") },
        { href: "/terms", label: t("terms") },
        { href: "/cookies", label: t("cookies") },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t bg-card">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-sm text-sm text-muted-foreground">{t("tagline")}</p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide">
                {col.title}
              </h2>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10">
          <LegalNotice />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          {t("rights", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}