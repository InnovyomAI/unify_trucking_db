"use client";
import { useId, useState } from "react";

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX = 10 * 1024 * 1024;

export default function DocUploadField({
  label,
  hint,
  value,
  onChange,
  id,
}: {
  label: string;
  hint?: string;
  value?: File | null;
  onChange: (f: File | null) => void;
  id?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [err, setErr] = useState<string | null>(null);

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPT.includes(f.type)) {
      setErr("Unsupported file type");
      return;
    }
    if (f.size > MAX) {
      setErr("File exceeds 10MB");
      return;
    }
    setErr(null);
    onChange(f);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input id={inputId} type="file" accept={ACCEPT.join(",")} className="block w-full text-sm" onChange={handle} />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {err && (
        <p className="text-xs text-rose-600" aria-live="polite">
          {err}
        </p>
      )}
      {value && (
        <div className="flex items-center gap-3 rounded border border-slate-200 p-2">
          <div className="text-xs text-slate-600">
            {value.name} • {formatBytes(value.size)}
          </div>
          <button type="button" className="ml-auto text-xs underline" onClick={() => onChange(null)}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
