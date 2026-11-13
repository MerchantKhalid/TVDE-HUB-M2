"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChoiceOption<T extends string> = {
  value: T;
  title: string;
  description: string;
  icon: LucideIcon;
};

type ChoiceCardsProps<T extends string> = {
  legend: string;
  name: string;
  options: ChoiceOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string;
};

/** Large radio cards, used to pick "driver" or "fleet owner". */
export function ChoiceCards<T extends string>({ legend, name, options, value, onChange, error }: ChoiceCardsProps<T>) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const checked = value === option.value;
          const Icon = option.icon;
          return (
            <label key={option.value} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-full gap-3 rounded-2xl border p-4 transition-all",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                  checked ? "border-primary bg-primary/10 shadow-soft" : "bg-card hover:bg-muted",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    checked ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="space-y-0.5">
                  <span className="block font-heading font-bold">{option.title}</span>
                  <span className="block text-sm text-muted-foreground">{option.description}</span>
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-accent">
          {error}
        </p>
      )}
    </fieldset>
  );
}
