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
import { useRouter } from "@/i18n/navigation";
import { saveDriverProfileAction } from "@/lib/actions/profile";
import { AVAILABILITY_STATUSES } from "@/lib/constants";
import type { ReferenceData } from "@/lib/reference-data";
import { useFieldError } from "@/lib/use-field-error";
import { driverProfileSchema, type DriverProfileInput } from "@/lib/validation/profile";
import { PhotoUploader } from "./photo-uploader";
import { regionOptions, useLanguageOptions, useServiceTypeOptions } from "./profile-options";
import { SaveBar } from "./save-bar";

type DriverProfileFormProps = {
  initial: DriverProfileInput;
  photoUrl: string | null;
  reference: ReferenceData;
};

export function DriverProfileForm({ initial, photoUrl, reference }: DriverProfileFormProps) {
  const t = useTranslations("profile");
  const ta = useTranslations("enums.availability");
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
  } = useForm<DriverProfileInput>({
    resolver: zodResolver(driverProfileSchema),
    defaultValues: initial,
  });

  const displayName = watch("displayName");

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await saveDriverProfileAction(values);
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            setError(field as keyof DriverProfileInput, { message });
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
          <CardTitle>{t("sections.about")}</CardTitle>
          <CardDescription>{t("sections.aboutDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <PhotoUploader kind="DRIVER" name={displayName || initial.displayName} currentUrl={photoUrl} />

          <Field id="displayName" label={t("driver.displayName")} error={fieldError(errors.displayName?.message)} required>
            <Input autoComplete="name" {...fieldA11y("displayName", fieldError(errors.displayName?.message))} {...register("displayName")} />
          </Field>

          <Field id="bio" label={t("driver.bio")} hint={t("driver.bioHint")} error={fieldError(errors.bio?.message)}>
            <Textarea rows={5} {...fieldA11y("bio", fieldError(errors.bio?.message), t("driver.bioHint"))} {...register("bio")} />
          </Field>

          <Field id="phone" label={t("phone")} hint={t("phoneHint")} error={fieldError(errors.phone?.message)}>
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+351 912 345 678"
              {...fieldA11y("phone", fieldError(errors.phone?.message), t("phoneHint"))}
              {...register("phone")}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("sections.work")}</CardTitle>
          <CardDescription>{t("sections.workDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="yearsExperience" label={t("driver.yearsExperience")} error={fieldError(errors.yearsExperience?.message)}>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={60}
                {...fieldA11y("yearsExperience", fieldError(errors.yearsExperience?.message))}
                {...register("yearsExperience", { valueAsNumber: true })}
              />
            </Field>
            <Field id="availability" label={t("driver.availability")}>
              <Select id="availability" {...register("availability")}>
                {AVAILABILITY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ta(status)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

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
                legend={t("languages")}
                hint={t("languagesHint")}
                options={languageOptions}
                value={field.value}
                onChange={field.onChange}
                error={fieldError(errors.languages?.message)}
              />
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
