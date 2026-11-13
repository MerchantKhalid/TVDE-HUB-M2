"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CarFront, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, fieldA11y } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { addVehicleAction, deleteVehicleAction } from "@/lib/actions/vehicles";
import { VEHICLE_TYPES } from "@/lib/constants";
import { useFieldError } from "@/lib/use-field-error";
import { vehicleSchema, type VehicleInput } from "@/lib/validation/vehicle";

export type VehicleRow = {
  id: string;
  make: string;
  model: string;
  year: number;
  type: (typeof VEHICLE_TYPES)[number];
  seats: number;
  licensePlate: string | null;
};

type VehiclesManagerProps = { vehicles: VehicleRow[]; maxVehicles: number };

export function VehiclesManager({ vehicles, maxVehicles }: VehiclesManagerProps) {
  const t = useTranslations("vehicles");
  const tv = useTranslations("enums.vehicleType");
  const te = useTranslations("errors");
  const router = useRouter();
  const fieldError = useFieldError();
  const [pending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const atLimit = vehicles.length >= maxVehicles;

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<VehicleInput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { make: "", model: "", year: new Date().getFullYear(), type: "STANDARD", seats: 4, licensePlate: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await addVehicleAction(values);
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            setError(field as keyof VehicleInput, { message });
          }
        }
        setServerError(result.error);
        return;
      }
      toast.success(t("added"));
      reset();
      router.refresh();
    });
  });

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteVehicleAction(id);
      setConfirmId(null);
      if (!result.ok) {
        toast.error(te.has(result.error) ? te(result.error) : te("unknown"));
        return;
      }
      toast.success(t("removed"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("listTitle")}</CardTitle>
          <CardDescription>{t("count", { count: vehicles.length, max: maxVehicles })}</CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="grid place-items-center gap-2 rounded-2xl border border-dashed p-8 text-center">
              <CarFront aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">{t("emptyTitle")}</p>
              <p className="max-w-sm text-sm text-muted-foreground">{t("emptyDescription")}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {vehicles.map((vehicle) => (
                <li key={vehicle.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="space-y-1">
                    <p className="font-semibold">
                      {vehicle.make} {vehicle.model}{" "}
                      <span className="font-normal text-muted-foreground">· {vehicle.year}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="muted">{tv(vehicle.type)}</Badge>
                      <Badge variant="outline">{t("seatsCount", { count: vehicle.seats })}</Badge>
                      {vehicle.licensePlate && (
                        <span className="text-xs text-muted-foreground">
                          {t("plate")}: {vehicle.licensePlate}
                        </span>
                      )}
                    </div>
                  </div>

                  {confirmId === vehicle.id ? (
                    <div className="flex items-center gap-2" role="group" aria-label={t("confirmRemove")}>
                      <span className="text-sm font-semibold">{t("confirmRemove")}</span>
                      <Button type="button" size="sm" variant="accent" disabled={pending} onClick={() => remove(vehicle.id)}>
                        {t("remove")}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                        {t("cancel")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={`${t("remove")}: ${vehicle.make} ${vehicle.model}`}
                      onClick={() => setConfirmId(vehicle.id)}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                      {t("remove")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("addTitle")}</CardTitle>
          <CardDescription>{t("addDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {atLimit ? (
            <Alert variant="info">{t("limitReached", { max: maxVehicles })}</Alert>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              {serverError && serverError !== "validation" && (
                <Alert variant="error">{te.has(serverError) ? te(serverError) : te("unknown")}</Alert>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="make" label={t("make")} error={fieldError(errors.make?.message)} required>
                  <Input placeholder="Toyota" {...fieldA11y("make", fieldError(errors.make?.message))} {...register("make")} />
                </Field>
                <Field id="model" label={t("model")} error={fieldError(errors.model?.message)} required>
                  <Input placeholder="Corolla" {...fieldA11y("model", fieldError(errors.model?.message))} {...register("model")} />
                </Field>
                <Field id="year" label={t("year")} error={fieldError(errors.year?.message)} required>
                  <Input
                    type="number"
                    inputMode="numeric"
                    {...fieldA11y("year", fieldError(errors.year?.message))}
                    {...register("year", { valueAsNumber: true })}
                  />
                </Field>
                <Field id="seats" label={t("seats")} error={fieldError(errors.seats?.message)} required>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={9}
                    {...fieldA11y("seats", fieldError(errors.seats?.message))}
                    {...register("seats", { valueAsNumber: true })}
                  />
                </Field>
                <Field id="type" label={t("type")} error={fieldError(errors.type?.message)} required>
                  <Select {...fieldA11y("type", fieldError(errors.type?.message))} {...register("type")}>
                    {VEHICLE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {tv(type)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field id="licensePlate" label={t("plate")} hint={t("plateHint")} error={fieldError(errors.licensePlate?.message)}>
                  <Input
                    placeholder="AA-00-BB"
                    autoCapitalize="characters"
                    {...fieldA11y("licensePlate", fieldError(errors.licensePlate?.message), t("plateHint"))}
                    {...register("licensePlate")}
                  />
                </Field>
              </div>
              <Button type="submit" size="lg" disabled={pending}>
                <Plus aria-hidden="true" className="h-5 w-5" />
                {pending ? t("adding") : t("add")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
