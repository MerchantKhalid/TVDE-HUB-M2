"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export type ChipOption = { value: string; label: string; prefix?: string };

type ChipGroupProps = {
  legend: string;
  options: ChipOption[];
  value: string[];
  onChange: (next: string[]) => void;
  hint?: string;
  error?: string;
};

/** Multi-select rendered as pill checkboxes. Real checkboxes, so keyboard and screen readers just work. */
export function ChipGroup({ legend, options, value, onChange, hint, error }: ChipGroupProps) {
  const id = useId();

  const toggle = (optionValue: string) => {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]);
  };

  return (
    <fieldset aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} className="space-y-2">
      <legend className="text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option.value);
          return (
            <label key={option.value} className="cursor-pointer">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={checked}
                onChange={() => toggle(option.value)}
              />
              <span
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                  checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted",
                )}
              >
                {option.prefix && <span aria-hidden="true">{option.prefix}</span>}
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-accent">
          {error}
        </p>
      )}
    </fieldset>
  );
}
