"use client";

import { useId, useState } from "react";

const ACCEPT = ["image/jpeg", "image/png"]; // JPG/PNG only
const MAX = 4 * 1024 * 1024; // 4 MB

export default function DocUploadField({
  label,
  hint,
  value,
  onChange,
  id,
  required = false,
}: {
  label: string;
  hint?: string;
  value?: File | null;
  onChange: (f: File | null) => void;
  id?: string;
  required?: boolean;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [err, setErr] = useState<string | null>(null);

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      if (required) setErr(`${label} is required`);
      return;
    }
    if (!ACCEPT.includes(f.type)) {
      setErr("Only JPG or PNG accepted");
      return;
    }
    if (f.size > MAX) {
      setErr("File must be ≤ 4 MB");
      return;
    }
    setErr(null);
    onChange(f);
  }

  function clear() {
    onChange(null);
    setErr(required ? `${label} is required` : null);
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-700"
      >
        {label} {required && <span className="text-rose-600">*</span>}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={inputId}
          type="file"
          accept={ACCEPT.join(",")}
          className="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-white hover:file:bg-slate-800"
          onChange={handle}
        />
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {err && (
        <p className="text-xs text-rose-600" aria-live="polite">
          {err}
        </p>
      )}
      {value && (
        <div className="flex items-center gap-3 rounded border border-slate-200 p-2 text-xs text-slate-600">
          {value.name} • {(value.size / 1024 / 1024).toFixed(1)} MB
          <button
            type="button"
            className="ml-auto text-xs underline"
            onClick={clear}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
