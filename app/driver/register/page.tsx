"use client";

import { useState } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RegisterSchema,
  type RegisterValues,
  normalizeForStorage,
} from "@/lib/register-schemas";
import DocUploadField from "@/components/driver/DocUploadField";
import DriverCardPDF from "@/components/pdf/DriverCardPDF";
import { buildQrPayload, makeQrPng } from "@/lib/qr";
import { pdf } from "@react-pdf/renderer";
import Image from "next/image";
import {
  saveSnapshotRemote,
  type DriverSnapshot,
} from "@/lib/demo-store-remote";
import { uuidv4 } from "@/lib/uuid";
import NameFields from "@/components/inputs/NameFields";
import PhoneInput from "@/components/inputs/PhoneInput";
import PostalInput from "@/components/inputs/PostalInput";
import LicenceInput from "@/components/inputs/LicenceInput";
import StatusWizard from "@/components/inputs/StatusWizard";
import LicenseClassSelect from "@/components/inputs/LicenseClassSelect";
import CountrySelect from "@/components/inputs/CountrySelect";
import PassportInput from "@/components/inputs/PassportInput";
import AddressCountrySelect from "@/components/inputs/AddressCountrySelect";
import RegionSelect from "@/components/inputs/RegionSelect";
import { hashPin } from "@/lib/security"; // simple bcrypt/sha256 helper

