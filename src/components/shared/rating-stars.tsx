import { Star } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type RatingStarsProps = {
  rating: number;
  count?: number;
  className?: string;
};

export function RatingStars({ rating, count, className }: RatingStarsProps) {
  const t = useTranslations("common");
  const format = useFormatter();
  const value = format.number(rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span role="img" aria-label={t("ratingLabel", { rating: value })} className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            aria-hidden="true"
            className={cn(
              "h-4 w-4",
              rating >= n - 0.25 ? "fill-gold text-gold" : "fill-transparent text-border",
            )}
          />
        ))}
      </span>
      <span className="text-sm font-semibold">{value}</span>
      {typeof count === "number" && (
        <span className="text-sm text-muted-foreground">({t("reviews", { count })})</span>
      )}
    </div>
  );
}