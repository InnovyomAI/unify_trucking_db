"use client";

import { useState } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema, type RegisterValues } from "@/lib/register-schemas";
import DocUploadField from "@/components/driver/DocUploadField";
import DriverCardPDF from "@/components/pdf/DriverCardPDF";
import { buildQrPayload, makeQrPng } from "@/lib/qr";
import { pdf } from "@react-pdf/renderer";
import Image from "next/image";
import { saveSnapshotRemote, type DriverSnapshot } from "@/lib/demo-store-remote";
import { uuidv4 } from "@/lib/uuid";

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema) as unknown as Resolver<RegisterValues>,
    defaultValues: {
      englishLevel: "Conversational",
      visa: { hasVisa: "No" },
      certifyAccurate: false,
    },
  });

  const { fields: otherLangs, append: addLang, remove: removeLang } = useFieldArray({ control, name: "otherLanguages" });
  const { fields: work, append: addWork, remove: removeWork } = useFieldArray({ control, name: "work" });

  const [submitting, setSubmitting] = useState(false);
  const [qrPng, setQrPng] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [qrid, setQrid] = useState<string | null>(null);

  const name = watch("legalName") || "";

  async function onSubmit(values: RegisterValues) {
    setSubmitting(true);
    try {
      // Generate a random id for the QR
      const id = uuidv4();
      setQrid(id);

      // Build minimal payload (no licence/jurisdiction or PII)
      const payload = buildQrPayload({ qrid: id, origin: window.location.origin });
      const png = await makeQrPng(payload);
      setQrPng(png);

      // Save a minimal snapshot (NOT inside the QR) for the verifier demo (server-side, temporary)
      const snap: DriverSnapshot = {
        qrid: id,
        name: values.legalName,
        jurisdiction: values.jurisdiction,
        licenseNo: values.licenseNo,
        licenseClass: values.licenseClass,
        licenseExpiry: values.licenseExpiry,
        issuedAt: new Date().toISOString(),
      };
      await saveSnapshotRemote(snap);

      // Build minimal PDF card (name + QR only)
      const doc = <DriverCardPDF name={values.legalName} qrPng={png} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } finally {
      setSubmitting(false);
    }
  }

  function safeFileName(base: string) {
    return base.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 40) || "card";
  }

  // helper to set File fields
  function setFile<K extends keyof RegisterValues>(key: K, f: File | null) {
    // @ts-expect-error react-hook-form field type narrowing for File | undefined
    setValue(key, f ?? undefined, { shouldValidate: true });
  }

  const visa = watch("visa");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Trust strip */}
      <div className="mb-6 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        Secure submission • QR contains only a random ID • Snapshot stored temporarily for verification demo
      </div>

      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Driver Registration</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        {/* A) Identity & Licence */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Identity & Licence</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full legal name" err={errors.legalName?.message}>
              <input {...register("legalName")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="Issuing jurisdiction (e.g., CA-MB)" err={errors.jurisdiction?.message}>
              <input {...register("jurisdiction")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="Licence number" err={errors.licenseNo?.message}>
              <input {...register("licenseNo")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="Licence class" err={errors.licenseClass?.message}>
              <input {...register("licenseClass")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="Licence expiry" err={errors.licenseExpiry?.message}>
              <input type="date" {...register("licenseExpiry")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="Date of birth" err={errors.dob?.message}>
              <input type="date" {...register("dob")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="Gender (optional)">
              <input {...register("gender")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
          </div>
          <p className="text-xs text-slate-500">We’ll normalise your licence number; expiry must be in the future; DOB 16+.</p>
        </section>

        {/* B) Contact */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" err={errors.email?.message}>
              <input type="email" {...register("email")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="Phone" err={errors.phone?.message}>
              <input {...register("phone")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
          </div>
        </section>

        {/* D) Status & Eligibility */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Status & Eligibility</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valid visa/work permit?" err={errors.visa?.hasVisa?.message}>
              <select {...register("visa.hasVisa")} className="mt-1 w-full rounded border border-slate-300 p-2">
                <option>No</option>
                <option>Yes</option>
              </select>
            </Field>
            {visa?.hasVisa === "Yes" && (
              <>
                <Field label="Visa type" err={errors.visa?.visaType?.message}>
                  <input {...register("visa.visaType")} className="mt-1 w-full rounded border border-slate-300 p-2" />
                </Field>
                <Field label="Visa expiry" err={errors.visa?.visaExpiry?.message}>
                  <input type="date" {...register("visa.visaExpiry")} className="mt-1 w-full rounded border border-slate-300 p-2" />
                </Field>
              </>
            )}
            <Field label="PR card?">
              <select {...register("pr.hasPR")} className="mt-1 w-full rounded border border-slate-300 p-2">
                <option></option>
                <option>No</option>
                <option>Yes</option>
              </select>
            </Field>
            <Field label="Health card?">
              <select {...register("health.hasHealthCard")} className="mt-1 w-full rounded border border-slate-300 p-2">
                <option></option>
                <option>No</option>
                <option>Yes</option>
              </select>
            </Field>
          </div>
        </section>

        {/* E) Languages */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Languages</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="English level">
              <select {...register("englishLevel")} className="mt-1 w-full rounded border border-slate-300 p-2">
                <option>Basic</option>
                <option>Conversational</option>
                <option>Fluent</option>
                <option>Native</option>
              </select>
            </Field>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-700">Other languages</p>
              <button type="button" onClick={() => addLang({ lang: "", level: "Basic" })} className="text-sm underline">
                Add
              </button>
            </div>
            {otherLangs.map((f, idx) => (
              <div key={f.id} className="grid gap-2 sm:grid-cols-3">
                <input
                  {...register(`otherLanguages.${idx}.lang` as const)}
                  placeholder="Language"
                  className="rounded border border-slate-300 p-2"
                />
                <select {...register(`otherLanguages.${idx}.level` as const)} className="rounded border border-slate-300 p-2">
                  <option>Basic</option>
                  <option>Conversational</option>
                  <option>Fluent</option>
                  <option>Native</option>
                </select>
                <button type="button" className="text-left text-sm underline" onClick={() => removeLang(idx)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* F) Work Experience (last 3 years) */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Work Experience (last 3 years)</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Up to 3 entries</span>
            <button type="button" onClick={() => work.length < 3 && addWork({})} className="text-sm underline">
              Add
            </button>
          </div>
          {work.map((w, idx) => (
            <div key={w.id} className="grid gap-2 sm:grid-cols-4">
              <input {...register(`work.${idx}.company` as const)} placeholder="Company" className="rounded border border-slate-300 p-2" />
              <input {...register(`work.${idx}.role` as const)} placeholder="Role" className="rounded border border-slate-300 p-2" />
              <input type="date" {...register(`work.${idx}.start` as const)} className="rounded border border-slate-300 p-2" />
              <div className="flex items-center gap-2">
                <input type="date" {...register(`work.${idx}.end` as const)} className="w-full rounded border border-slate-300 p-2" />
                <button type="button" className="text-sm underline" onClick={() => removeWork(idx)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* C) Address (optional) */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Address (optional)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Address line 1">
              <input {...register("address1")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="Address line 2">
              <input {...register("address2")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="City">
              <input {...register("city")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="Region/State/Province">
              <input {...register("region")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="Postal/ZIP">
              <input {...register("postal")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="Country">
              <input {...register("country")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
          </div>
        </section>

        {/* H) Document uploads (optional for MVP) */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Documents (optional)</h2>
          <DocUploadField
            label="Licence - front"
            hint="JPG, PNG, WEBP or PDF • ≤ 10MB"
            value={watch("docLicenseFront") ?? null}
            onChange={(f) => setFile("docLicenseFront", f)}
          />
          <DocUploadField label="Licence - back (optional)" value={watch("docLicenseBack") ?? null} onChange={(f) => setFile("docLicenseBack", f)} />
          <DocUploadField label="Passport (optional)" value={watch("docPassport") ?? null} onChange={(f) => setFile("docPassport", f)} />
          <DocUploadField label="PR Card (optional)" value={watch("docPR") ?? null} onChange={(f) => setFile("docPR", f)} />
          <DocUploadField label="Health Card (optional)" value={watch("docHealth") ?? null} onChange={(f) => setFile("docHealth", f)} />
        </section>

        {/* G) Consent */}
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Consent</h2>
          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input type="checkbox" {...register("consentAbstract")} className="mt-1" />
            I authorise [ORG] to request my driver abstract from the issuing authority.
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type your name to sign (required if consent checked)" err={errors.consentName?.message}>
              <input {...register("consentName")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input type="checkbox" {...register("certifyAccurate")} className="mt-1" />
            I certify the information provided is accurate.
          </label>
          {errors.certifyAccurate?.message && <p className="text-xs text-rose-600">{errors.certifyAccurate.message}</p>}
        </section>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? "Generating…" : "Submit & Generate QR"}
          </button>
          <span className="text-sm text-slate-500">Data stays on your device for this demo. No upload occurs.</span>
        </div>
      </form>

      {/* Result */}
      {qrPng && pdfUrl && (
        <section className="mt-10 rounded border border-slate-200 p-4">
          <h3 className="mb-2 text-base font-medium">Your QR & Card</h3>
          <div className="flex items-center gap-6">
            <Image src={qrPng} alt="QR code" width={160} height={160} className="h-40 w-40 border border-slate-200" />
            <div className="space-y-2">
              <a
                href={pdfUrl}
                // filename: prefer name, else short qrid
                download={`driver-card-${safeFileName(name || (qrid?.slice(0, 8) ?? "card"))}.pdf`}
                className="inline-flex rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
              >
                Download Card (PDF)
              </a>
              <p className="text-sm text-slate-600">
                Card shows only your name and this QR. The QR contains only a random ID (no personal data).
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function Field({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-slate-700">{label}</span>
      {children}
      {err && <p className="text-xs text-rose-600">{err}</p>}
    </label>
  );
}
