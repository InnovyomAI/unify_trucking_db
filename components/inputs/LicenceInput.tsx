"use client";

import { formatLicence } from "@/lib/license-rules";
import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";
import type { RegisterValues } from "@/lib/register-schemas";

export default function LicenceInput({
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
  const jurisdiction = watch("jurisdiction") as string;

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const t = e.target as HTMLInputElement;
    // Clean: uppercase, strip invalids
    let v = t.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    // Apply jurisdiction-specific formatting
    v = formatLicence(jurisdiction, v);
    t.value = v;
    setValue("licenseNo", v, { shouldValidate: true });
  }

  return (
    <label className="block">
      <span className="block text-sm text-slate-700">Licence number</span>
      <input
        {...register("licenseNo")}
        className="mt-1 w-full rounded border border-slate-300 p-2 font-mono tracking-wider"
        placeholder={maskHint(jurisdiction)}
        onInput={handleInput}
        maxLength={20}
        autoComplete="off"
      />
      {errors.licenseNo?.message && (
        <p className="text-xs text-rose-600">
          {errors.licenseNo.message as string}
        </p>
      )}
      <p className="mt-1 text-xs text-slate-500">
        Enter only letters/numbers (formatting applied automatically).
      </p>
    </label>
  );
}

function maskHint(j: string): string {
  switch (j) {
    case "CA-ON":
      return "A####-#####-#####";
    case "CA-BC":
      return "####### or ########";
    case "CA-AB":
      return "######-### or 5–9 digits";
    case "CA-SK":
      return "########";
    case "CA-QC":
      return "A############";
    case "CA-NL":
      return "A#########";
    case "CA-MB":
      return "####### (7 digits)";
    case "CA-NB":
    case "CA-NS":
    case "CA-PE":
      return "Up to 8 digits";
    default:
      return "Up to 15 letters/digits";
  }
}
