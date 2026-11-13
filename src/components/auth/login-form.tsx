"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, fieldA11y } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/actions/auth";
import { useFieldError } from "@/lib/use-field-error";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export function LoginForm() {
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
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(values, locale);
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      setRedirecting(true);
      // Full navigation so the client session (header buttons) refreshes too.
      window.location.assign(result.data?.redirectTo ?? `/${locale}/dashboard`);
    });
  });

  const busy = pending || redirecting;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {serverError && <Alert variant="error">{te.has(serverError) ? te(serverError) : te("unknown")}</Alert>}

      <Field id="email" label={t("email")} error={fieldError(errors.email?.message)} required>
        <Input
          type="email"
          autoComplete="email"
          inputMode="email"
          {...fieldA11y("email", fieldError(errors.email?.message))}
          {...register("email")}
        />
      </Field>

      <Field id="password" label={t("password")} error={fieldError(errors.password?.message)} required>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pr-12"
            {...fieldA11y("password", fieldError(errors.password?.message))}
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

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? t("signingIn") : t("loginSubmit")}
      </Button>
    </form>
  );
}
