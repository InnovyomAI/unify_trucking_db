"use client";

import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";
import type { RegisterValues } from "@/lib/register-schemas";

export default function AddressCountrySelect({
  register,
  setValue,
  watch,
  errors,
  label = "Country",
}: {
  register: UseFormRegister<RegisterValues>;
  setValue: UseFormSetValue<RegisterValues>;
  watch: UseFormWatch<RegisterValues>;
  errors: FieldErrors<RegisterValues>;
  label?: string;
}) {
  const country = (watch("addressCountry") || "") as RegisterValues["addressCountry"];
  const err = errors.addressCountry?.message as string | undefined;

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as RegisterValues["addressCountry"];
    setValue("addressCountry", val, { shouldValidate: true });
    // clear region when country changes
    setValue("region", "", { shouldValidate: true });
  }

  return (
    <label className="block">
      <span className="block text-sm text-slate-700">{label}</span>
      <select
        {...register("addressCountry")}
        value={country ?? ""}
        onChange={onChange}
        className="mt-1 w-full rounded border border-slate-300 p-2"
      >
        <option value="" disabled>
          Select country
        </option>
        <option value="CA">Canada</option>
        <option value="US">United States</option>
      </select>
      {err && <p className="text-xs text-rose-600">{err}</p>}
    </label>
  );
}
