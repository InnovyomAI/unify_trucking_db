"use client";

import { useEffect } from "react";
import { classesFor } from "@/lib/license-classes";
import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";
import type { RegisterValues } from "@/lib/register-schemas";

const AIR_BRAKE_LABEL: Record<string, string> = {
  "CA-ON": "Air brake (Z)",
  "CA-MB": "Air brake (A)",
  "CA-AB": "Air brake (Q/endorsement)",
  "CA-SK": "Air brake",
  "CA-BC": "Air brake",
  "CA-QC": "Air brake (F endorsement)",
  "CA-NB": "Air brake",
  "CA-NL": "Air brake",
  "CA-NS": "Air brake",
  "CA-PE": "Air brake",
  // Territories (generic label)
  "CA-YT": "Air brake",
  "CA-NT": "Air brake",
  "CA-NU": "Air brake",
};

export default function LicenseClassSelect({
  register,
  setValue,
  watch,
  errors,
}: {
  register: UseFormRegister<RegisterValues>;
  setValue: UseFormSetValue<RegisterValues>;
  watch: UseFormWatch<RegisterValues>;
  errors: FieldErrors<RegisterValues>;
}) {
  const jurisdiction = watch("jurisdiction") as string | undefined;
  const currentClass = watch("licenseClass") as string | undefined;
  const allowed = jurisdiction ? classesFor(jurisdiction) : [];
  const label = AIR_BRAKE_LABEL[jurisdiction ?? ""] ?? "Air brake";

  // Reset class when jurisdiction changes to avoid stale / invalid selections
  useEffect(() => {
    setValue("licenseClass", "", { shouldValidate: true });
  }, [jurisdiction, setValue]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className="block text-sm text-slate-700">Licence class</span>
        <select
          {...register("licenseClass")}
          disabled={!jurisdiction}
          value={currentClass ?? ""}
          onChange={(e) => setValue("licenseClass", e.target.value, { shouldValidate: true })}
          className="mt-1 w-full rounded border border-slate-300 p-2"
        >
          <option value="" disabled>
            {jurisdiction ? "Select class" : "Select jurisdiction first"}
          </option>
          {jurisdiction && allowed.length === 0 && (
            <option value="" disabled>
              No classes found
            </option>
          )}
          {allowed.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors?.licenseClass?.message && (
          <p className="text-xs text-rose-600">
            {String(errors.licenseClass.message)}
          </p>
        )}
      </label>

      <label className="mt-6 inline-flex items-center gap-2">
        <input type="checkbox" {...register("airBrake")} className="h-4 w-4" />
        <span className="text-sm text-slate-700">{label}</span>
      </label>
    </div>
  );
}
