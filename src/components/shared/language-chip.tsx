import { Badge } from "@/components/ui/badge";

type LanguageChipProps = {
  flag: string;
  label: string;
};

export function LanguageChip({ flag, label }: LanguageChipProps) {
  return (
    <Badge variant="muted">
      <span aria-hidden="true">{flag}</span>
      {label}
    </Badge>
  );
}