function generatePin(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // avoid O/I
  const digits = "23456789"; // avoid 0/1

  // Ensure at least 1 letter and 1 digit
  const pinChars = [
    letters[Math.floor(Math.random() * letters.length)],
    digits[Math.floor(Math.random() * digits.length)],
  ];

  const allChars = letters + digits;
  while (pinChars.length < 4) {
    pinChars.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Shuffle so digits/letters are not always in fixed positions
  return pinChars.sort(() => Math.random() - 0.5).join("");
}



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
      phoneCountry: "CA",
      citizenship: "Canadian Citizen",
      residencyCA: "Citizen",
      consentDate: new Date().toISOString().slice(0, 10),
      certifyAccurate: false,
      otherLanguages: [],
    },
  });

  const { fields: work, append: addWork, remove: removeWork } = useFieldArray({
    control,
    name: "work",
  });

  const [submitting, setSubmitting] = useState(false);
  const [qrPng, setQrPng] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [qrid, setQrid] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errorSummary, setErrorSummary] = useState<string[] | null>(null);
  const citizenship = watch("citizenship");
  const residency = watch("residencyCA");
  const passportCountry = watch("passportCountry");
  const needPassport = citizenship !== "Canadian Citizen";
  const needPermit = residency === "Work Permit" || residency === "Study Permit";
  const needPR = residency === "Permanent Resident";
  const [plainPin, setPlainPin] = useState<string | null>(null);


  const fullName = [watch("givenName") || "", watch("middleName") || "", watch("surname") || ""]
    .filter(Boolean)
    .join(" ");

  async function onSubmit(values: RegisterValues) {
    setSubmitting(true);
    try {
      setSubmitError(null);
      setErrorSummary(null);
      const storeReady = normalizeForStorage(values);

      const id = uuidv4();
      setQrid(id);
      const pin = generatePin();
      setPlainPin(pin);


      const payload = buildQrPayload({ qrid: id, origin: window.location.origin });
      const png = await makeQrPng(payload);
      setQrPng(png);

      const snap: DriverSnapshot = {
        qrid: id,
        pinHash: hashPin(pin),

        // identity
        name: [storeReady.givenName, storeReady.middleName, storeReady.surname].filter(Boolean).join(" "),
        dob: storeReady.dob,
        citizenship: storeReady.citizenship,
        residencyCA: storeReady.residencyCA,

        // licence
        jurisdiction: storeReady.jurisdiction,
        licenseNo: storeReady.licenseNo,
        licenseClass: storeReady.licenseClass,
        licenseExpiry: storeReady.licenseExpiry,

        // contact
        email: storeReady.email,
        phone: storeReady.phone,

        // address
        postal: storeReady.postal,
        country: storeReady.addressCountry ?? "",
        region: storeReady.region ?? "",
        city: storeReady.city ?? "",
        address1: storeReady.address1 ?? "",
        address2: storeReady.address2 ?? "",

        // status
        prNumber: storeReady.prNumber ?? "",
        permitType: storeReady.permitType ?? "",
        uci: storeReady.uci ?? "",
        permitExpiry: storeReady.permitExpiry ?? "",

        // passport
        passportCountry: storeReady.passportCountry ?? "",
        passportNumber: storeReady.passportNumber ?? "",

        // languages
        englishLevel: storeReady.englishLevel,
        otherLanguages: (storeReady.otherLanguages ?? []).map(l => ({
          language: l.language,
          level: l.level as string,
        })),

        // work experience  ✅ NEW
        work: storeReady.work ?? [],

        // consent
        consentName: storeReady.consentName,
        consentDate: storeReady.consentDate,
        consentAbstract: storeReady.consentAbstract,
        certifyAccurate: storeReady.certifyAccurate,

        issuedAt: new Date().toISOString(),
      };

        await saveSnapshotRemote(snap);

      const doc = <DriverCardPDF name={snap.name} qrPng={png} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSubmitError(msg);
      if (typeof window !== "undefined")
        window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  function onInvalid(errs: import("react-hook-form").FieldErrors<RegisterValues>) {
    const msgs: string[] = [];
    const pushMsg = (v: unknown) => {
      if (!v) return;
      if (typeof v === "string") msgs.push(v);
    };
    const order: Array<keyof RegisterValues> = [
      "givenName","surname","jurisdiction","licenseNo","licenseClass","licenseExpiry","dob","email","phone","postal","citizenship","residencyCA","prNumber","permitType","uci","passportCountry","passportNumber","docLicenseFront","docLicenseBack","docHealthCard","docPR","docPassport","docPermit","consentName","consentDate","consentAbstract","certifyAccurate",
    ];
    for (const k of order) {
      const issue = errs[k]?.message;
      if (issue) pushMsg(issue);
    }
    setErrorSummary(msgs.length ? msgs : ["Please review the highlighted fields."]);
    const firstKey = order.find((k) => Boolean((errs as Record<string, unknown>)[k]));
    if (firstKey) {
      const el = document.querySelector(`[name="${String(firstKey)}"]`) as HTMLElement | null;
      if (el && typeof el.scrollIntoView === "function")
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el && typeof el.focus === "function") el.focus();
    }
  }

  function safeFileName(base: string) {
    return base.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 40) || "card";
  }

  type FileKeys =
  | "docLicenseFront"
  | "docLicenseBack"
  | "docHealthCard"
  | "docPassport"
  | "docPR"
  | "docPermit";

  // helper to set File fields without tripping RHF generics
  function setFile(key: FileKeys, f: File | null) {
    setValue(key, (f ?? undefined), { shouldValidate: true });
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        Secure submission • QR contains only a random ID • Minimal non-PII metadata is stored temporarily for the verification demo
      </div>

      <h1 className="mb-4 text-2xl font-semibold text-slate-900">Driver Registration</h1>

      {submitError && (
        <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {submitError}
        </div>
      )}
      {errorSummary && (
        <div className="mb-4 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          <p className="font-medium">Please fix the following:</p>
          <ul className="list-inside list-disc">
            {errorSummary.slice(0, 6).map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-10">
        {/* Identity & Licence */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Identity & Licence</h2>
          <NameFields register={register} setValue={setValue} errors={errors} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Issuing jurisdiction" err={errors.jurisdiction?.message}>
              <select
                {...register("jurisdiction")}
                className="mt-1 w-full rounded border border-slate-300 p-2"
              >
                <option value="">Select</option>
                <option>CA-MB</option>
                <option>CA-ON</option>
                <option>CA-AB</option>
                <option>CA-BC</option>
                <option>CA-SK</option>
                <option>CA-QC</option>
                <option>CA-NB</option>
                <option>CA-NL</option>
                <option>CA-NS</option>
                <option>CA-PE</option>
                <option>CA-YT</option>
                <option>CA-NT</option>
                <option>CA-NU</option>
              </select>
            </Field>
            <LicenseClassSelect
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors}
            />
            <Field label="Licence expiry" err={errors.licenseExpiry?.message}>
              <input
                type="date"
                {...register("licenseExpiry")}
                className="mt-1 w-full rounded border border-slate-300 p-2"
                min={new Date().toISOString().slice(0, 10)}
                max="2099-12-31"
              />
            </Field>
            <Field label="Date of birth" err={errors.dob?.message}>
              <input
                type="date"
                {...register("dob")}
                className="mt-1 w-full rounded border border-slate-300 p-2"
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 16))
                  .toISOString()
                  .slice(0, 10)}
              />
            </Field>
          </div>
          <LicenceInput
            register={register}
            setValue={setValue}
            watch={watch}
            errors={errors}
          />
        </section>

        {/* Contact */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" err={errors.email?.message}>
              <input
                type="email"
                {...register("email")}
                className="mt-1 w-full rounded border border-slate-300 p-2"
              />
            </Field>
            <PhoneInput
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors}
            />
          </div>
        </section>

        {/* Address */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <PostalInput register={register} setValue={setValue} errors={errors} />
            {/* Country (CA/US only) */}
            <AddressCountrySelect
              register={register}
              setValue={setValue}
              watch={watch}
              errors={errors}
              label="Country"
            />
            {/* Region/Province/State (driven by country) */}
            <RegionSelect register={register} setValue={setValue} watch={watch} errors={errors} />

            <Field label="City">
              <input {...register("city")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="Address line 1">
              <input {...register("address1")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
            <Field label="Address line 2">
              <input {...register("address2")} className="mt-1 w-full rounded border border-slate-300 p-2" />
            </Field>
          </div>
        </section>
        <StatusWizard
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
        />

        {/* Permit details (shown for Work/Study permits) */}
        {needPermit && (
          <section className="space-y-3">
            <h3 className="font-medium">Permit details</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Permit type — only for Work Permit */}
              {residency === "Work Permit" && (
                <Field label="Permit type" err={errors.permitType?.message}>
                  <select
                    {...register("permitType")}
                    className="mt-1 w-full rounded border border-slate-300 p-2"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select type
                    </option>
                    <option value="Closed (employer-specific)">Closed (employer-specific)</option>
                    <option value="Open work permit">Open work permit</option>
                    <option value="PGWP">Post-Graduation Work Permit (PGWP)</option>
                    <option value="IEC">IEC (Working Holiday, YP, Co-op)</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
              )}

              {/* UCI number */}
              <Field label="UCI number" err={errors.uci?.message}>
                <input
                  {...register("uci")}
                  className="mt-1 w-full rounded border border-slate-300 p-2 font-mono tracking-wider"
                  placeholder="0000-0000 or 0000-0000-00"
                  inputMode="numeric"
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    let pretty = digits;
                    if (digits.length > 8) {
                      pretty = `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
                    } else if (digits.length > 4) {
                      pretty = `${digits.slice(0, 4)}-${digits.slice(4)}`;
                    }
                    e.target.value = pretty;
                    setValue("uci", pretty, { shouldValidate: true });
                  }}
                />
                <p className="text-xs text-slate-500">
                  8 or 10 digits (hyphens allowed). Example: 1234-5678 or 1234-5678-90
                </p>
              </Field>

              {/* Permit expiry */}
              <Field label="Permit expiry" err={errors.permitExpiry?.message}>
                <input
                  type="date"
                  {...register("permitExpiry")}
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                  min={new Date().toISOString().slice(0, 10)}
                  max="2099-12-31"
                />
              </Field>
            </div>
          </section>
        )}

        {/* PR card number */}
        {needPR && (
          <section className="space-y-3">
            <h3 className="font-medium">Permanent Resident</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="PR card number (Document No.)"
                err={errors.prNumber?.message}
              >
                <input
                  {...register("prNumber")}
                  className="mt-1 w-full rounded border border-slate-300 p-2 tracking-wider"
                  placeholder="1234567890"
                />
              </Field>
            </div>
          </section>
        )}

        {/* Passport (non-CA citizens) */}
        {needPassport && (
          <section className="space-y-3">
            <h3 className="font-medium">Passport</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <CountrySelect
                name="passportCountry"
                label="Passport country"
                register={register}
                setValue={setValue}
                errors={errors}
                searchable={false}
              />
              <PassportInput
                countryCode={passportCountry}
                register={register}
                setValue={setValue}
                errors={errors}
              />
              {/* Uncomment if you later decide to keep expiry */}
              {/* <Field label="Passport expiry" err={errors.passportExpiry?.message}>
                <input
                  type="date"
                  {...register("passportExpiry")}
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                />
              </Field> */}
            </div>
          </section>
        )}

        {/* Languages */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Languages</h2>
          <div className="grid gap-4 sm:grid-cols-2 items-end">
            <div>
              <span className="block text-sm text-slate-700">English</span>
              <input
                value="English"
                readOnly
                className="mt-1 w-full rounded border border-slate-200 bg-slate-50 p-2 text-slate-700"
              />
            </div>
            <Field label="Level (required)" err={errors.englishLevel?.message}>
              <select
                {...register("englishLevel")}
                className="mt-1 w-full rounded border border-slate-300 p-2"
                defaultValue=""
              >
                <option>Basic</option>
                <option>Conversational</option>
                <option>Fluent</option>
                <option>Native</option>
              </select>
            </Field>
          </div>
          <OtherLanguagesRows
            value={watch("otherLanguages") || []}
            onChange={(rows) =>
              setValue("otherLanguages", rows, { shouldValidate: true })
            }
          />
        </section>

        {/* Work Experience */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Work Experience (last 3 years)</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Add up to 10 entries</span>
            <button
              type="button"
              onClick={() => addWork({ company: "", role: "", start: "", end: "" })}
              className="text-sm underline"
            >
              Add
            </button>
          </div>
          {work.map((w, idx) => (
            <div key={w.id} className="grid gap-3 sm:grid-cols-5 items-end">
              <Field label="Company" err={(errors.work?.[idx])?.company?.message}>
                <input
                  {...register(`work.${idx}.company` as const)}
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                />
              </Field>

              <Field label="Role" err={(errors.work?.[idx])?.role?.message}>
                <input
                  {...register(`work.${idx}.role` as const)}
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                />
              </Field>

              <Field label="From" err={(errors.work?.[idx])?.start?.message}>
                <input
                  type="date"
                  {...register(`work.${idx}.start` as const)}
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                />
              </Field>

              <Field label="To" err={(errors.work?.[idx])?.end?.message}>
                <input
                  type="date"
                  {...register(`work.${idx}.end` as const)}
                  className="mt-1 w-full rounded border border-slate-300 p-2"
                />
              </Field>

              <div className="flex items-end">
                <button
                  type="button"
                  className="ml-auto rounded border px-3 py-2 text-sm hover:bg-slate-50"
                  onClick={() => removeWork(idx)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* Documents */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Documents</h2>

          {/* Licence always required */}
          <DocUploadField
            label="Licence - front"
            required
            value={(watch("docLicenseFront") as File | undefined) ?? null}
            onChange={(f) => setFile("docLicenseFront", f)}
          />
          <DocUploadField
            label="Licence - back"
            required
            value={(watch("docLicenseBack") as File | undefined) ?? null}
            onChange={(f) => setFile("docLicenseBack", f)}
          />

          {/* Health card always required */}
          <DocUploadField
            label="Health card"
            required
            value={(watch("docHealthCard") as File | undefined) ?? null}
            onChange={(f) => setFile("docHealthCard", f)}
          />

          {/* PR Card — only if residency is PR */}
          {needPR && (
            <DocUploadField
              label="PR Card"
              required
              value={(watch("docPR") as File | undefined) ?? null}
              onChange={(f) => setFile("docPR", f)}
            />
          )}

          {/* Passport — required if citizenship is Canadian Citizen OR Non-Citizen */}
          {(citizenship === "Canadian Citizen" || needPassport) && (
            <DocUploadField
              label="Passport"
              required
              value={(watch("docPassport") as File | undefined) ?? null}
              onChange={(f) => setFile("docPassport", f)}
            />
          )}

          {/* Work/Study Permit */}
          {needPermit && (
            <DocUploadField
              label="Work/Study Permit"
              required
              value={(watch("docPermit") as File | undefined) ?? null}
              onChange={(f) => setFile("docPermit", f)}
            />
          )}

          <p className="text-xs text-slate-500">
            Accepted: JPG/PNG • Max 4 MB each.
          </p>
        </section>

        {/* Consent */}
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Consent</h2>
          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input type="checkbox" {...register("consentAbstract")} className="mt-1" />
            I authorise [ORG] to request my driver abstract from the issuing authority.
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Type your name to sign" err={errors.consentName?.message}>
              <input
                {...register("consentName")}
                className="mt-1 w-full rounded border border-slate-300 p-2"
              />
            </Field>
            <Field label="Date" err={errors.consentDate?.message}>
              <input
                type="date"
                {...register("consentDate")}
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="mt-1 w-full rounded border border-slate-300 p-2"
              />
            </Field>
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input type="checkbox" {...register("certifyAccurate")} className="mt-1" />
            I certify the information provided is accurate.
          </label>
          {errors.consentAbstract?.message && (
            <p className="text-xs text-rose-600">{String(errors.consentAbstract.message)}</p>
          )}
          {errors.certifyAccurate?.message && (
            <p className="text-xs text-rose-600">{String(errors.certifyAccurate.message)}</p>
          )}
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
          <span className="text-sm text-slate-500">
            Data stays on your device for this demo. No upload occurs.
          </span>
        </div>
      </form>

      {/* Result */}
      {qrPng && pdfUrl && (
        <section className="mt-10 rounded border border-slate-200 p-4">
          <h3 className="mb-2 text-base font-medium">Your QR & Card</h3>
          <div className="flex items-center gap-6">
            <Image
              src={qrPng}
              alt="QR code"
              width={160}
              height={160}
              className="h-40 w-40 border border-slate-200"
            />
            <div className="space-y-2">
              <a
                href={pdfUrl}
                download={`driver-card-${safeFileName(fullName || (qrid?.slice(0, 8) ?? "card"))}.pdf`}
                className="inline-flex rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
              >
                Download Card (PDF)
              </a>
              {plainPin && (
                <p className="text-sm text-emerald-700 font-mono">
                  Your verification PIN: <strong>{plainPin}</strong>
                </p>
              )}

              <p className="text-sm text-slate-600">
                Card shows only your name and this QR. The QR contains only a random ID (no personal data). 
                A minimal non-PII snapshot is stored temporarily to enable verification.
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

type LangLevel = "Basic" | "Conversational" | "Fluent" | "Native";
type Row = { language: string; level: LangLevel };

function OtherLanguagesRows({
  value,
  onChange,
}: {
  value: Row[];
  onChange: (rows: Row[]) => void;
}) {
  const rows: Row[] = value ?? [];

  function add() {
    onChange([...(rows || []), { language: "", level: "Conversational" }]);
  }

  function remove(idx: number) {
    const next = [...rows] as Row[];
    next.splice(idx, 1);
    onChange(next);
  }

  function setRow(idx: number, patch: Partial<Row>) {
    const next = [...rows] as Row[];
    next[idx] = { ...next[idx], ...patch } as Row;
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {rows.map((row, idx) => (
        <div key={idx} className="grid gap-3 sm:grid-cols-3 items-end">
          <Field label="Other language">
            <select
              value={row.language}
              onChange={(e) => setRow(idx, { language: e.target.value })}
              className="mt-1 w-full rounded border border-slate-200 bg-slate-50 p-2 text-slate-700"
            >
              <option value="">Select language</option>
              {[
                "Arabic","Bengali","Chinese (Cantonese)","Chinese (Mandarin)","Dutch","English","Farsi","French","German",
                "Gujarati","Hebrew","Hindi","Italian","Japanese","Korean","Malay","Marathi","Panjabi (Punjabi)","Polish",
                "Portuguese","Punjabi","Russian","Spanish","Tagalog","Tamil","Telugu","Thai","Turkish","Ukrainian","Urdu","Vietnamese",
              ].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Level">
            <select
              value={row.level}
              onChange={(e) =>
                setRow(idx, { level: e.target.value as LangLevel })
              }
              className="mt-1 w-full rounded border border-slate-300 p-2"
            >
              <option>Basic</option>
              <option>Conversational</option>
              <option>Fluent</option>
              <option>Native</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => remove(idx)}
              className="ml-auto rounded border px-3 py-2 text-sm hover:bg-slate-50"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      <div className="flex">
        <button
          type="button"
          onClick={add}
          className="ml-auto inline-flex items-center gap-2 rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
          title="Add another language"
        >
          <span>+ Add language</span>
        </button>
      </div>
    </div>
  );
}
