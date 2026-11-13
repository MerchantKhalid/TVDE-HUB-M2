"use client";

import { Camera, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/shared/profile-avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { UPLOAD_LIMITS } from "@/lib/constants";

type PhotoUploaderProps = {
  kind: "DRIVER" | "FLEET";
  name: string;
  currentUrl: string | null;
};

export function PhotoUploader({ kind, name, currentUrl }: PhotoUploaderProps) {
  const t = useTranslations("profile.photo");
  const te = useTranslations("errors");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(currentUrl);
  const [busy, setBusy] = useState(false);

  const label = kind === "DRIVER" ? "photo" : "logo";

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > UPLOAD_LIMITS.maxBytes) {
      toast.error(te("fileTooLarge"));
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload/photo", { method: "POST", body });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        toast.error(data.error && te.has(data.error) ? te(data.error) : te("unknown"));
        return;
      }
      setUrl(data.url);
      toast.success(t("uploaded"));
      router.refresh();
    } catch {
      toast.error(te("unknown"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onRemove() {
    setBusy(true);
    try {
      const response = await fetch("/api/upload/photo", { method: "DELETE" });
      if (!response.ok) {
        toast.error(te("unknown"));
        return;
      }
      setUrl(null);
      toast.success(t("removed"));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <ProfileAvatar name={name} imageUrl={url} size="lg" />
      <div className="space-y-2">
        <p className="text-sm font-semibold">{t(label)}</p>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            id="photo-input"
            onChange={(event) => onFile(event.target.files?.[0])}
            disabled={busy}
          />
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            <Camera aria-hidden="true" className="h-4 w-4" />
            {busy ? t("uploading") : url ? t("change") : t("upload")}
          </Button>
          {url && (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onRemove}>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              {t("remove")}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </div>
    </div>
  );
}
