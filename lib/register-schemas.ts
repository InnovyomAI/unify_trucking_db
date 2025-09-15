import { z } from "zod";
import { isValidLicence, normalizedLicence } from "@/lib/license-rules";
import { detectCA, isUSZip } from "@/lib/postal";
import { classesFor } from "@/lib/license-classes";
import {
  passportPatternFor,
  isValidPassport,
  normalizePassport,
} from "@/lib/passport/validate";
import { isCountry } from "@/lib/countries";

/** yyyy-mm-dd string */
const dateISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const NAME = z
  .string()
  .trim()
  .min(2, "Enter at least 2 characters")
  .max(60, "Too long")
  .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/, "Letters, spaces, hyphens, apostrophes only");

const JURISDICTION = z.enum(
  [
    "CA-AB","CA-BC","CA-MB","CA-NB","CA-NL","CA-NS","CA-ON","CA-PE","CA-QC","CA-SK","CA-YT","CA-NT","CA-NU",
  ],
  { message: "Select issuing authority" },
);

const EMAIL = z.string().email("Enter a valid email");

/** Digits-only (no +1 here). We keep UI to CA only. */
const PHONE_COUNTRY = z.enum(["CA"]).default("CA");
const PHONE_DIGITS = z
  .string()
  .regex(/^\d{10}$/, "Enter a 10-digit Canadian phone number");

const LICENSE_NO = z
  .string()
  .trim()
  .min(3, "Enter licence number")
  .max(20, "Too long")
  .regex(/^[A-Za-z0-9-]+$/, "Letters/numbers only");

const ENGLISH_LEVEL = z.enum(["Basic", "Conversational", "Fluent", "Native"]);

const PASSPORT_NUMBER_GENERIC = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6,10}$/, "6–10 letters/digits");

const PR_CARD_NUMBER = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "PR number must be exactly 10 digits");


const FILE_REQUIRED = z.instanceof(File, { message: "File required" });

