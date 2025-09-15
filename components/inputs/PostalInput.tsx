"use client";

import { detectCA, isUSZip } from "@/lib/postal";
import type {
  UseFormRegister,
  UseFormSetValue,
  FieldErrors,
} from "react-hook-form";
import type { RegisterValues } from "@/lib/register-schemas";

export default function PostalInput({
  register,
  setValue,
  errors,
}: {
  register: UseFormRegister<RegisterValues>;
  setValue: UseFormSetValue<RegisterValues>;
  errors: FieldErrors<RegisterValues>;
}) {
  function formatCA(v: string): string {
    const s = v.replace(/\s+/g, "").slice(0, 6); // only first 6 chars
    return s.length > 3 ? `${s.slice(0, 3)} ${s.slice(3)}` : s;
  }

  return (
    <label className="block">
      <span className="block text-sm text-slate-700">Postal/ZIP</span>
      <input
        {...register("postal")}
        className="mt-1 w-full rounded border border-slate-300 p-2"
        placeholder="A1A 1A1 or 90210"
        maxLength={7} // A1A 1A1 pattern
        onInput={(e) => {
          const t = e.target as HTMLInputElement;
          const v = t.value.toUpperCase().replace(/[^A-Z0-9\s-]/g, "");

          // Canadian pattern: first letter must be valid
          if (/^[ABCEGHJ-NPRSTVXY]\d[A-Z]?/i.test(v.replace(/\s/g, ""))) {
            t.value = formatCA(v);
          } else {
            // For non-CA, keep only digits (ZIP code)
            if (/^\d/.test(v)) {
              t.value = v.replace(/\D/g, "").slice(0, 10); // allow ZIP+4
            }
          }
        }}
        onBlur={(e) => {
          const raw = (e.target as HTMLInputElement).value.trim();
          const ca = detectCA(raw);
          if (ca.ok) {
            if (ca.normalized) setValue("postal", ca.normalized);
            setValue("addressCountry", "CA");
            if (ca.province) setValue("region", ca.province);
            return;
          }
          if (isUSZip(raw)) {
            setValue("addressCountry", "US");
          }
        }}
      />
      {errors.postal?.message && (
        <p className="text-xs text-rose-600">
          {errors.postal.message as string}
        </p>
      )}
    </label>
  );
}
