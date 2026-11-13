import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/shared/logo";
import { Link } from "@/i18n/navigation";
import { AuthButtons } from "./auth-buttons";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

export async function Header() {
  const t = await getTranslations();

  const links = [
    { href: "/drivers", label: t("nav.drivers") },
    { href: "/fleets", label: t("nav.fleets") },
    { href: "/request", label: t("nav.request") },
    { href: "/about", label: t("nav.about") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label={t("common.mainNavigation")} className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="hidden items-center gap-2 md:flex">
            <AuthButtons layout="desktop" />
          </div>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
