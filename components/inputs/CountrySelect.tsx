"use client";
import { useMemo, useState } from "react";
import { allCountries } from "@/lib/countries";
import type { UseFormRegister, UseFormSetValue, FieldErrors, Path } from "react-hook-form";
import type { RegisterValues } from "@/lib/register-schemas";

type Props = {
  name: Path<RegisterValues>;
  label?: string;
  register: UseFormRegister<RegisterValues>;
  setValue: UseFormSetValue<RegisterValues>;
  errors?: FieldErrors<RegisterValues>;
  defaultCode?: string;
  searchable?: boolean;   // 👈 NEW prop
};

const COUNTRIES = allCountries();

export default function CountrySelect({
  name,
  label = "Country",
  register,
  setValue,
  errors,
  defaultCode,
  searchable = true,  // 👈 default keeps old behavior
}: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!searchable) return COUNTRIES; // 👈 skip filtering if not searchable
    const s = q.trim().toLowerCase();
    if (!s) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(s) || c.code.toLowerCase().includes(s)
    );
  }, [q, searchable]);

  function errorOf() {
    const e = errors?.[name as keyof typeof errors];
    const msg = (e as unknown as { message?: string } | undefined)?.message;
    return typeof msg === "string" ? msg : undefined;
  }

  return (
    <div className="space-y-1">
      <label className="block">
        <span className="block text-sm text-slate-700">{label}</span>
      </label>

      <div
        className={
          searchable
            ? "grid gap-2 sm:grid-cols-[1fr_18rem]"
            : "w-full"
        }
      >
        {searchable && (
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded border border-slate-300 p-2"
            placeholder="Search country…"
          />
        )}

        <select
          {...register(name)}
          defaultValue={defaultCode ?? ""}
          onChange={(e) =>
            setValue(name, e.target.value, { shouldValidate: true, shouldDirty: true })
          }
          className="rounded border border-slate-300 p-2 w-full"
        >
          <option value="" disabled>
            Select country
          </option>
          {filtered.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {errorOf() && <p className="text-xs text-rose-600">{errorOf()}</p>}
    </div>
  );
}
