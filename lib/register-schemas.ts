import { z } from "zod";

export const VisaStatusSchema = z.object({
  hasVisa: z.enum(["Yes", "No"]),
  visaType: z.string().optional(),
  visaExpiry: z.string().optional(),
}).superRefine((v, ctx) => {
  if (v.hasVisa === "Yes") {
    if (!v.visaType?.trim()) ctx.addIssue({ code: "custom", message: "Enter visa type", path: ["visaType"] });
    if (!v.visaExpiry?.trim()) ctx.addIssue({ code: "custom", message: "Enter visa expiry", path: ["visaExpiry"] });
  }
});

export const PRStatusSchema = z.object({
  hasPR: z.enum(["Yes", "No"]).optional(),
  prNumber: z.string().optional(),
  prExpiry: z.string().optional(),
});

export const HealthStatusSchema = z.object({
  hasHealthCard: z.enum(["Yes", "No"]).optional(),
});

export const LanguageItemSchema = z.object({
  lang: z.string().min(2),
  level: z.enum(["Basic", "Conversational", "Fluent", "Native"]),
});

export const WorkItemSchema = z.object({
  company: z.string().optional(),
  role: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
});

export const RegisterSchema = z
  .object({
    // A) Identity & Licence (required except gender)
    legalName: z.string().min(2, "Enter full legal name"),
    jurisdiction: z.string().min(2, "Enter issuing authority (e.g., CA-MB)"),
    licenseNo: z.string().min(3, "Enter licence number"),
    licenseClass: z.string().min(1, "Enter class (e.g., 1, A)"),
    licenseExpiry: z.string().min(4, "Enter expiry date"),
    dob: z.string().min(4, "Enter date of birth"),
    gender: z.string().optional(),

    // B) Contact
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(7, "Enter a phone number"),

    // C) Address (all optional)
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    postal: z.string().optional(),
    country: z.string().optional(),

    // D) Status & Eligibility
    visa: VisaStatusSchema,
    pr: PRStatusSchema.optional(),
    health: HealthStatusSchema.optional(),

    // E) Languages
    englishLevel: z.enum(["Basic", "Conversational", "Fluent", "Native"]),
    otherLanguages: z.array(LanguageItemSchema).max(8).optional(),

    // F) Work experience
    work: z.array(WorkItemSchema).max(3).optional(),

    // G) Consent
    consentAbstract: z.boolean().default(false),
    consentName: z.string().optional(),
    certifyAccurate: z.boolean().default(false),

    // H) Documents (all optional for MVP; licence front recommended later)
    docLicenseFront: z.instanceof(File).optional(),
    docLicenseBack: z.instanceof(File).optional(),
    docPassport: z.instanceof(File).optional(),
    docPR: z.instanceof(File).optional(),
    docHealth: z.instanceof(File).optional(),
  })
  .superRefine((v, ctx) => {
    // DOB >= 16y
    const now = new Date();
    const dob = new Date(v.dob);
    if (!isNaN(dob.getTime())) {
      const sixteenAgo = new Date(now.getFullYear() - 16, now.getMonth(), now.getDate());
      if (dob > sixteenAgo) ctx.addIssue({ code: "custom", message: "Driver must be at least 16 years old", path: ["dob"] });
    }
    // expiry >= today
    const exp = new Date(v.licenseExpiry);
    if (!isNaN(exp.getTime())) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (exp < today) ctx.addIssue({ code: "custom", message: "Licence expiry must be in the future", path: ["licenseExpiry"] });
    }
    // consent typed name required if checked
    if (v.consentAbstract && !v.consentName?.trim()) {
      ctx.addIssue({ code: "custom", message: "Type your name to sign consent", path: ["consentName"] });
    }
    // certification checkbox
    if (!v.certifyAccurate) {
      ctx.addIssue({ code: "custom", message: "Please certify the information is accurate", path: ["certifyAccurate"] });
    }
  });

export type RegisterValues = z.infer<typeof RegisterSchema>;

