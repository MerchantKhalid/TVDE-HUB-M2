"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { ChipGroup } from "@/components/ui/chip-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, fieldA11y } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";
import { saveFleetProfileAction } from "@/lib/actions/profile";
import type { ReferenceData } from "@/lib/reference-data";
import { useFieldError } from "@/lib/use-field-error";
import { fleetProfileSchema, type FleetProfileInput } from "@/lib/validation/profile";
import { PhotoUploader } from "./photo-uploader";
import { regionOptions, useLanguageOptions, useServiceTypeOptions } from "./profile-options";
import { SaveBar } from "./save-bar";

type FleetProfileFormProps = {
  initial: FleetProfileInput;
  logoUrl: string | null;
  reference: ReferenceData;
};

export function FleetProfileForm({ initial, logoUrl, reference }: FleetProfileFormProps) {
  const t = useTranslations("profile");
  const te = useTranslations("errors");
  const router = useRouter();
  const fieldError = useFieldError();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const serviceOptions = useServiceTypeOptions();
  const languageOptions = useLanguageOptions(reference.languages);
  const areaOptions = regionOptions(reference.regions);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FleetProfileInput>({
    resolver: zodResolver(fleetProfileSchema),
    defaultValues: initial,
  });

  const companyName = watch("companyName");

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await saveFleetProfileAction(values);
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            setError(field as keyof FleetProfileInput, { message });
          }
        }
        setServerError(result.error);
        toast.error(te.has(result.error) ? te(result.error) : te("unknown"));
        return;
      }
      toast.success(t("saved"));
      reset(values);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {serverError && serverError !== "validation" && (
        <Alert variant="error">{te.has(serverError) ? te(serverError) : te("unknown")}</Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.company")}</CardTitle>
          <CardDescription>{t("sections.companyDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <PhotoUploader kind="FLEET" name={companyName || initial.companyName} currentUrl={logoUrl} />

          <Field id="companyName" label={t("fleet.companyName")} error={fieldError(errors.companyName?.message)} required>
            <Input
              autoComplete="organization"
              {...fieldA11y("companyName", fieldError(errors.companyName?.message))}
              {...register("companyName")}
            />
          </Field>

          <Field id="description" label={t("fleet.description")} hint={t("fleet.descriptionHint")} error={fieldError(errors.description?.message)}>
            <Textarea
              rows={5}
              {...fieldA11y("description", fieldError(errors.description?.message), t("fleet.descriptionHint"))}
              {...register("description")}
            />
          </Field>

          <Field id="website" label={t("fleet.website")} error={fieldError(errors.website?.message)}>
            <Input
              type="url"
              inputMode="url"
              placeholder="https://"
              {...fieldA11y("website", fieldError(errors.website?.message))}
              {...register("website")}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.private")}</CardTitle>
          <CardDescription>{t("sections.privateDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field id="contactEmail" label={t("fleet.contactEmail")} error={fieldError(errors.contactEmail?.message)}>
            <Input
              type="email"
              inputMode="email"
              {...fieldA11y("contactEmail", fieldError(errors.contactEmail?.message))}
              {...register("contactEmail")}
            />
          </Field>
          <Field id="phone" label={t("phone")} error={fieldError(errors.phone?.message)}>
            <Input
              type="tel"
              inputMode="tel"
              placeholder="+351 21 000 0000"
              {...fieldA11y("phone", fieldError(errors.phone?.message))}
              {...register("phone")}
            />
          </Field>
          <Field id="nif" label={t("fleet.nif")} hint={t("fleet.nifHint")} error={fieldError(errors.nif?.message)}>
            <Input
              inputMode="numeric"
              maxLength={9}
              {...fieldA11y("nif", fieldError(errors.nif?.message), t("fleet.nifHint"))}
              {...register("nif")}
            />
          </Field>
          <Field id="operatorLicenceNumber" label={t("fleet.operatorLicenceNumber")} error={fieldError(errors.operatorLicenceNumber?.message)}>
            <Input
              {...fieldA11y("operatorLicenceNumber", fieldError(errors.operatorLicenceNumber?.message))}
              {...register("operatorLicenceNumber")}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.offer")}</CardTitle>
          <CardDescription>{t("sections.offerDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Controller
            control={control}
            name="serviceTypes"
            render={({ field }) => (
              <ChipGroup
                legend={t("serviceTypes")}
                hint={t("serviceTypesHint")}
                options={serviceOptions}
                value={field.value}
                onChange={field.onChange}
                error={fieldError(errors.serviceTypes?.message)}
              />
            )}
          />

          <Controller
            control={control}
            name="languages"
            render={({ field }) => (
              <ChipGroup
                legend={t("fleet.languages")}
                hint={t("fleet.languagesHint")}
                options={languageOptions}
                value={field.value}
                onChange={field.onChange}
                error={fieldError(errors.languages?.message)}
              />
            )}
          />

          <Field id="termsOffered" label={t("fleet.termsOffered")} hint={t("fleet.termsOfferedHint")} error={fieldError(errors.termsOffered?.message)}>
            <Textarea
              rows={4}
              {...fieldA11y("termsOffered", fieldError(errors.termsOffered?.message), t("fleet.termsOfferedHint"))}
              {...register("termsOffered")}
            />
          </Field>

          <Controller
            control={control}
            name="showDriversPublicly"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/40 p-4">
                <div className="space-y-0.5">
                  <label htmlFor="showDriversPublicly" className="text-sm font-semibold">
                    {t("fleet.showDriversPublicly")}
                  </label>
                  <p className="text-sm text-muted-foreground">{t("fleet.showDriversPubliclyHint")}</p>
                </div>
                <Switch
                  id="showDriversPublicly"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  label={t("fleet.showDriversPublicly")}
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.location")}</CardTitle>
          <CardDescription>{t("sections.locationDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field id="cityId" label={t("city")} error={fieldError(errors.cityId?.message)}>
            <Select {...fieldA11y("cityId", fieldError(errors.cityId?.message))} {...register("cityId")}>
              <option value="">{t("selectCity")}</option>
              {reference.cityGroups.map((group) => (
                <optgroup key={group.regionId} label={group.regionName}>
                  {group.cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>

          <Controller
            control={control}
            name="serviceAreaIds"
            render={({ field }) => (
              <ChipGroup
                legend={t("serviceAreas")}
                hint={t("serviceAreasHint")}
                options={areaOptions}
                value={field.value}
                onChange={field.onChange}
                error={fieldError(errors.serviceAreaIds?.message)}
              />
            )}
          />
        </CardContent>
      </Card>

      <SaveBar
        dirty={isDirty}
        pending={pending}
        dirtyText={t("unsaved")}
        cleanText={t("allSaved")}
        saveLabel={t("save")}
        savingLabel={t("saving")}
      />
    </form>
  );
}
