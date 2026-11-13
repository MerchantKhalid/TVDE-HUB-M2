"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Car, Eye, EyeOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChoiceCards, type ChoiceOption } from "@/components/ui/choice-cards";
import { Field, fieldA11y } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { registerAction } from "@/lib/actions/auth";
import { useFieldError } from "@/lib/use-field-error";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";

type RegisterFormProps = { initialRole?: "DRIVER" | "FLEET" };

export function RegisterForm({ initialRole }: RegisterFormProps) {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const locale = useLocale();
  const fieldError = useFieldError();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", role: initialRole, consent: false as unknown as true },
  });

  const roleOptions: ChoiceOption<"DRIVER" | "FLEET">[] = [
    { value: "DRIVER", title: t("roleDriverTitle"), description: t("roleDriverDescription"), icon: Car },
    { value: "FLEET", title: t("roleFleetTitle"), description: t("roleFleetDescription"), icon: Building2 },
  ];

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await registerAction(values, locale);
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            setError(field as keyof RegisterInput, { message });
          }
        }
        setServerError(result.error);
        return;
      }
      setRedirecting(true);
      window.location.assign(result.data?.redirectTo ?? `/${locale}/dashboard/profile`);
    });
  });

  const busy = pending || redirecting;

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

      <Field
        id="name"
        label={t("name")}
        hint={t("nameHint")}
        error={fieldError(errors.name?.message)}
        required
      >
        <Input
          autoComplete="name"
          {...fieldA11y("name", fieldError(errors.name?.message), t("nameHint"))}
          {...register("name")}
        />
      </Field>

      <Field id="email" label={t("email")} error={fieldError(errors.email?.message)} required>
        <Input
          type="email"
          autoComplete="email"
          inputMode="email"
          {...fieldA11y("email", fieldError(errors.email?.message))}
          {...register("email")}
        />
      </Field>

      <Field
        id="password"
        label={t("password")}
        hint={t("passwordHint")}
        error={fieldError(errors.password?.message)}
        required
      >
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            className="pr-12"
            {...fieldA11y("password", fieldError(errors.password?.message), t("passwordHint"))}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            aria-pressed={showPassword}
            className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </Field>

      <div className="space-y-1.5">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 rounded accent-primary"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "consent-error" : undefined}
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
          <p id="consent-error" role="alert" className="text-sm font-medium text-accent">
            {fieldError(errors.consent.message)}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? t("creatingAccount") : t("registerSubmit")}
      </Button>
    </form>
  );
}
