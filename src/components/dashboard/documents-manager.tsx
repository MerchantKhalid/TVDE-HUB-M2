"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, fieldA11y } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { deleteDocumentAction } from "@/lib/actions/documents";
import { DOCUMENT_RULES, UPLOAD_LIMITS, type DocumentRule } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { useFieldError } from "@/lib/use-field-error";
import { documentMetaSchema, type DocumentMetaInput } from "@/lib/validation/document";
import type { DocumentStatus, DocumentType } from "@prisma/client";

export type DocumentRow = {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  number: string | null;
  expiresAt: string | null;
  fileName: string;
  sizeBytes: number;
  rejectionReason: string | null;
  createdAt: string;
};

type DocumentsManagerProps = {
  documents: DocumentRow[];
  /** Document types the user may upload (their role) */
  allowedTypes: DocumentType[];
};

const statusVariant: Record<DocumentStatus, BadgeProps["variant"]> = {
  PENDING: "muted",
  APPROVED: "default",
  REJECTED: "accent",
  EXPIRED: "accent",
};

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentsManager({ documents, allowedTypes }: DocumentsManagerProps) {
  const t = useTranslations("documents");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const fieldError = useFieldError();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // One live (pending or approved) document per type: those types are not offered again.
  const liveTypes = new Set(documents.filter((d) => d.status === "PENDING" || d.status === "APPROVED").map((d) => d.type));
  const uploadable = allowedTypes.filter((type) => !liveTypes.has(type));

  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors },
  } = useForm<DocumentMetaInput>({
    resolver: zodResolver(documentMetaSchema),
    defaultValues: { type: uploadable[0] ?? allowedTypes[0], number: "", expiresAt: "" },
  });

  const selectedType = watch("type");
  const rule: DocumentRule | undefined = selectedType ? DOCUMENT_RULES[selectedType] : undefined;

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setFileError(null);

    if (!file) {
      setFileError("required");
      return;
    }
    if (file.size > UPLOAD_LIMITS.maxBytes) {
      setFileError("fileTooLarge");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("type", values.type);
      body.append("number", values.number);
      body.append("expiresAt", values.expiresAt);

      const response = await fetch("/api/upload/document", { method: "POST", body });
      const data = (await response.json()) as { error?: string; fieldErrors?: Record<string, string> };

      if (!response.ok) {
        if (data.fieldErrors) {
          for (const [field, message] of Object.entries(data.fieldErrors)) {
            setError(field as keyof DocumentMetaInput, { message });
          }
        }
        setServerError(data.error ?? "unknown");
        return;
      }

      toast.success(t("uploaded"));
      setFile(null);
      reset({ type: uploadable.find((type) => type !== values.type) ?? values.type, number: "", expiresAt: "" });
      router.refresh();
    } catch {
      setServerError("unknown");
    } finally {
      setUploading(false);
    }
  });

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteDocumentAction(id);
      setConfirmId(null);
      if (!result.ok) {
        toast.error(te.has(result.error) ? te(result.error) : te("unknown"));
        return;
      }
      toast.success(t("deleted"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Alert variant="info" title={t("privacyTitle")}>
        {t("privacyBody")}
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>{t("listTitle")}</CardTitle>
          <CardDescription>{t("listDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="grid place-items-center gap-2 rounded-2xl border border-dashed p-8 text-center">
              <FileText aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">{t("emptyTitle")}</p>
              <p className="max-w-sm text-sm text-muted-foreground">{t("emptyDescription")}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {documents.map((doc) => (
                <li key={doc.id} className="space-y-2 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold">{t(`types.${doc.type}`)}</p>
                      <p className="text-sm text-muted-foreground">
                        {doc.number && <>{t("number")}: {doc.number} · </>}
                        {doc.expiresAt && <>{t("expires")}: {formatDate(locale, doc.expiresAt)} · </>}
                        {doc.fileName} ({formatSize(doc.sizeBytes)})
                      </p>
                    </div>
                    <Badge variant={statusVariant[doc.status]}>{t(`status.${doc.status}`)}</Badge>
                  </div>

                  {doc.status === "REJECTED" && doc.rejectionReason && (
                    <Alert variant="error" title={t("rejectedReason")}>
                      {doc.rejectionReason}
                    </Alert>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a href={`/api/documents/${doc.id}/file`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink aria-hidden="true" className="h-4 w-4" />
                        {t("view")}
                      </a>
                    </Button>

                    {confirmId === doc.id ? (
                      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("confirmDelete")}>
                        <span className="text-sm font-semibold">
                          {doc.status === "APPROVED" ? t("confirmDeleteApproved") : t("confirmDelete")}
                        </span>
                        <Button type="button" size="sm" variant="accent" disabled={pending} onClick={() => remove(doc.id)}>
                          {t("delete")}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                          {t("cancel")}
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmId(doc.id)}>
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                        {t("delete")}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("uploadTitle")}</CardTitle>
          <CardDescription>{t("uploadDescription", { size: UPLOAD_LIMITS.maxBytes / 1024 / 1024 })}</CardDescription>
        </CardHeader>
        <CardContent>
          {uploadable.length === 0 ? (
            <Alert variant="success">{t("allUploaded")}</Alert>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              {serverError && serverError !== "validation" && (
                <Alert variant="error">{te.has(serverError) ? te(serverError) : te("unknown")}</Alert>
              )}

              <Field id="type" label={t("type")} error={fieldError(errors.type?.message)} required>
                <Select {...fieldA11y("type", fieldError(errors.type?.message))} {...register("type")}>
                  {uploadable.map((type) => (
                    <option key={type} value={type}>
                      {t(`types.${type}`)}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="number" label={t("number")} error={fieldError(errors.number?.message)} required={rule?.numberRequired}>
                  <Input autoComplete="off" {...fieldA11y("number", fieldError(errors.number?.message))} {...register("number")} />
                </Field>
                <Field
                  id="expiresAt"
                  label={t("expires")}
                  hint={rule?.expiryRequired ? undefined : t("expiresOptional")}
                  error={fieldError(errors.expiresAt?.message)}
                  required={rule?.expiryRequired}
                >
                  <Input
                    type="date"
                    {...fieldA11y("expiresAt", fieldError(errors.expiresAt?.message), rule?.expiryRequired ? undefined : t("expiresOptional"))}
                    {...register("expiresAt")}
                  />
                </Field>
              </div>

              <Field id="file" label={t("file")} hint={t("fileHint")} error={fileError ? (te.has(fileError) ? te(fileError) : fieldError(fileError)) : undefined} required>
                <Input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  className="h-auto py-2.5 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary"
                  {...fieldA11y("file", fileError ?? undefined, t("fileHint"))}
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setFileError(null);
                  }}
                />
              </Field>

              <Button type="submit" size="lg" disabled={uploading}>
                <Upload aria-hidden="true" className="h-5 w-5" />
                {uploading ? t("uploading") : t("upload")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
