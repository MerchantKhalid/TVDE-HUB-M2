import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-lg font-heading text-lg font-extrabold tracking-tight"
      aria-label={siteConfig.name}
    >
      <span
        aria-hidden="true"
        className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"
      >
        T
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent" />
      </span>
      <span>
        TVDE <span className="text-primary">Hub</span>
      </span>
    </Link>
  );
}