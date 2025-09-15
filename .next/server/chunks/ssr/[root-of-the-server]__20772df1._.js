module.exports = [
"[project]/lib/license-rules.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Patterns derived from Microsoft Purview (2024-08-19) + ICBC 8-digit update.
// https://learn.microsoft.com/en-us/purview/sit-defn-canada-drivers-license-number
// https://www.icbc.com/about-icbc/newsroom/2023-feb06-DLnumbers
__turbopack_context__.s([
    "caRules",
    ()=>caRules,
    "formatLicence",
    ()=>formatLicence,
    "isValidLicence",
    ()=>isValidLicence,
    "normalizedLicence",
    ()=>normalizedLicence
]);
function onlyAZ09(s) {
    return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
function stripSep(s) {
    return s.replace(/[\s-]/g, "");
}
const caRules = {
    // Alberta: 6 digits - 3 digits OR 5-9 digits (Purview). We'll normalize to 9 digits or 6-3 display.
    "CA-AB": {
        format: (raw)=>{
            const s = raw.replace(/\D/g, "").slice(0, 9);
            return s.length > 6 ? `${s.slice(0, 6)}-${s.slice(6)}` : s;
        },
        test: (n)=>/^\d{9}$/.test(n) || /^\d{5,9}$/.test(n)
    },
    // BC: historically 7 digits; since 2023, 8 digits permitted.
    "CA-BC": {
        format: (raw)=>raw.replace(/\D/g, "").slice(0, 8),
        test: (n)=>/^\d{7,8}$/.test(n)
    },
    // CA-MB: display as 2-2-2-6 (e.g., DA-GG-UV-S057NT), store alnum only (12 chars typical).
    "CA-MB": {
        format: (raw)=>{
            const s = onlyAZ09(raw).slice(0, 12);
            // group 2-2-2-6
            if (!s) return "";
            const a = s.slice(0, 2), b = s.slice(2, 4), c = s.slice(4, 6), d = s.slice(6);
            return [
                a,
                b,
                c,
                d
            ].filter(Boolean).join("-");
        },
        // Canonical 12 alphanumerics
        test: (n)=>/^[A-Z0-9]{12}$/.test(n)
    },
    // New Brunswick: 5–7 digits
    "CA-NB": {
        format: (r)=>r.replace(/\D/g, "").slice(0, 7),
        test: (n)=>/^\d{5,7}$/.test(n)
    },
    // Newfoundland & Labrador: 1 letter + 9 digits
    "CA-NL": {
        format: (raw)=>{
            const s = onlyAZ09(raw);
            return (s.slice(0, 1) + s.slice(1, 10)).toUpperCase();
        },
        test: (n)=>/^[A-Z]\d{9}$/.test(n)
    },
    // Nova Scotia: Purview shows letter-heavy pattern; accept 14-char mixed alnum.
    "CA-NS": {
        format: (raw)=>onlyAZ09(raw).slice(0, 14),
        test: (n)=>/^[A-Z0-9]{6,14}$/.test(n)
    },
    // Ontario: letter + 4 digits + 5 digits + 5 digits (display with hyphens)
    "CA-ON": {
        format: (raw)=>{
            const s = onlyAZ09(raw).slice(0, 14); // A#### ##### #####
            const a = s.slice(0, 1), b = s.slice(1, 5), c = s.slice(5, 10), d = s.slice(10, 15);
            return [
                a + b,
                c,
                d
            ].filter(Boolean).join("-");
        },
        test: (n)=>/^[A-Z]\d{14}$/.test(n)
    },
    // Prince Edward Island: 5–6 digits
    "CA-PE": {
        format: (r)=>r.replace(/\D/g, "").slice(0, 6),
        test: (n)=>/^\d{5,6}$/.test(n)
    },
    // Quebec: 1 letter + 12 digits
    "CA-QC": {
        format: (raw)=>{
            const s = onlyAZ09(raw);
            return (s.slice(0, 1) + s.slice(1, 13)).toUpperCase();
        },
        test: (n)=>/^[A-Z]\d{12}$/.test(n)
    },
    // Saskatchewan: 8 digits
    "CA-SK": {
        format: (r)=>r.replace(/\D/g, "").slice(0, 8),
        test: (n)=>/^\d{8}$/.test(n)
    },
    // Territories & others (fallback): allow 5–15 alphanumerics
    "CA-DEFAULT": {
        format: (r)=>onlyAZ09(r).slice(0, 15),
        test: (n)=>/^[A-Z0-9]{5,15}$/.test(n)
    }
};
function formatLicence(jurisdiction, input) {
    const fallback = caRules["CA-DEFAULT"];
    const rule = caRules[jurisdiction] ?? fallback;
    return rule.format(input);
}
function isValidLicence(jurisdiction, input) {
    const fallback = caRules["CA-DEFAULT"];
    const rule = caRules[jurisdiction] ?? fallback;
    return rule.test(stripSep(input.toUpperCase()));
}
function normalizedLicence(input) {
    return stripSep(input.toUpperCase());
}
}),
"[project]/lib/postal.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "detectCA",
    ()=>detectCA,
    "isUSZip",
    ()=>isUSZip
]);
function detectCA(postalRaw) {
    const s = postalRaw.toUpperCase().replace(/\s+/g, "");
    const re = /^[ABCEGHJ-NPRSTVXY]\d[A-Z]\d[A-Z]\d$/; // Canada Post
    if (!re.test(s)) return {
        ok: false
    };
    const norm = `${s.slice(0, 3)} ${s.slice(3)}`;
    const first = s.charAt(0);
    const PROV = {
        A: "NL",
        B: "NS",
        C: "PE",
        E: "NB",
        G: "QC",
        H: "QC",
        J: "QC",
        K: "ON",
        L: "ON",
        M: "ON",
        N: "ON",
        P: "ON",
        R: "MB",
        S: "SK",
        T: "AB",
        V: "BC",
        Y: "YT",
        X: "NT"
    };
    const province = PROV[first] ?? undefined;
    return {
        ok: true,
        normalized: norm,
        province
    };
}
function isUSZip(raw) {
    return /^\d{5}(-\d{4})?$/.test(raw.trim());
}
}),
"[project]/lib/license-classes.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CA_CLASSES",
    ()=>CA_CLASSES,
    "classesFor",
    ()=>classesFor
]);
const CA_CLASSES = {
    "CA-MB": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6"
    ],
    "CA-ON": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "M"
    ],
    "CA-BC": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8"
    ],
    "CA-AB": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
    ],
    "CA-SK": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
    ],
    "CA-QC": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6"
    ],
    "CA-NB": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
    ],
    "CA-NL": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6"
    ],
    "CA-NS": [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7"
    ],
    "CA-PE": [
        "1",
        "2",
        "3",
        "4",
        "5"
    ]
};
function classesFor(jurisdiction) {
    return CA_CLASSES[jurisdiction] ?? [];
}
}),
"[project]/lib/passport/patterns.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FALLBACK",
    ()=>FALLBACK,
    "PASSPORT",
    ()=>PASSPORT,
    "canon",
    ()=>canon
]);
function canon(s) {
    return (s || "").toUpperCase().replace(/[\s\-.]/g, "");
}
const PASSPORT = {
    CA: {
        re: /^[A-Z]{2}\d{6}$/,
        minLen: 8,
        maxLen: 8,
        hint: "AA123456"
    },
    US: {
        re: /^([A-Z]\d{8}|\d{9})$/,
        minLen: 9,
        maxLen: 9,
        hint: "A12345678 or 123456789"
    },
    IN: {
        re: /^[A-Z]\d{7}$/,
        minLen: 8,
        maxLen: 8,
        hint: "A1234567"
    },
    PH: {
        re: /^([A-Z]\d{6}|[A-Z]{2}\d{6,7}|[A-Z]\d{7}[A-Z])$/,
        minLen: 7,
        maxLen: 9,
        hint: "P1234567 / AB123456 / AB1234567"
    },
    GB: {
        re: /^\d{9}$/,
        minLen: 9,
        maxLen: 9,
        hint: "123456789"
    },
    PK: {
        re: /^[A-Z]{2}\d{7}$/,
        minLen: 9,
        maxLen: 9,
        hint: "AB1234567"
    },
    BD: {
        re: /^[A-Z]\d{7}$/,
        minLen: 8,
        maxLen: 8,
        hint: "A1234567"
    },
    NG: {
        re: /^[A-Z]\d{8}$/,
        minLen: 9,
        maxLen: 9,
        hint: "A12345678"
    },
    CN: {
        re: /^[EGDSP]\d{8}$/,
        minLen: 9,
        maxLen: 9,
        hint: "E12345678"
    },
    MX: {
        re: /^[A-Z]\d{8}$/,
        minLen: 9,
        maxLen: 9,
        hint: "A12345678"
    }
};
const FALLBACK = {
    re: /^[A-Z0-9]{6,10}$/,
    minLen: 6,
    maxLen: 10,
    hint: "6–10 letters/digits"
};
}),
"[project]/lib/countries.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "allCountries",
    ()=>allCountries,
    "isCountry",
    ()=>isCountry
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$i18n$2d$iso$2d$countries$40$7$2e$14$2e$0$2f$node_modules$2f$i18n$2d$iso$2d$countries$2f$entry$2d$node$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/i18n-iso-countries@7.14.0/node_modules/i18n-iso-countries/entry-node.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$i18n$2d$iso$2d$countries$40$7$2e$14$2e$0$2f$node_modules$2f$i18n$2d$iso$2d$countries$2f$langs$2f$en$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/i18n-iso-countries@7.14.0/node_modules/i18n-iso-countries/langs/en.json (json)");
;
;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$i18n$2d$iso$2d$countries$40$7$2e$14$2e$0$2f$node_modules$2f$i18n$2d$iso$2d$countries$2f$entry$2d$node$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].registerLocale(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$i18n$2d$iso$2d$countries$40$7$2e$14$2e$0$2f$node_modules$2f$i18n$2d$iso$2d$countries$2f$langs$2f$en$2e$json__$28$json$29$__["default"]);
function allCountries() {
    const names = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$i18n$2d$iso$2d$countries$40$7$2e$14$2e$0$2f$node_modules$2f$i18n$2d$iso$2d$countries$2f$entry$2d$node$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getNames("en", {
        select: "official"
    });
    return Object.entries(names).map(([code, name])=>({
            code: code.toUpperCase(),
            name
        })).sort((a, b)=>a.name.localeCompare(b.name));
}
function isCountry(code) {
    if (!code) return false;
    const c = code.toUpperCase();
    try {
        return Boolean(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$i18n$2d$iso$2d$countries$40$7$2e$14$2e$0$2f$node_modules$2f$i18n$2d$iso$2d$countries$2f$entry$2d$node$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].alpha2ToNumeric(c));
    } catch  {
        return false;
    }
}
}),
"[project]/lib/passport/validate.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isValidPassport",
    ()=>isValidPassport,
    "normalizePassport",
    ()=>normalizePassport,
    "passportHint",
    ()=>passportHint,
    "passportPatternFor",
    ()=>passportPatternFor,
    "sanitizePassportInput",
    ()=>sanitizePassportInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$patterns$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/passport/patterns.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/countries.ts [app-ssr] (ecmascript)");
