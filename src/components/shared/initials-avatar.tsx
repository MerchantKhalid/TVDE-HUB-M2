import { cn, getInitials } from "@/lib/utils";

const tones = [
  "bg-primary/15 text-primary",
  "bg-accent/15 text-accent",
  "bg-gold/30 text-foreground",
] as const;

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-2xl",
} as const;

function toneFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % 997;
  return tones[hash % tones.length]!;
}

type InitialsAvatarProps = {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
};

export function InitialsAvatar({ name, size = "md", className }: InitialsAvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-2xl font-heading font-bold",
        sizes[size],
        toneFor(name),
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}