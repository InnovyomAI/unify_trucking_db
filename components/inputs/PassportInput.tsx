"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { passportPatternFor, normalizePassport } from "@/lib/passport/validate";
import type { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import type { RegisterValues } from "@/lib/register-schemas";

export default function PassportInput({
  countryCode,
  register,
  setValue,
  errors,
}: {
  countryCode?: string;
  register: UseFormRegister<RegisterValues>;
  setValue: UseFormSetValue<RegisterValues>;
  errors?: FieldErrors<RegisterValues>;
}) {
  const [v, setV] = useState("");
  const pat = useMemo(() => passportPatternFor(countryCode), [countryCode]);
  const inputRef = useRef<HTMLInputElement>(null);

  // When country changes, clip to max length and re-validate
  useEffect(() => {
    if (!inputRef.current) return;
    if (pat.maxLen && v.length > pat.maxLen) {
      const clipped = v.slice(0, pat.maxLen);
      setV(clipped);
      setValue("passportNumber", clipped, { shouldValidate: true });
    } else {
      // trigger validation when country changes even if length is ok
      setValue("passportNumber", v, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);

  return (
    <div className="space-y-1">
      <label className="block">
        <span className="block text-sm text-slate-700">Passport number</span>
      </label>
      <input
        {...(() => {
          const r = register("passportNumber");
          return r;
        })()}
        ref={(el) => {
          const r = register("passportNumber");
          if (typeof r.ref === "function") r.ref(el);
          else if (r.ref) (r.ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
          (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
        }}
        value={v}
        onChange={(e) => {
          // Uppercase A–Z, digits only; hard limit by country pattern
          let s = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
          if (pat.maxLen) s = s.slice(0, pat.maxLen);
          setV(s);
          setValue("passportNumber", s, { shouldValidate: true });
        }}
        onBlur={(e) => {
          const canon = normalizePassport(e.target.value);
          setV(canon);
          setValue("passportNumber", canon, { shouldValidate: true });
        }}
        inputMode="text"
        autoCapitalize="characters"
        className="mt-1 w-full rounded border border-slate-300 p-2 font-mono tracking-wider"
        placeholder={pat.hint || "e.g., K1234567"}
        aria-describedby="passport-hint"
      />
      <p id="passport-hint" className="text-xs text-slate-500">
        {countryCode ? `Expected format for ${countryCode.toUpperCase()}: ` : "Expected format: "}
        {pat.hint || "6–10 letters/digits"}
      </p>
      {errors?.passportNumber?.message && (
        <p className="text-xs text-rose-600">{String(errors.passportNumber.message)}</p>
      )}
    </div>
  );
}
