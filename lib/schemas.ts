import { z } from "zod";
import { differenceInYears, parseISO, isValid as isValidDate } from "date-fns";
import { JURISDICTIONS, COUNTRIES } from "@/lib/constants";

// Step 1: License
export const LicenseSchema = z.object({
  issuingJurisdiction: z.enum(JURISDICTIONS),
  licenseNo: z.string().trim().min(3, "Enter a valid license number").max(32, "Too long"),
});

// Step 2: Identity
export const IdentitySchema = z.object({
  legalName: z.string().trim().min(1, "Enter legal name"),
  dob: z
    .string()
    .min(1, "Enter date of birth")
    .refine((s) => {
      try {
        const d = parseISO(s);
        if (!isValidDate(d)) return false;
        return differenceInYears(new Date(), d) >= 16;
      } catch {
        return false;
      }
    }, "You must be at least 16 years old"),
  email: z.string().email("Enter a valid email"),
  phoneRaw: z.string().min(1, "Enter phone"),
});

// Step 3: Address
export const AddressSchema = z.object({
  country: z.enum(COUNTRIES),
  region: z.string().trim().min(1, "Enter region"),
  city: z.string().trim().min(1, "Enter city"),
  line1: z.string().trim().min(1, "Enter address line 1"),
  line2: z.string().default("").optional().transform((v) => v ?? ""),
  postalCode: z.string().trim().min(1, "Enter postal / ZIP"),
});

// Steps 4–6: Empty shells so imports work (to be filled later)
export const DocumentsSchema = z.object({}); // Step 4 placeholder
export const HistoryLangSchema = z.object({}); // Step 5 placeholder
export const ConsentSchema = z.object({}); // Step 6 placeholder

// Combined payload shapes
export type LicenseData = z.infer<typeof LicenseSchema>;
export type IdentityData = z.infer<typeof IdentitySchema>;
export type AddressData = z.infer<typeof AddressSchema>;
export type DocumentsData = z.infer<typeof DocumentsSchema>;
export type HistoryLangData = z.infer<typeof HistoryLangSchema>;
export type ConsentData = z.infer<typeof ConsentSchema>;

// Wizard state (includes derived fields used across steps)
export type EnrollmentState = LicenseData &
  IdentityData &
  AddressData & {
    phoneE164: string;
    licenseNoNorm?: string;
    documents?: DocumentValues;
  };

// Sane placeholders
export const defaultValues: EnrollmentState = {
  // Step 1
  issuingJurisdiction: "CA-ON",
  licenseNo: "A1234-5678",
  // Step 2
  legalName: "Jane Doe",
  dob: "1990-01-01",
  email: "jane.doe@example.com",
  phoneRaw: "+1 555 123 4567",
  phoneE164: "",
  // Step 3
  country: "Canada",
  region: "ON",
  city: "Toronto",
  line1: "123 Main St",
  line2: "",
  postalCode: "M5V 2T6",
};

// Step 4: Documents (client-only validation)
// Use a custom File schema that doesn't break server evaluation.
const FileSchema = z.custom<File>((v) => {
  if (typeof window === "undefined") return true;
  return v instanceof File;
});

export const DocumentSchema = z.object({
  passport: FileSchema.refine((v) => !!v, {
    message: "Passport image or PDF is required",
  }) as z.ZodType<File>,
  visa: FileSchema.optional() as z.ZodType<File | undefined>,
  prOrCitizenship: FileSchema.optional() as z.ZodType<File | undefined>,
  medical: FileSchema.optional() as z.ZodType<File | undefined>,
});

export type DocumentValues = z.infer<typeof DocumentSchema>;
