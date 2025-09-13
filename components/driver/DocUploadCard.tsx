"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { formatBytes, isAcceptedMime, MAX_BYTES, sha256 } from "@/lib/files";
import { Button } from "@/components/ui/button";

type DocUploadCardProps = {
  label: string;
  hint?: string;
  required?: boolean;
  value?: File | null;
  onChange: (file: File | null) => void;
  accept?: string; // default images + pdf
  id?: string;
};

export function DocUploadCard({
  label,
  hint,
  required,
  value,
  onChange,
  accept = "image/*,application/pdf",
  id,
}: DocUploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hashing, setHashing] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const innerId = useId();
  const inputId = id ?? innerId;

  useEffect(() => {
    if (value && value.type.startsWith("image/")) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return;
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (value) {
        setHashing(true);
        setHash(null);
        try {
          const h = await sha256(value);
          if (!cancelled) setHash(h);
        } catch {
          if (!cancelled) setHash(null);
        } finally {
          if (!cancelled) setHashing(false);
        }
      } else {
        setHash(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [value]);

  const trigger = () => {
    inputRef.current?.click();
  };

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      trigger();
    }
  };

  const validate = (file: File) => {
    if (!isAcceptedMime(file.type)) {
      setError("This file type isn’t supported.");
      return false;
    }
    if (file.size > MAX_BYTES) {
      setError("File is larger than 10MB.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleFile = (file: File | null) => {
    if (!file) {
      setError(null);
      onChange(null);
      return;
    }
    if (!validate(file)) return;
    // If same file picked, still fire
    onChange(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    handleFile(f);
    // Reset the input value to allow re-selecting the same file
    e.currentTarget.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    handleFile(f);
  };

  const onDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.type === "dragover") setDragOver(true);
    if (e.type === "dragleave") setDragOver(false);
  };

  const shortHash = hash ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : null;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}

      <div
        role="button"
        tabIndex={0}
        aria-label={`${label} uploader`}
        onClick={trigger}
        onKeyDown={onKey}
        onDrop={onDrop}
        onDragOver={onDrag}
        onDragLeave={onDrag}
        className={cn(
          "rounded-md border border-slate-300 bg-white p-4 transition-colors cursor-pointer focus-visible:outline-ring focus-visible:ring-[3px]",
          dragOver && "border-accent bg-accent/5"
        )}
      >
        {!value ? (
          <div className="text-sm text-slate-600">
            <p>Drag & drop here, or click to select</p>
            <p className="text-xs text-slate-500 mt-1">Accepted: JPG, PNG, WEBP, or PDF • Max 10MB</p>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Preview"
                width={96}
                height={128}
                unoptimized
                className="h-32 w-24 rounded object-cover border border-slate-200"
              />
            ) : (
              <div className="h-10 inline-flex items-center rounded bg-slate-100 px-2 text-xs text-slate-700">
                PDF
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-900 truncate">{value.name}</div>
              <div className="text-xs text-slate-600">{formatBytes(value.size)}</div>
              <div className="text-xs text-slate-600 mt-1">
                {hashing ? (
                  <span>Hashing…</span>
                ) : shortHash ? (
                  <span>SHA-256: {shortHash}</span>
                ) : null}
              </div>
            </div>
            <div>
              <Button type="button" variant="outline" size="sm" onClick={() => handleFile(null)} aria-label={`Remove ${label}`}>
                Remove
              </Button>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={accept}
          capture="environment"
          onChange={onInputChange}
        />
      </div>

      <div aria-live="polite" className="text-xs text-red-600 min-h-4">{error}</div>
    </div>
  );
}