;
;
function passportPatternFor(country) {
    const code = (country || "").toUpperCase();
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCountry"])(code)) return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$patterns$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FALLBACK"];
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$patterns$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PASSPORT"][code] ?? __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$patterns$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FALLBACK"];
}
function isValidPassport(country, value) {
    const pat = passportPatternFor(country);
    return pat.re.test((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$patterns$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["canon"])(value));
}
function normalizePassport(value) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$patterns$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["canon"])(value);
}
function sanitizePassportInput(value, country) {
    const pat = passportPatternFor(country);
    let v = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$patterns$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["canon"])(value);
    if (typeof pat.maxLen === "number" && pat.maxLen > 0) {
        v = v.slice(0, pat.maxLen);
    }
    return v;
}
function passportHint(country) {
    const pat = passportPatternFor(country);
    return pat.hint || "6–10 letters/digits";
}
}),
"[project]/lib/register-schemas.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RegisterSchema",
    ()=>RegisterSchema,
    "normalizeForStorage",
    ()=>normalizeForStorage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/zod@4.1.8/node_modules/zod/v4/classic/external.js [app-ssr] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/license-rules.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/postal.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$classes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/license-classes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/passport/validate.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/countries.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
/** yyyy-mm-dd string */ const dateISO = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const NAME = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(2, "Enter at least 2 characters").max(60, "Too long").regex(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/, "Letters, spaces, hyphens, apostrophes only");
const JURISDICTION = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    "CA-AB",
    "CA-BC",
    "CA-MB",
    "CA-NB",
    "CA-NL",
    "CA-NS",
    "CA-ON",
    "CA-PE",
    "CA-QC",
    "CA-SK",
    "CA-YT",
    "CA-NT",
    "CA-NU"
], {
    message: "Select issuing authority"
});
const EMAIL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email("Enter a valid email");
/** Digits-only (no +1 here). We keep UI to CA only. */ const PHONE_COUNTRY = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    "CA"
]).default("CA");
const PHONE_DIGITS = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^\d{10}$/, "Enter a 10-digit Canadian phone number");
const LICENSE_NO = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(3, "Enter licence number").max(20, "Too long").regex(/^[A-Za-z0-9-]+$/, "Letters/numbers only");
const ENGLISH_LEVEL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    "Basic",
    "Conversational",
    "Fluent",
    "Native"
]);
const PASSPORT_NUMBER_GENERIC = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().toUpperCase().regex(/^[A-Z0-9]{6,10}$/, "6–10 letters/digits");
const PR_CARD_NUMBER = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().toUpperCase().regex(/^[A-Z]{2}\d{8}$/, "Format like AB12345678");
const FILE_REQUIRED = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File, {
    message: "File required"
});
const RegisterSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    // Names
    givenName: NAME,
    surname: NAME,
    middleName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(60).optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal("")),
    givenNameKey: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    surnameKey: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Licence & jurisdiction
    jurisdiction: JURISDICTION,
    licenseNo: LICENSE_NO,
    licenseClass: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Select class").max(5),
    airBrake: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    licenseExpiry: dateISO,
    dob: dateISO,
    gender: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "Male",
        "Female",
        "Non-binary",
        "Prefer not to say"
    ]).optional(),
    // Contact
    email: EMAIL,
    phone: PHONE_DIGITS,
    phoneCountry: PHONE_COUNTRY,
    // Address
    address1: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(100).optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal("")),
    address2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(100).optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal("")),
    city: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(60).optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal("")),
    region: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().max(40).optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal("")),
    postal: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(3, "Enter postal/ZIP"),
    addressCountry: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().length(2, "Use ISO2 (e.g., CA)").optional(),
    // Status
    citizenship: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "Canadian Citizen",
        "Non-Citizen"
    ]).default("Canadian Citizen"),
    residencyCA: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "Citizen",
        "Permanent Resident",
        "Work Permit",
        "Study Permit"
    ]).default("Citizen"),
    prNumber: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    permitType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    permitExpiry: dateISO.optional(),
    uci: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Passport
    passportCountry: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    passportNumber: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Languages
    englishLevel: ENGLISH_LEVEL,
    otherLanguages: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        language: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Choose a language"),
        level: ENGLISH_LEVEL
    })).max(20).optional(),
    // Work experience
    work: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        company: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(2, "Enter company"),
        role: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(2, "Enter role"),
        start: dateISO,
        end: dateISO
    }).refine((w)=>new Date(w.start) <= new Date(w.end), {
        message: "From must be before To",
        path: [
            "end"
        ]
    })).max(10).optional(),
    // Consent
    consentAbstract: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().refine((v)=>v === true, {
        message: "Consent is required"
    }),
    consentName: NAME,
    consentDate: dateISO,
    certifyAccurate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().refine((v)=>v === true, {
        message: "You must certify accuracy"
    }),
    // Documents
    docLicenseFront: FILE_REQUIRED,
    docLicenseBack: FILE_REQUIRED,
    docHealthCard: FILE_REQUIRED,
    docPassport: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File).optional(),
    docPR: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File).optional(),
    docPermit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File).optional()
}).superRefine((v, ctx)=>{
    // Age >= 16, licence expiry future
    const today = new Date();
    const minDob = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    const dob = new Date(v.dob);
    const exp = new Date(v.licenseExpiry);
    if (isNaN(dob.getTime()) || dob > minDob) {
        ctx.addIssue({
            code: "custom",
            path: [
                "dob"
            ],
            message: "Driver must be at least 16 years old"
        });
    }
    if (isNaN(exp.getTime()) || exp < today) {
        ctx.addIssue({
            code: "custom",
            path: [
                "licenseExpiry"
            ],
            message: "Expiry must be in the future"
        });
    }
    // Licence checks
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidLicence"])(v.jurisdiction, v.licenseNo)) {
        ctx.addIssue({
            code: "custom",
            path: [
                "licenseNo"
            ],
            message: "Number doesn’t match jurisdiction format"
        });
    }
    const allowed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$classes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["classesFor"])(v.jurisdiction);
    if (allowed.length > 0 && !allowed.includes(v.licenseClass)) {
        ctx.addIssue({
            code: "custom",
            path: [
                "licenseClass"
            ],
            message: `Select a valid class for ${v.jurisdiction}`
        });
    }
    // Postal
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["detectCA"])(v.postal).ok && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isUSZip"])(v.postal)) {
        ctx.addIssue({
            code: "custom",
            path: [
                "postal"
            ],
            message: "Enter a valid Canadian postal code or US ZIP"
        });
    }
    // Citizenship / residency logic
    if (v.citizenship === "Canadian Citizen" && v.residencyCA !== "Citizen") {
        ctx.addIssue({
            code: "custom",
            path: [
                "residencyCA"
            ],
            message: "Canadian citizens must select Citizen"
        });
    }
    if (v.citizenship === "Non-Citizen") {
        if (!v.passportCountry || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCountry"])(v.passportCountry)) {
            ctx.addIssue({
                code: "custom",
                path: [
                    "passportCountry"
                ],
                message: "Select a valid country"
            });
        }
        if (!v.passportNumber?.trim()) {
            ctx.addIssue({
                code: "custom",
                path: [
                    "passportNumber"
                ],
                message: "Enter passport number"
            });
        } else if (v.passportCountry) {
            const ok = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidPassport"])(v.passportCountry, v.passportNumber) || PASSPORT_NUMBER_GENERIC.safeParse(v.passportNumber).success;
            if (!ok) {
                const pat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["passportPatternFor"])(v.passportCountry);
                ctx.addIssue({
                    code: "custom",
                    path: [
                        "passportNumber"
                    ],
                    message: `Format doesn’t match (${pat.hint || "6–10 letters/digits"})`
                });
            }
        }
        if (!v.docPassport) {
            ctx.addIssue({
                code: "custom",
                path: [
                    "docPassport"
                ],
                message: "Upload passport image"
            });
        }
    }
    if (v.residencyCA === "Permanent Resident") {
        if (!v.prNumber || !PR_CARD_NUMBER.safeParse(v.prNumber).success) {
            ctx.addIssue({
                code: "custom",
                path: [
                    "prNumber"
                ],
                message: "PR card number must look like AB12345678"
            });
        }
        if (!v.docPR) ctx.addIssue({
            code: "custom",
            path: [
                "docPR"
            ],
            message: "Upload PR card image"
        });
    }
    if (v.residencyCA === "Work Permit" || v.residencyCA === "Study Permit") {
        if (!v.docPermit) ctx.addIssue({
            code: "custom",
            path: [
                "docPermit"
            ],
            message: "Upload permit document image"
        });
        if (v.residencyCA === "Work Permit" && !v.permitType?.trim()) {
            ctx.addIssue({
                code: "custom",
                path: [
                    "permitType"
                ],
                message: "Select permit type"
            });
        }
    }
    // File size/type checks
    [
        [
            "docLicenseFront",
            v.docLicenseFront
        ],
        [
            "docLicenseBack",
            v.docLicenseBack
        ],
        [
            "docHealthCard",
            v.docHealthCard
        ],
        [
            "docPassport",
            v.docPassport
        ],
        [
            "docPR",
            v.docPR
        ],
        [
            "docPermit",
            v.docPermit
        ]
    ].forEach(([path, f])=>{
        const file = f;
        if (file) {
            const okType = [
                "image/jpeg",
                "image/png"
            ].includes(file.type);
            const okSize = file.size <= 4 * 1024 * 1024;
            if (!okType || !okSize) {
                ctx.addIssue({
                    code: "custom",
                    path: [
                        path
                    ],
                    message: "Upload JPG/PNG ≤ 4MB"
                });
            }
        }
    });
});
function normalizeForStorage(values) {
    const out = {
        ...values
    };
    out.licenseNo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizedLicence"])(out.licenseNo);
    if (out.phoneCountry === "CA" && /^\d{10}$/.test(out.phone)) {
        out.phone = `+1${out.phone}`;
    }
    if (out.passportCountry && out.passportNumber) {
        out.passportNumber = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizePassport"])(out.passportNumber);
    } else {
        out.passportNumber = undefined;
    }
    if (out.prNumber) out.prNumber = out.prNumber.toUpperCase();
    if (out.uci) out.uci = out.uci.replace(/\D/g, "");
    return out;
}
}),
"[externals]/@react-pdf/renderer [external] (@react-pdf/renderer, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("@react-pdf/renderer");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/components/pdf/DriverCardPDF.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

