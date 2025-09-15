"use client";

import { titleCaseName, canonicalKey } from "@/lib/names";
import type {
  UseFormRegister,
  UseFormSetValue,
  FieldErrors,
} from "react-hook-form";
import type { RegisterValues } from "@/lib/register-schemas";

const NAME_ALLOWED = /[A-Za-zÀ-ÖØ-öø-ÿ' -]/; // single char test
const SANITIZE = /[^A-Za-zÀ-ÖØ-öø-ÿ' -]+/g; // strip anything not allowed
const MAX_LEN = 60;

export default function NameFields({
  register,
  setValue,
  errors,
}: {
  register: UseFormRegister<RegisterValues>;
  setValue: UseFormSetValue<RegisterValues>;
  errors: FieldErrors<RegisterValues>;
}) {
  function onChangeField(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "givenName" | "middleName" | "surname",
  ) {
    // live sanitize: keep allowed chars, cap length
    let v = e.target.value.replace(SANITIZE, "");
    if (v.length > MAX_LEN) v = v.slice(0, MAX_LEN);
    setValue(field, v, { shouldValidate: true });
  }

  function onBlurFormat(
    e: React.FocusEvent<HTMLInputElement>,
    field: "givenName" | "middleName" | "surname",
    withKey?: "givenNameKey" | "surnameKey",
  ) {
    const t = titleCaseName(e.target.value);
    setValue(field, t, { shouldValidate: true });
    if (withKey) setValue(withKey, canonicalKey(t));
  }

  function blockInvalidKey(e: React.KeyboardEvent<HTMLInputElement>) {
    // allow control keys
    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "Tab" ||
      e.metaKey ||
      e.ctrlKey
    ) {
      return;
    }
    if (!NAME_ALLOWED.test(e.key)) {
      e.preventDefault();
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field
        label="Given name"
        err={errors.givenName?.message as string | undefined}
      >
        <input
          {...register("givenName")}
          className="mt-1 w-full rounded border border-slate-300 p-2"
          maxLength={MAX_LEN}
          onKeyDown={blockInvalidKey}
          onChange={(e) => onChangeField(e, "givenName")}
          onBlur={(e) => onBlurFormat(e, "givenName", "givenNameKey")}
          autoComplete="given-name"
        />
      </Field>

      <Field
        label="Middle (optional)"
        err={errors.middleName?.message as string | undefined}
      >
        <input
          {...register("middleName")}
          className="mt-1 w-full rounded border border-slate-300 p-2"
          maxLength={MAX_LEN}
          onKeyDown={blockInvalidKey}
          onChange={(e) => onChangeField(e, "middleName")}
          onBlur={(e) => onBlurFormat(e, "middleName")}
          autoComplete="additional-name"
        />
      </Field>

      <Field
        label="Surname"
        err={errors.surname?.message as string | undefined}
      >
        <input
          {...register("surname")}
          className="mt-1 w-full rounded border border-slate-300 p-2"
          maxLength={MAX_LEN}
          onKeyDown={blockInvalidKey}
          onChange={(e) => onChangeField(e, "surname")}
          onBlur={(e) => onBlurFormat(e, "surname", "surnameKey")}
          autoComplete="family-name"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  err,
  children,
}: {
  label: string;
  err?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-700">{label}</span>
      {children}
      {err && <p className="text-xs text-rose-600">{err}</p>}
    </label>
  );
}
