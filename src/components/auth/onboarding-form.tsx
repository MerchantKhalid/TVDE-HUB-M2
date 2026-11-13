"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Car } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChoiceCards, type ChoiceOption } from "@/components/ui/choice-cards";
import { Link, useRouter } from "@/i18n/navigation";
import { completeOnboardingAction } from "@/lib/actions/auth";
import { useFieldError } from "@/lib/use-field-error";
import { onboardingSchema, type OnboardingInput } from "@/lib/validation/auth";

type OnboardingFormProps = { needsConsent: boolean; initialRole?: "DRIVER" | "FLEET" };

export function OnboardingForm({ needsConsent, initialRole }: OnboardingFormProps) {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const router = useRouter();
  const fieldError = useFieldError();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { role: initialRole, consent: !needsConsent },
  });

  const roleOptions: ChoiceOption<"DRIVER" | "FLEET">[] = [
    { value: "DRIVER", title: t("roleDriverTitle"), description: t("roleDriverDescription"), icon: Car },
    { value: "FLEET", title: t("roleFleetTitle"), description: t("roleFleetDescription"), icon: Building2 },
  ];

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    if (needsConsent && !values.consent) {
      setError("consent", { message: "consentRequired" });
      return;
    }
    startTransition(async () => {
      const result = await completeOnboardingAction(values);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      router.replace("/dashboard/profile");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {serverError && serverError !== "validation" && (
        <Alert variant="error">{te.has(serverError) ? te(serverError) : te("unknown")}</Alert>
      )}

      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <ChoiceCards
            legend={t("iAm")}
            name="role"
            options={roleOptions}
            value={field.value}
            onChange={field.onChange}
            error={fieldError(errors.role?.message)}
          />
        )}
      />

      {needsConsent && (
        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 rounded accent-primary"
              aria-invalid={errors.consent ? true : undefined}
              {...register("consent")}
            />
            <span>
              {t.rich("consent", {
                terms: (chunks) => (
                  <Link href="/terms" className="font-semibold text-primary underline-offset-4 hover:underline">
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link href="/privacy" className="font-semibold text-primary underline-offset-4 hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          {errors.consent && (
            <p role="alert" className="text-sm font-medium text-accent">
              {fieldError(errors.consent.message)}
            </p>
          )}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t("creatingAccount") : t("onboardingSubmit")}
      </Button>
    </form>
  );
}
