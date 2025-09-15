"use client";

import { useState } from "react";
import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";
import type { RegisterValues } from "@/lib/register-schemas";

export default function PhoneInput({
  register,
  setValue,
  errors,
}: {
  register: UseFormRegister<RegisterValues>;
  setValue: UseFormSetValue<RegisterValues>;
  watch: UseFormWatch<RegisterValues>;
  errors: FieldErrors<RegisterValues>;
}) {
  const [display, setDisplay] = useState("");

  return (
    <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
      <label className="block">
        <span className="block text-sm text-slate-700">Country</span>
        <select
          {...register("phoneCountry")}
          defaultValue="CA"
          className="mt-1 w-full rounded border border-slate-300 p-2"
        >
          <option value="CA">Canada (+1)</option>
          {/* United States intentionally removed as per requirement */}
        </select>
      </label>

      <label className="block">
        <span className="block text-sm text-slate-700">Phone</span>
        <input
          {...register("phone")}
          value={display}
          onChange={(e) => {
            // Keep only digits
            const digits = e.target.value.replace(/\D/g, "");
            // Max length: 10 digits for Canadian numbers
            const truncated = digits.slice(0, 10);
            setDisplay(truncated);
            setValue("phone", truncated, { shouldValidate: true });
          }}
          inputMode="numeric"
          pattern="\d{10}"
          className="mt-1 w-full rounded border border-slate-300 p-2"
          placeholder="2045551234"
        />
        {errors.phone?.message && (
          <p className="text-xs text-rose-600">
            {errors.phone.message as string}
          </p>
        )}
      </label>
    </div>
  );
}
