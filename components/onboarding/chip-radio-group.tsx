"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";

export type ChipOption = {
  value: string;
  label: string;
};

type ChipRadioGroupProps = {
  name: string;
  legend: string;
  options: readonly ChipOption[] | ChipOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function ChipRadioGroup({
  name,
  legend,
  options,
  value,
  onChange,
  disabled = false,
  className,
}: ChipRadioGroupProps) {
  const legendId = useId();

  return (
    <div
      className={cn("chip-fieldset", disabled && "chip-fieldset--disabled", className)}
      role="group"
      aria-labelledby={legendId}
      aria-disabled={disabled || undefined}
    >
      <div id={legendId} className="chip-legend">
        {legend}
      </div>
      <div className="chips" role="radiogroup" aria-labelledby={legendId}>
        {options.map((opt) => (
          <label key={opt.value}>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