export const RegisterSchema = z
  .object({

    // Names
    givenName: NAME,
    surname: NAME,
    middleName: z.string().trim().max(60).optional().or(z.literal("")),
    givenNameKey: z.string().optional(),
    surnameKey: z.string().optional(),

    // Licence & jurisdiction
    jurisdiction: JURISDICTION,
    licenseNo: LICENSE_NO,
    licenseClass: z.string().min(1, "Select class").max(5),
    airBrake: z.boolean().optional(),
    licenseExpiry: dateISO,
    dob: dateISO,
    gender: z.enum(["Male", "Female", "Non-binary", "Prefer not to say"]).optional(),

    // Contact
    email: EMAIL,
    phone: PHONE_DIGITS,
    phoneCountry: PHONE_COUNTRY,

    // Address
    address1: z.string().trim().max(100).optional().or(z.literal("")),
    address2: z.string().trim().max(100).optional().or(z.literal("")),
    city: z.string().trim().max(60).optional().or(z.literal("")),
    region: z.string().trim().max(40).optional().or(z.literal("")),
    postal: z.string().trim().min(3, "Enter postal/ZIP"),
    addressCountry: z.string().trim().length(2, "Use ISO2 (e.g., CA)").optional(),

    // Status
    citizenship: z.enum(["Canadian Citizen", "Non-Citizen"]).default("Canadian Citizen"),
    residencyCA: z.enum(["Citizen", "Permanent Resident", "Work Permit", "Study Permit"]).default("Citizen"),
    prNumber: z.string().optional(),
    permitType: z.string().optional(),
    permitExpiry: dateISO.optional(),
    uci: z.string().optional(),

    // Passport
    passportCountry: z.string().optional(),
    passportNumber: z.string().optional(),

    // Languages
    englishLevel: ENGLISH_LEVEL,
    otherLanguages: z
      .array(z.object({ language: z.string().min(1, "Choose a language"), level: ENGLISH_LEVEL }))
      .max(20)
      .optional(),

    // Work experience
    work: z
      .array(
        z
          .object({
            company: z.string().trim().min(2, "Enter company"),
            role: z.string().trim().min(2, "Enter role"),
            start: dateISO,
            end: dateISO,
          })
          .refine((w) => new Date(w.start) <= new Date(w.end), {
            message: "From must be before To",
            path: ["end"],
          }),
      )
      .max(10)
      .optional(),

    // Consent
    consentAbstract: z.boolean().refine((v) => v === true, { message: "Consent is required" }),
    consentName: NAME,
    consentDate: dateISO,
    certifyAccurate: z.boolean().refine((v) => v === true, { message: "You must certify accuracy" }),

    // Documents
    docLicenseFront: FILE_REQUIRED,
    docLicenseBack: FILE_REQUIRED,
    docHealthCard: FILE_REQUIRED,
    docPassport: z.instanceof(File).optional(),
    docPR: z.instanceof(File).optional(),
    docPermit: z.instanceof(File).optional(),
  })
  .superRefine((v, ctx) => {
    // Age >= 16, licence expiry future
    const today = new Date();
    const minDob = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    const dob = new Date(v.dob);
    const exp = new Date(v.licenseExpiry);
    if (isNaN(dob.getTime()) || dob > minDob) {
      ctx.addIssue({ code: "custom", path: ["dob"], message: "Driver must be at least 16 years old" });
    }
    if (isNaN(exp.getTime()) || exp < today) {
      ctx.addIssue({ code: "custom", path: ["licenseExpiry"], message: "Expiry must be in the future" });
    }

    // Licence checks
    if (!isValidLicence(v.jurisdiction, v.licenseNo)) {
      ctx.addIssue({ code: "custom", path: ["licenseNo"], message: "Number doesn’t match jurisdiction format" });
    }
    const allowed = classesFor(v.jurisdiction);
    if (allowed.length > 0 && !allowed.includes(v.licenseClass)) {
      ctx.addIssue({ code: "custom", path: ["licenseClass"], message: `Select a valid class for ${v.jurisdiction}` });
    }

    // Postal
    if (!detectCA(v.postal).ok && !isUSZip(v.postal)) {
      ctx.addIssue({ code: "custom", path: ["postal"], message: "Enter a valid Canadian postal code or US ZIP" });
    }

    // Citizenship / residency logic
    if (v.citizenship === "Canadian Citizen" && v.residencyCA !== "Citizen") {
      ctx.addIssue({ code: "custom", path: ["residencyCA"], message: "Canadian citizens must select Citizen" });
    }

    if (v.citizenship === "Non-Citizen") {
      if (!v.passportCountry || !isCountry(v.passportCountry)) {
        ctx.addIssue({ code: "custom", path: ["passportCountry"], message: "Select a valid country" });
      }
      if (!v.passportNumber?.trim()) {
        ctx.addIssue({ code: "custom", path: ["passportNumber"], message: "Enter passport number" });
      } else if (v.passportCountry) {
        const ok =
          isValidPassport(v.passportCountry, v.passportNumber) ||
          PASSPORT_NUMBER_GENERIC.safeParse(v.passportNumber).success;
        if (!ok) {
          const pat = passportPatternFor(v.passportCountry);
          ctx.addIssue({
            code: "custom",
            path: ["passportNumber"],
            message: `Format doesn’t match (${pat.hint || "6–10 letters/digits"})`,
          });
        }
      }
      if (!v.docPassport) {
        ctx.addIssue({ code: "custom", path: ["docPassport"], message: "Upload passport image" });
      }
    }

    if (v.residencyCA === "Permanent Resident") {
      if (!v.prNumber || !PR_CARD_NUMBER.safeParse(v.prNumber).success) {
        ctx.addIssue({ code: "custom", path: ["prNumber"], message: "PR number must be exactly 10 digits" });
      }

      if (!v.docPR) ctx.addIssue({ code: "custom", path: ["docPR"], message: "Upload PR card image" });
    }

    if (v.residencyCA === "Work Permit" || v.residencyCA === "Study Permit") {
      if (!v.docPermit) ctx.addIssue({ code: "custom", path: ["docPermit"], message: "Upload permit document image" });
      if (v.residencyCA === "Work Permit" && !v.permitType?.trim()) {
        ctx.addIssue({ code: "custom", path: ["permitType"], message: "Select permit type" });
      }
    }

    // File size/type checks
    ([
      ["docLicenseFront", v.docLicenseFront],
      ["docLicenseBack", v.docLicenseBack],
      ["docHealthCard", v.docHealthCard],
      ["docPassport", v.docPassport],
      ["docPR", v.docPR],
      ["docPermit", v.docPermit],
    ] as const).forEach(([path, f]) => {
      const file = f as File | undefined;
      if (file) {
        const okType = ["image/jpeg", "image/png"].includes(file.type);
        const okSize = file.size <= 4 * 1024 * 1024;
        if (!okType || !okSize) {
          ctx.addIssue({ code: "custom", path: [path], message: "Upload JPG/PNG ≤ 4MB" });
        }
      }
    });
  });

export type RegisterValues = z.infer<typeof RegisterSchema>;
type Normalized = RegisterValues & {
  phone: string;
  passportNumber?: string;
  prNumber?: string;
  uci?: string;
};

/** Normalize before storage */
export function normalizeForStorage(values: RegisterValues): Normalized {
  const out: Normalized = { ...values };

  // Normalise licence number
  out.licenseNo = normalizedLicence(out.licenseNo);

  // Normalise phone
  if (out.phoneCountry === "CA" && /^\d{10}$/.test(out.phone)) {
    out.phone = `+1${out.phone}`;
  }

  // Normalise passport
  if (out.passportCountry && out.passportNumber) {
    out.passportNumber = normalizePassport(out.passportNumber);
  } else {
    out.passportNumber = undefined;
  }

  // PR number uppercase
  if (out.prNumber) {
    out.prNumber = out.prNumber.toUpperCase();
  }

  // UCI digits only
  if (out.uci) {
    out.uci = out.uci.replace(/\D/g, "");
  }

  return out;
}
