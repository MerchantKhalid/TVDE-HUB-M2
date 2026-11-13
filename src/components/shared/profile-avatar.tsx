import Image from "next/image";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { cn } from "@/lib/utils";

const px = { sm: 36, md: 48, lg: 80 } as const;

type ProfileAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: keyof typeof px;
  className?: string;
};

/** Photo or logo when available, otherwise initials. */
export function ProfileAvatar({ name, imageUrl, size = "md", className }: ProfileAvatarProps) {
  if (!imageUrl) return <InitialsAvatar name={name} size={size} className={className} />;
  return (
    <Image
      src={imageUrl}
      alt={name}
      width={px[size]}
      height={px[size]}
      className={cn("shrink-0 rounded-2xl object-cover", className)}
      style={{ width: px[size], height: px[size] }}
    />
  );
}