/* eslint-disable jsx-a11y/alt-text */ __turbopack_context__.s([
    "default",
    ()=>DriverCardPDF
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@react-pdf/renderer [external] (@react-pdf/renderer, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
"use client";
;
;
const styles = __TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__["StyleSheet"].create({
    page: {
        padding: 20,
        fontSize: 10,
        color: "#0A0F1F"
    },
    card: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 12,
        borderRadius: 6
    },
    row: {
        flexDirection: "row",
        gap: 10
    },
    col: {
        flexGrow: 1
    },
    title: {
        fontSize: 14,
        marginBottom: 6
    },
    label: {
        color: "#6b7280"
    }
});
function DriverCardPDF({ name, qrPng }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__["Document"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__["Page"], {
            size: "A6",
            style: styles.page,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__["View"], {
                style: styles.card,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__["Text"], {
                        style: styles.title,
                        children: "Driver Identity Card"
                    }, void 0, false, {
                        fileName: "[project]/components/pdf/DriverCardPDF.tsx",
                        lineNumber: 25,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__["View"], {
                        style: styles.row,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__["View"], {
                                style: styles.col,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__["Text"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__["Text"], {
                                            style: styles.label,
                                            children: "Name: "
                                        }, void 0, false, {
                                            fileName: "[project]/components/pdf/DriverCardPDF.tsx",
                                            lineNumber: 29,
                                            columnNumber: 17
                                        }, this),
                                        name
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/pdf/DriverCardPDF.tsx",
                                    lineNumber: 28,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/pdf/DriverCardPDF.tsx",
                                lineNumber: 27,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__["Image"], {
                                src: qrPng,
                                style: {
                                    width: 120,
                                    height: 120
                                }
                            }, void 0, false, {
                                fileName: "[project]/components/pdf/DriverCardPDF.tsx",
                                lineNumber: 32,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/pdf/DriverCardPDF.tsx",
                        lineNumber: 26,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__["Text"], {
                        style: {
                            marginTop: 8,
                            color: "#6b7280"
                        },
                        children: "Scan for live verification. QR encodes only a random ID; no personal details."
                    }, void 0, false, {
                        fileName: "[project]/components/pdf/DriverCardPDF.tsx",
                        lineNumber: 34,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/pdf/DriverCardPDF.tsx",
                lineNumber: 24,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/pdf/DriverCardPDF.tsx",
            lineNumber: 23,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/pdf/DriverCardPDF.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/assert [external] (assert, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[project]/lib/qr.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildQrPayload",
    ()=>buildQrPayload,
    "makeQrPng",
    ()=>makeQrPng
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$qrcode$40$1$2e$5$2e$4$2f$node_modules$2f$qrcode$2f$lib$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/index.js [app-ssr] (ecmascript)");
;
function buildQrPayload(input) {
    const origin = input.origin ?? (("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : "https://example.org");
    return {
        v: 1,
        url: `${origin}/v/${input.qrid}`
    };
}
async function makeQrPng(payload) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$qrcode$40$1$2e$5$2e$4$2f$node_modules$2f$qrcode$2f$lib$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].toDataURL(JSON.stringify(payload), {
        errorCorrectionLevel: "M",
        margin: 1,
        scale: 6
    });
}
}),
"[project]/lib/demo-store-remote.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/demo-store-remote.ts (DriverSnapshot type)
__turbopack_context__.s([
    "loadSnapshotRemote",
    ()=>loadSnapshotRemote,
    "saveSnapshotRemote",
    ()=>saveSnapshotRemote
]);
async function saveSnapshotRemote(s) {
    const res = await fetch("/api/demo/snapshots", {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify(s),
        cache: "no-store"
    });
    if (!res.ok) {
        const j = await res.json().catch(()=>null);
        const msg = getErrorMessage(j) ?? `Failed to save snapshot (${res.status})`;
        throw new Error(msg);
    }
}
async function loadSnapshotRemote(qrid) {
    const res = await fetch(`/api/demo/snapshots/${encodeURIComponent(qrid)}`, {
        method: "GET",
        cache: "no-store"
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
    return await res.json();
}
function getErrorMessage(x) {
    if (!x || typeof x !== "object") return null;
    const rec = x;
    const e = rec["error"];
    return typeof e === "string" ? e : null;
}
}),
"[project]/lib/uuid.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// RFC4122 v4 UUID with fallbacks for older browsers / non-secure contexts.
__turbopack_context__.s([
    "uuidv4",
    ()=>uuidv4
]);
function uuidv4() {
    // Modern browsers with Crypto.randomUUID
    if (typeof crypto !== "undefined") {
        const c = crypto;
        if (typeof c.randomUUID === "function") {
            return c.randomUUID();
        }
        // Web Crypto fallback
        if (typeof c.getRandomValues === "function") {
            const bytes = new Uint8Array(16);
            c.getRandomValues(bytes);
            // Per RFC4122 section 4.4
            const b6 = bytes[6] ?? 0;
            bytes[6] = b6 & 0x0f | 0x40; // version 4
            const b8 = bytes[8] ?? 0;
            bytes[8] = b8 & 0x3f | 0x80; // variant 10
            const hex = Array.from(bytes, (b)=>b.toString(16).padStart(2, "0")).join("");
            return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        }
    }
    // Last-resort (not cryptographically strong)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c)=>{
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : r & 0x3 | 0x8;
        return v.toString(16);
    });
}
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/lib/security.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/security.ts
__turbopack_context__.s([
    "hashPin",
    ()=>hashPin,
    "verifyPin",
    ()=>verifyPin
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
function hashPin(pin) {
    if (!pin) return "";
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["createHash"])("sha256").update(pin).digest("hex");
}
function verifyPin(pin, hash) {
    return hashPin(pin) === hash;
}
}),
"[project]/app/driver/register/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>RegisterPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$hook$2d$form$40$7$2e$62$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-hook-form@7.62.0_react@19.1.0/node_modules/react-hook-form/dist/index.esm.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$hookform$2b$resolvers$40$5$2e$2$2e$1_react$2d$hook$2d$form$40$7$2e$62$2e$0_react$40$19$2e$1$2e$0_$2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@hookform+resolvers@5.2.1_react-hook-form@7.62.0_react@19.1.0_/node_modules/@hookform/resolvers/zod/dist/zod.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$register$2d$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/register-schemas.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$pdf$2f$DriverCardPDF$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/pdf/DriverCardPDF.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$qr$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/qr.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@react-pdf/renderer [external] (@react-pdf/renderer, esm_import)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$demo$2d$store$2d$remote$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/demo-store-remote.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$uuid$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/uuid.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$security$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/security.ts [app-ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$pdf$2f$DriverCardPDF$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$pdf$2f$DriverCardPDF$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
// --- Helper: Generate 4-char alphanumeric PIN
function generatePin() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid 0/O, 1/I
    let pin = "";
    for(let i = 0; i < 4; i++){
        pin += chars[Math.floor(Math.random() * chars.length)];
    }
    return pin;
}
function RegisterPage() {
    const { register, handleSubmit, control, formState: { errors }, watch, setValue } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$hook$2d$form$40$7$2e$62$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useForm"])({
        resolver: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$hookform$2b$resolvers$40$5$2e$2$2e$1_react$2d$hook$2d$form$40$7$2e$62$2e$0_react$40$19$2e$1$2e$0_$2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["zodResolver"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$register$2d$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RegisterSchema"]),
        defaultValues: {
            englishLevel: "Conversational",
            phoneCountry: "CA",
            citizenship: "Canadian Citizen",
            residencyCA: "Citizen",
            consentDate: new Date().toISOString().slice(0, 10),
            certifyAccurate: false,
            otherLanguages: []
        }
    });
    const { fields: work, append: addWork, remove: removeWork } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$hook$2d$form$40$7$2e$62$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useFieldArray"])({
        control,
        name: "work"
    });
    const [submitting, setSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [qrPng, setQrPng] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [pdfUrl, setPdfUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [qrid, setQrid] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [submitError, setSubmitError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [errorSummary, setErrorSummary] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [generatedPin, setGeneratedPin] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const citizenship = watch("citizenship");
    const residency = watch("residencyCA");
    const passportCountry = watch("passportCountry");
    const needPassport = citizenship !== "Canadian Citizen";
    const needPermit = residency === "Work Permit" || residency === "Study Permit";
    const needPR = residency === "Permanent Resident";
    const fullName = [
        watch("givenName") || "",
        watch("middleName") || "",
        watch("surname") || ""
    ].filter(Boolean).join(" ");
    async function onSubmit(values) {
        setSubmitting(true);
        try {
            setSubmitError(null);
            setErrorSummary(null);
            const storeReady = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$register$2d$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizeForStorage"])(values);
            const id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$uuid$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uuidv4"])();
            setQrid(id);
            // Generate random PIN
            const pin = generatePin();
            setGeneratedPin(pin);
            const payload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$qr$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildQrPayload"])({
                qrid: id,
                origin: window.location.origin
            });
            const png = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$qr$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeQrPng"])(payload);
            setQrPng(png);
            const snap = {
                qrid: id,
                pinHash: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$security$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hashPin"])(pin),
                name: [
                    storeReady.givenName,
                    storeReady.middleName,
                    storeReady.surname
                ].filter(Boolean).join(" "),
                dob: storeReady.dob,
                citizenship: storeReady.citizenship,
                residencyCA: storeReady.residencyCA,
                jurisdiction: storeReady.jurisdiction,
                licenseNo: storeReady.licenseNo,
                licenseClass: storeReady.licenseClass,
                licenseExpiry: storeReady.licenseExpiry,
                email: storeReady.email,
                phone: storeReady.phone,
                postal: storeReady.postal,
                country: storeReady.addressCountry,
                region: storeReady.region,
                city: storeReady.city,
                address1: storeReady.address1,
                address2: storeReady.address2,
                prNumber: storeReady.prNumber,
                permitType: storeReady.permitType,
                uci: storeReady.uci,
                permitExpiry: storeReady.permitExpiry,
                passportCountry: storeReady.passportCountry,
                passportNumber: storeReady.passportNumber,
                englishLevel: storeReady.englishLevel,
                otherLanguages: storeReady.otherLanguages,
                issuedAt: new Date().toISOString()
            };
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$demo$2d$store$2d$remote$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["saveSnapshotRemote"])(snap);
            const doc = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$pdf$2f$DriverCardPDF$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                name: snap.name,
                qrPng: png
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 148,
                columnNumber: 19
            }, this);
            const blob = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f40$react$2d$pdf$2f$renderer__$5b$external$5d$__$2840$react$2d$pdf$2f$renderer$2c$__esm_import$29$__["pdf"])(doc).toBlob();
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setSubmitError(msg);
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
        } finally{
            setSubmitting(false);
        }
    }
    function onInvalid(errs) {
        const msgs = [];
        const pushMsg = (v)=>{
            if (!v) return;
            if (typeof v === "string") msgs.push(v);
        };
        const order = [
            "givenName",
            "surname",
            "jurisdiction",
            "licenseNo",
            "licenseClass",
            "licenseExpiry",
            "dob",
            "email",
            "phone",
            "postal",
            "citizenship",
            "residencyCA",
            "prNumber",
            "permitType",
            "uci",
            "passportCountry",
            "passportNumber",
            "docLicenseFront",
            "docLicenseBack",
            "docHealthCard",
            "docPR",
            "docPassport",
            "docPermit",
            "consentName",
            "consentDate",
            "consentAbstract",
            "certifyAccurate"
        ];
        for (const k of order){
            const issue = errs[k]?.message;
            if (issue) pushMsg(issue);
        }
        setErrorSummary(msgs.length ? msgs : [
            "Please review the highlighted fields."
        ]);
        const firstKey = order.find((k)=>Boolean(errs[k]));
        if (firstKey) {
            const el = document.querySelector(`[name="${String(firstKey)}"]`);
            if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
            if (el && typeof el.focus === "function") el.focus();
        }
    }
    function safeFileName(base) {
        return base.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 40) || "card";
    }
    function setFile(key, f) {
        setValue(key, f ?? undefined, {
            shouldValidate: true
        });
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "mx-auto max-w-3xl px-4 py-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900",
                children: "Secure submission • QR contains only a random ID • Minimal non-PII metadata is stored temporarily for the verification demo"
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 203,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "mb-4 text-2xl font-semibold text-slate-900",
                children: "Driver Registration"
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 207,
                columnNumber: 7
            }, this),
            submitError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900",
                children: submitError
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 210,
                columnNumber: 9
            }, this),
            errorSummary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-medium",
                        children: "Please fix the following:"
                    }, void 0, false, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 216,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "list-inside list-disc",
                        children: errorSummary.slice(0, 6).map((m, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: m
                            }, i, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 219,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 217,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 215,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: handleSubmit(onSubmit, onInvalid),
                className: "space-y-10"
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 224,
                columnNumber: 7
            }, this),
            qrPng && pdfUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mt-10 rounded border border-slate-200 p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "mb-2 text-base font-medium",
                        children: "Your QR & Card"
                    }, void 0, false, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 232,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                src: qrPng,
                                alt: "QR code",
                                width: 160,
                                height: 160,
                                className: "h-40 w-40 border border-slate-200"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 234,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: pdfUrl,
                                        download: `driver-card-${safeFileName(fullName || (qrid?.slice(0, 8) ?? "card"))}.pdf`,
                                        className: "inline-flex rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800",
                                        children: "Download Card (PDF)"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 242,
                                        columnNumber: 15
                                    }, this),
                                    generatedPin && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm font-mono text-emerald-700",
                                        children: [
                                            "Your system-generated PIN: ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: generatedPin
                                            }, void 0, false, {
                                                fileName: "[project]/app/driver/register/page.tsx",
                                                lineNumber: 251,
                                                columnNumber: 46
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 250,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-slate-600",
                                        children: "Card shows only your name and this QR. The QR contains only a random ID (no personal data). A minimal non-PII snapshot is stored temporarily to enable verification."
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 254,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 241,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 233,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 231,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/driver/register/page.tsx",
        lineNumber: 202,
        columnNumber: 5
    }, this);
}
function Field({ label, err, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "block",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "block text-sm text-slate-700",
                children: label
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 269,
                columnNumber: 7
            }, this),
            children,
            err && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-rose-600",
                children: err
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 271,
                columnNumber: 15
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/driver/register/page.tsx",
        lineNumber: 268,
        columnNumber: 5
    }, this);
}
function OtherLanguagesRows({ value, onChange }) {
    const rows = value ?? [];
    function add() {
        onChange([
            ...rows || [],
            {
                language: "",
                level: "Conversational"
            }
        ]);
    }
    function remove(idx) {
        const next = [
            ...rows
        ];
        next.splice(idx, 1);
        onChange(next);
    }
    function setRow(idx, patch) {
        const next = [
            ...rows
        ];
        next[idx] = {
            ...next[idx],
            ...patch
        };
        onChange(next);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-2",
        children: [
            rows.map((row, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid gap-3 sm:grid-cols-3 items-end",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Other language",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: row.language,
                                onChange: (e)=>setRow(idx, {
                                        language: e.target.value
                                    }),
                                className: "mt-1 w-full rounded border border-slate-200 bg-slate-50 p-2 text-slate-700",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "Select language"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 314,
                                        columnNumber: 15
                                    }, this),
                                    [
                                        "Arabic",
                                        "Bengali",
                                        "Chinese (Cantonese)",
                                        "Chinese (Mandarin)",
                                        "Dutch",
                                        "English",
                                        "Farsi",
                                        "French",
                                        "German",
                                        "Gujarati",
                                        "Hebrew",
                                        "Hindi",
                                        "Italian",
                                        "Japanese",
                                        "Korean",
                                        "Malay",
                                        "Marathi",
                                        "Panjabi (Punjabi)",
                                        "Polish",
                                        "Portuguese",
                                        "Punjabi",
                                        "Russian",
                                        "Spanish",
                                        "Tagalog",
                                        "Tamil",
                                        "Telugu",
                                        "Thai",
                                        "Turkish",
                                        "Ukrainian",
                                        "Urdu",
                                        "Vietnamese"
                                    ].map((l)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: l,
                                            children: l
                                        }, l, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 320,
                                            columnNumber: 17
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 309,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/driver/register/page.tsx",
                            lineNumber: 308,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Level",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: row.level,
                                onChange: (e)=>setRow(idx, {
                                        level: e.target.value
                                    }),
                                className: "mt-1 w-full rounded border border-slate-300 p-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: "Basic"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 332,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: "Conversational"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 333,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: "Fluent"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 334,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: "Native"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 335,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 327,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/driver/register/page.tsx",
                            lineNumber: 326,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-end",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>remove(idx),
                                className: "ml-auto rounded border px-3 py-2 text-sm hover:bg-slate-50",
                                children: "Remove"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 339,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/driver/register/page.tsx",
                            lineNumber: 338,
                            columnNumber: 11
                        }, this)
                    ]
                }, idx, true, {
                    fileName: "[project]/app/driver/register/page.tsx",
                    lineNumber: 307,
                    columnNumber: 9
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: add,
                    className: "ml-auto inline-flex items-center gap-2 rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800",
                    title: "Add another language",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "+ Add language"
                    }, void 0, false, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 356,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/driver/register/page.tsx",
                    lineNumber: 350,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 349,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/driver/register/page.tsx",
        lineNumber: 305,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__20772df1._.js.map