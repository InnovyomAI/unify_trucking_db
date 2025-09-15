"use client";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { RegisterValues } from "@/lib/register-schemas";

export default function StatusWizard({
  register,
  watch,
  setValue,
  errors,
}: {
  register: UseFormRegister<RegisterValues>;
  watch: UseFormWatch<RegisterValues>;
  setValue: UseFormSetValue<RegisterValues>;
  errors: FieldErrors<RegisterValues>;
}) {
  const citizenship = (watch("citizenship") ?? "CA") as RegisterValues["citizenship"];
  const residency = (watch("residencyCA") ?? "Citizen") as RegisterValues["residencyCA"];
  const _showPermitType = residency === "Work Permit"; // hidden for Study Permit

  // Reset dependent fields on category changes to avoid stale values
  function onCitizenshipChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as RegisterValues["citizenship"];
    setValue("citizenship", val, { shouldValidate: true });
    if (val === "Canadian Citizen") {
      setValue("passportCountry", undefined, { shouldValidate: true });
      setValue("passportNumber", undefined, { shouldValidate: true });
      setValue("docPassport", undefined, { shouldValidate: true });
    }
  }

  function _onResidencyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as RegisterValues["residencyCA"];
    setValue("residencyCA", val, { shouldValidate: true });

    // Clear PR/Permit-specific fields when switching
    if (val !== "Permanent Resident") setValue("prNumber", undefined, { shouldValidate: true });
    if (val !== "Work Permit" && val !== "Study Permit") {
      setValue("permitType", undefined, { shouldValidate: true });
      setValue("docPermit", undefined, { shouldValidate: true });
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Status in Canada</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Citizenship */}
        <label className="block">
          <span className="block text-sm text-slate-700">Citizenship</span>
          <select
            {...register("citizenship")}
            defaultValue={citizenship}
            onChange={onCitizenshipChange}
            className="mt-1 w-full rounded border border-slate-300 p-2"
          >
            <option value="Canadian Citizen">Canadian Citizen</option>
            {/* United States intentionally removed */}
            <option value="Non-Citizen">Non-Citizen</option>
          </select>
          {errors.citizenship?.message && (
            <p className="text-xs text-rose-600">{String(errors.citizenship.message)}</p>
          )}
        </label>

        {/* Residency in Canada */}
        <label className="block">
          <span className="block text-sm text-slate-700">Residency</span>
          {watch("citizenship") === "Canadian Citizen" ? (
            <input
              type="text"
              value="Citizen"
              readOnly
              className="mt-1 w-full rounded border border-slate-300 bg-slate-100 p-2 text-slate-600"
            />
          ) : (
            <select
              {...register("residencyCA")}
              className="mt-1 w-full rounded border border-slate-300 p-2"
              defaultValue=""
            >
              <option value="" disabled>Select residency</option>
              <option value="Permanent Resident">Permanent Resident</option>
              <option value="Work Permit">Work Permit</option>
              <option value="Study Permit">Study Permit</option>
            </select>
          )}
          {errors.residencyCA?.message && (
            <p className="text-xs text-rose-600">{errors.residencyCA.message as string}</p>
          )}
        </label>

      </div>
    </section>
  );
}
