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
"[project]/lib/phone-format.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatPhoneForDisplay",
    ()=>formatPhoneForDisplay,
    "toE164",
    ()=>toE164
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$libphonenumber$2d$js$40$1$2e$12$2e$17$2f$node_modules$2f$libphonenumber$2d$js$2f$min$2f$exports$2f$AsYouType$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/libphonenumber-js@1.12.17/node_modules/libphonenumber-js/min/exports/AsYouType.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$libphonenumber$2d$js$40$1$2e$12$2e$17$2f$node_modules$2f$libphonenumber$2d$js$2f$min$2f$exports$2f$parsePhoneNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__parsePhoneNumber__as__parsePhoneNumberFromString$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/libphonenumber-js@1.12.17/node_modules/libphonenumber-js/min/exports/parsePhoneNumber.js [app-ssr] (ecmascript) <export parsePhoneNumber as parsePhoneNumberFromString>");
;
function formatPhoneForDisplay(input, defaultCountry) {
    const ayt = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$libphonenumber$2d$js$40$1$2e$12$2e$17$2f$node_modules$2f$libphonenumber$2d$js$2f$min$2f$exports$2f$AsYouType$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AsYouType"](defaultCountry);
    return ayt.input(input);
}
function toE164(input, defaultCountry) {
    const p = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$libphonenumber$2d$js$40$1$2e$12$2e$17$2f$node_modules$2f$libphonenumber$2d$js$2f$min$2f$exports$2f$parsePhoneNumber$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__parsePhoneNumber__as__parsePhoneNumberFromString$3e$__["parsePhoneNumberFromString"])(input, defaultCountry);
    return p?.isValid() ? p.number : null; // E.164 or null
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
            code,
            name
        })).sort((a, b)=>a.name.localeCompare(b.name));
}
function isCountry(code) {
    if (!code) return false;
    try {
        return Boolean(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$i18n$2d$iso$2d$countries$40$7$2e$14$2e$0$2f$node_modules$2f$i18n$2d$iso$2d$countries$2f$entry$2d$node$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].alpha2ToNumeric(code.toUpperCase()));
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
    "passportPatternFor",
    ()=>passportPatternFor
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
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$phone$2d$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/phone-format.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$classes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/license-classes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/passport/validate.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/countries.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
const dateISO = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().refine((v)=>/^\d{4}-\d{2}-\d{2}$/.test(v), "Use YYYY-MM-DD");
const RegisterSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    // Names (required)
    givenName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Enter given name").max(60),
    surname: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Enter surname").max(60),
    middleName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    givenNameKey: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    surnameKey: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Jurisdiction & licence (required)
    jurisdiction: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "CA-AB",
        "CA-BC",
        "CA-MB",
        "CA-NB",
        "CA-NL",
        "CA-NS",
        "CA-ON",
        "CA-PE",
        "CA-QC",
        "CA-SK"
    ], {
        message: "Select issuing authority"
    }),
    licenseNo: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "Enter licence number"),
    licenseClass: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Enter class").max(5),
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
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email(),
    phone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(7),
    phoneCountry: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "CA",
        "US"
    ]).default("CA"),
    // Address (postal required; others optional)
    address1: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    address2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    city: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    region: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    postal: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "Enter postal/ZIP"),
    country: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Status wizard
    citizenship: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "CA",
        "US",
        "Other"
    ]).default("CA"),
    residencyCA: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "Citizen",
        "PR",
        "Work Permit",
        "Study Permit",
        "Visitor"
    ]).default("Citizen"),
    prNumber: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    prExpiry: dateISO.optional(),
    permitType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    permitExpiry: dateISO.optional(),
    uci: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    passportCountry: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    passportNumber: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    passportExpiry: dateISO.optional(),
    englishLevel: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "Basic",
        "Conversational",
        "Fluent",
        "Native"
    ]),
    otherLanguages: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        lang: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2),
        level: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            "Basic",
            "Conversational",
            "Fluent",
            "Native"
        ])
    })).max(10).optional(),
    work: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        company: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        role: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        start: dateISO.optional(),
        end: dateISO.optional()
    })).max(10).optional(),
    consentAbstract: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().refine((v)=>v === true, {
        message: "Consent is required"
    }),
    consentName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, "Type your name to sign"),
    consentDate: dateISO,
    certifyAccurate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().refine((v)=>v === true, {
        message: "You must certify accuracy"
    }),
    // Documents
    docLicenseFront: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File).optional(),
    docLicenseBack: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File).optional(),
    docPassport: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File).optional(),
    docPR: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File).optional(),
    docPermit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File).optional()
}).superRefine((v, ctx)=>{
    // Age >= 16, expiry >= today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    const minDob = new Date(yyyy - 16, mm, dd);
    const dob = new Date(v.dob);
    const exp = new Date(v.licenseExpiry);
    if (isNaN(dob.getTime()) || dob > minDob) ctx.addIssue({
        code: "custom",
        path: [
            "dob"
        ],
        message: "Driver must be at least 16 years old"
    });
    if (isNaN(exp.getTime()) || exp < new Date(yyyy, mm, dd)) ctx.addIssue({
        code: "custom",
        path: [
            "licenseExpiry"
        ],
        message: "Expiry must be in the future"
    });
    // Licence mask by jurisdiction
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidLicence"])(v.jurisdiction, v.licenseNo)) {
        ctx.addIssue({
            code: "custom",
            path: [
                "licenseNo"
            ],
            message: "Number doesn’t match jurisdiction format"
        });
    }
    // Licence class allowed for jurisdiction
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
    // Phone → must parse to E.164
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$phone$2d$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toE164"])(v.phone, v.phoneCountry)) {
        ctx.addIssue({
            code: "custom",
            path: [
                "phone"
            ],
            message: "Enter a valid phone number"
        });
    }
    // Postal logic
    const ca = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["detectCA"])(v.postal);
    if (ca.ok) {
    // ok
    } else if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isUSZip"])(v.postal)) {
        ctx.addIssue({
            code: "custom",
            path: [
                "postal"
            ],
            message: "Enter a valid Canadian postal code or US ZIP"
        });
    }
    // Status wizard rules
    if (v.citizenship === "CA") {
        if (v.residencyCA !== "Citizen") {
            ctx.addIssue({
                code: "custom",
                path: [
                    "residencyCA"
                ],
                message: "Canadian citizens must select Citizen"
            });
        }
    } else {
        // Non-Canadian → passport required for all residencies
        "passportCountry,passportNumber,passportExpiry".split(",").forEach((k)=>{
            const rec = v;
            const val = rec[k];
            if (!val || typeof val === "string" && !val.trim()) ctx.addIssue({
                code: "custom",
                path: [
                    k
                ],
                message: "Required"
            });
        });
        if (v.passportCountry && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isCountry"])(v.passportCountry)) {
            ctx.addIssue({
                code: "custom",
                path: [
                    "passportCountry"
                ],
                message: "Select a valid country"
            });
        }
        if (v.passportCountry && v.passportNumber && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isValidPassport"])(v.passportCountry, v.passportNumber)) {
            const pat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["passportPatternFor"])(v.passportCountry);
            ctx.addIssue({
                code: "custom",
                path: [
                    "passportNumber"
                ],
                message: `Format doesn’t match (${pat.hint})`
            });
        }
        // Permits need extra fields
        if ([
            "Work Permit",
            "Study Permit"
        ].includes(v.residencyCA)) {
            "permitType,permitExpiry".split(",").forEach((k)=>{
                const rec = v;
                const val = rec[k];
                if (!val || typeof val === "string" && !val.trim()) ctx.addIssue({
                    code: "custom",
                    path: [
                        k
                    ],
                    message: "Required"
                });
            });
        }
    }
    // PR path → PR number exactly 10 digits
    if (v.residencyCA === "PR") {
        const pr = (v.prNumber ?? "").replace(/\D/g, "");
        if (pr.length !== 10) {
            ctx.addIssue({
                code: "custom",
                path: [
                    "prNumber"
                ],
                message: "PR card number must be exactly 10 digits"
            });
        }
        if (!v.prExpiry?.trim()) ctx.addIssue({
            code: "custom",
            path: [
                "prExpiry"
            ],
            message: "PR expiry required"
        });
    }
    // Work/Study → UCI required with 8 or 10 digits (hyphens allowed)
    if ([
        "Work Permit",
        "Study Permit"
    ].includes(v.residencyCA)) {
        const uci = (v.uci ?? "").replace(/\D/g, "");
        if (!(uci.length === 8 || uci.length === 10)) {
            ctx.addIssue({
                code: "custom",
                path: [
                    "uci"
                ],
                message: "UCI must be 8 or 10 digits (hyphens allowed)"
            });
        }
    }
    // Documents: validate size/type and conditional requiredness
    const need = {
        licenseFront: true,
        licenseBack: false,
        pr: v.residencyCA === "PR",
        passport: v.citizenship !== "CA",
        permit: [
            "Work Permit",
            "Study Permit"
        ].includes(v.residencyCA)
    };
    "docLicenseFront,docLicenseBack,docPassport,docPR,docPermit".split(",").forEach((k)=>{
        const rec = v;
        const f = rec[k];
        if (f && (![
            "image/jpeg",
            "image/png"
        ].includes(f.type) || f.size > 4 * 1024 * 1024)) {
            ctx.addIssue({
                code: "custom",
                path: [
                    k
                ],
                message: "Upload JPG/PNG ≤ 4MB"
            });
        }
    });
    function req(path, file, label) {
        if (!file) ctx.addIssue({
            code: "custom",
            path: [
                path
            ],
            message: `${label} is required`
        });
    }
    if (need.licenseFront) req("docLicenseFront", v.docLicenseFront, "Licence (front)");
    if (need.licenseBack) req("docLicenseBack", v.docLicenseBack, "Licence (back)");
    if (need.pr) req("docPR", v.docPR, "PR card image");
    if (need.passport) req("docPassport", v.docPassport, "Passport image");
    if (need.permit) req("docPermit", v.docPermit, "Permit document image");
});
function normalizeForStorage(values) {
    return {
        ...values,
        licenseNo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizedLicence"])(values.licenseNo),
        passportNumber: values.passportCountry ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizePassport"])(values.passportNumber ?? "") : undefined,
        prNumber: values.prNumber ? values.prNumber.replace(/\D/g, "") : undefined,
        uci: values.uci ? values.uci.replace(/\D/g, "") : undefined
    };
}
}),
"[project]/components/driver/DocUploadField.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DocUploadField
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
const ACCEPT = [
    "image/jpeg",
    "image/png"
]; // JPG/PNG only
const MAX = 4 * 1024 * 1024; // 4 MB
function DocUploadField({ label, hint, value, onChange, id, required = false }) {
    const generatedId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useId"])();
    const inputId = id ?? generatedId;
    const [err, setErr] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    function handle(e) {
        const f = e.target.files?.[0];
        if (!f) return;
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                htmlFor: inputId,
                className: "block text-sm font-medium text-slate-700",
                children: [
                    label,
                    " ",
                    required && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-rose-600",
                        children: "*"
                    }, void 0, false, {
                        fileName: "[project]/components/driver/DocUploadField.tsx",
                        lineNumber: 44,
                        columnNumber: 30
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/driver/DocUploadField.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    id: inputId,
                    type: "file",
                    accept: ACCEPT.join(","),
                    className: "block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-white hover:file:bg-slate-800",
                    onChange: handle
                }, void 0, false, {
                    fileName: "[project]/components/driver/DocUploadField.tsx",
                    lineNumber: 47,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/driver/DocUploadField.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            hint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-slate-500",
                children: hint
            }, void 0, false, {
                fileName: "[project]/components/driver/DocUploadField.tsx",
                lineNumber: 55,
                columnNumber: 16
            }, this),
            err && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-rose-600",
                "aria-live": "polite",
                children: err
            }, void 0, false, {
                fileName: "[project]/components/driver/DocUploadField.tsx",
                lineNumber: 57,
                columnNumber: 9
            }, this),
            value && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-3 rounded border border-slate-200 p-2 text-xs text-slate-600",
                children: [
                    value.name,
                    " • ",
                    (value.size / 1024 / 1024).toFixed(1),
                    " MB",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "ml-auto text-xs underline",
                        onClick: ()=>onChange(null),
                        children: "Remove"
                    }, void 0, false, {
                        fileName: "[project]/components/driver/DocUploadField.tsx",
                        lineNumber: 64,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/driver/DocUploadField.tsx",
                lineNumber: 62,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/driver/DocUploadField.tsx",
        lineNumber: 42,
        columnNumber: 5
    }, this);
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
"[project]/lib/names.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "canonicalKey",
    ()=>canonicalKey,
    "titleCaseName",
    ()=>titleCaseName
]);
function titleCaseName(s) {
    return s.trim().toLowerCase().replace(/\b[\p{L}\p{M}]+/gu, (w)=>(w[0]?.toUpperCase() ?? "") + w.slice(1));
}
function canonicalKey(s) {
    // Uppercase, strip diacritics, collapse spaces
    return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase().replace(/\s+/g, " ").trim();
}
}),
"[project]/components/inputs/NameFields.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NameFields
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$names$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/names.ts [app-ssr] (ecmascript)");
"use client";
;
;
function NameFields({ register, setValue, errors }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid gap-4 sm:grid-cols-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                label: "Given name",
                err: errors.givenName?.message,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    ...register("givenName"),
                    className: "mt-1 w-full rounded border border-slate-300 p-2",
                    onBlur: (e)=>{
                        const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$names$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["titleCaseName"])(e.target.value);
                        setValue("givenName", t, {
                            shouldValidate: true
                        });
                        setValue("givenNameKey", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$names$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["canonicalKey"])(t));
                    }
                }, void 0, false, {
                    fileName: "[project]/components/inputs/NameFields.tsx",
                    lineNumber: 18,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/inputs/NameFields.tsx",
                lineNumber: 17,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                label: "Middle (optional)",
                err: errors.middleName?.message,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    ...register("middleName"),
                    className: "mt-1 w-full rounded border border-slate-300 p-2",
                    onBlur: (e)=>{
                        const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$names$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["titleCaseName"])(e.target.value);
                        setValue("middleName", t);
                    }
                }, void 0, false, {
                    fileName: "[project]/components/inputs/NameFields.tsx",
                    lineNumber: 29,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/inputs/NameFields.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                label: "Surname",
                err: errors.surname?.message,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    ...register("surname"),
                    className: "mt-1 w-full rounded border border-slate-300 p-2",
                    onBlur: (e)=>{
                        const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$names$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["titleCaseName"])(e.target.value);
                        setValue("surname", t, {
                            shouldValidate: true
                        });
                        setValue("surnameKey", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$names$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["canonicalKey"])(t));
                    }
                }, void 0, false, {
                    fileName: "[project]/components/inputs/NameFields.tsx",
                    lineNumber: 39,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/inputs/NameFields.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/NameFields.tsx",
        lineNumber: 16,
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
                fileName: "[project]/components/inputs/NameFields.tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            children,
            err && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-rose-600",
                children: err
            }, void 0, false, {
                fileName: "[project]/components/inputs/NameFields.tsx",
                lineNumber: 58,
                columnNumber: 15
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/NameFields.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/inputs/PhoneInput.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PhoneInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$phone$2d$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/phone-format.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function PhoneInput({ register, setValue, watch, errors }) {
    const [display, setDisplay] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const phoneCountry = watch("phoneCountry");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid gap-3 sm:grid-cols-[8rem_1fr]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "block",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "block text-sm text-slate-700",
                        children: "Country"
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/PhoneInput.tsx",
                        lineNumber: 24,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        ...register("phoneCountry"),
                        defaultValue: "CA",
                        className: "mt-1 w-full rounded border border-slate-300 p-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "CA",
                                children: "Canada (+1)"
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/PhoneInput.tsx",
                                lineNumber: 30,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "US",
                                children: "United States (+1)"
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/PhoneInput.tsx",
                                lineNumber: 31,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/inputs/PhoneInput.tsx",
                        lineNumber: 25,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/PhoneInput.tsx",
                lineNumber: 23,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "block",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "block text-sm text-slate-700",
                        children: "Phone"
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/PhoneInput.tsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        ...register("phone"),
                        value: display,
                        onChange: (e)=>{
                            const v = e.target.value;
                            setDisplay((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$phone$2d$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatPhoneForDisplay"])(v, phoneCountry ?? "CA"));
                            setValue("phone", v, {
                                shouldValidate: false
                            });
                        },
                        onBlur: (e)=>{
                            const e164 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$phone$2d$format$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toE164"])(e.target.value, phoneCountry ?? "CA");
                            if (e164) {
                                setDisplay(e164);
                                setValue("phone", e164, {
                                    shouldValidate: true
                                });
                            }
                        },
                        inputMode: "tel",
                        className: "mt-1 w-full rounded border border-slate-300 p-2",
                        placeholder: "+1 204 555 1234"
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/PhoneInput.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    errors.phone?.message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-rose-600",
                        children: errors.phone.message
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/PhoneInput.tsx",
                        lineNumber: 56,
                        columnNumber: 35
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/PhoneInput.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/PhoneInput.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/inputs/PostalInput.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PostalInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/postal.ts [app-ssr] (ecmascript)");
"use client";
;
;
function PostalInput({ register, setValue, errors }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "block",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "block text-sm text-slate-700",
                children: "Postal/ZIP"
            }, void 0, false, {
                fileName: "[project]/components/inputs/PostalInput.tsx",
                lineNumber: 17,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                ...register("postal"),
                className: "mt-1 w-full rounded border border-slate-300 p-2",
                placeholder: "A1A 1A1 or 90210",
                onInput: (e)=>{
                    const t = e.target;
                    // Auto uppercase + single space after 3 for Canada pattern
                    let v = t.value.toUpperCase();
                    v = v.replace(/[^A-Z0-9\s-]/g, "");
                    if (/^[ABCEGHJ-NPRSTVXY]\d[A-Z]/.test(v.replace(/\s/g, ""))) {
                        const s = v.replace(/\s+/g, "").slice(0, 6);
                        t.value = s.length > 3 ? `${s.slice(0, 3)} ${s.slice(3)}` : s;
                    }
                },
                onBlur: (e)=>{
                    const raw = e.target.value;
                    const ca = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["detectCA"])(raw);
                    if (ca.ok) {
                        if (ca.normalized) setValue("postal", ca.normalized);
                        setValue("country", "CA");
                        if (ca.province) setValue("region", ca.province);
                        return;
                    }
                    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isUSZip"])(raw)) {
                        setValue("country", "US");
                    }
                }
            }, void 0, false, {
                fileName: "[project]/components/inputs/PostalInput.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            errors.postal?.message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-rose-600",
                children: errors.postal.message
            }, void 0, false, {
                fileName: "[project]/components/inputs/PostalInput.tsx",
                lineNumber: 46,
                columnNumber: 34
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/PostalInput.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/inputs/LicenceInput.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LicenceInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/license-rules.ts [app-ssr] (ecmascript)");
"use client";
;
;
function LicenceInput({ register, setValue, watch, errors }) {
    const jurisdiction = watch("jurisdiction");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "block",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "block text-sm text-slate-700",
                children: "Licence number"
            }, void 0, false, {
                fileName: "[project]/components/inputs/LicenceInput.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                ...register("licenseNo"),
                className: "mt-1 w-full rounded border border-slate-300 p-2 font-mono",
                placeholder: maskHint(jurisdiction),
                onInput: (e)=>{
                    const t = e.target;
                    const newVal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$rules$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatLicence"])(jurisdiction, t.value);
                    t.value = newVal;
                    setValue("licenseNo", newVal, {
                        shouldValidate: false
                    });
                }
            }, void 0, false, {
                fileName: "[project]/components/inputs/LicenceInput.tsx",
                lineNumber: 21,
                columnNumber: 7
            }, this),
            errors.licenseNo?.message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-rose-600",
                children: errors.licenseNo.message
            }, void 0, false, {
                fileName: "[project]/components/inputs/LicenceInput.tsx",
                lineNumber: 32,
                columnNumber: 37
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 text-xs text-slate-500",
                children: "Type letters/numbers only—formatting is automatic."
            }, void 0, false, {
                fileName: "[project]/components/inputs/LicenceInput.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/LicenceInput.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
function maskHint(j) {
    switch(j){
        case "CA-ON":
            return "A####-#####-#####";
        case "CA-BC":
            return "####### or ########";
        case "CA-AB":
            return "######-### or 5–9 digits";
        case "CA-SK":
            return "########";
        case "CA-QC":
            return "A############";
        case "CA-NL":
            return "A#########";
        default:
            return "Up to 15 letters/digits";
    }
}
}),
"[project]/components/inputs/StatusWizard.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StatusWizard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function StatusWizard({ register, watch, setValue, errors }) {
    const citizenship = watch("citizenship") || "CA";
    const residency = watch("residencyCA");
    // passport fields handled at page-level
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (citizenship === "CA") {
            setValue("residencyCA", "Citizen");
            setValue("permitType", undefined);
            setValue("permitExpiry", undefined);
            setValue("passportCountry", undefined);
            setValue("passportNumber", undefined);
            setValue("passportExpiry", undefined);
            setValue("uci", undefined);
        }
    }, [
        citizenship,
        setValue
    ]);
    const residencyOptions = citizenship === "CA" ? [
        "Citizen"
    ] : [
        "PR",
        "Work Permit",
        "Study Permit",
        "Visitor"
    ];
    const needPermit = [
        "Work Permit",
        "Study Permit"
    ].includes(residency);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "space-y-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-lg font-medium",
                children: "Status & Eligibility"
            }, void 0, false, {
                fileName: "[project]/components/inputs/StatusWizard.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-4 sm:grid-cols-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                        label: "Citizenship",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                            ...register("citizenship"),
                            className: "mt-1 w-full rounded border border-slate-300 p-2",
                            defaultValue: "CA",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "CA",
                                    children: "Canada"
                                }, void 0, false, {
                                    fileName: "[project]/components/inputs/StatusWizard.tsx",
                                    lineNumber: 44,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "US",
                                    children: "United States"
                                }, void 0, false, {
                                    fileName: "[project]/components/inputs/StatusWizard.tsx",
                                    lineNumber: 45,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "Other",
                                    children: "Other"
                                }, void 0, false, {
                                    fileName: "[project]/components/inputs/StatusWizard.tsx",
                                    lineNumber: 46,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/inputs/StatusWizard.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                        label: "Residency in Canada",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                            ...register("residencyCA"),
                            className: "mt-1 w-full rounded border border-slate-300 p-2",
                            value: residency || (citizenship === "CA" ? "Citizen" : ""),
                            onChange: (e)=>setValue("residencyCA", e.target.value),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: "",
                                    disabled: true,
                                    children: "Select"
                                }, void 0, false, {
                                    fileName: "[project]/components/inputs/StatusWizard.tsx",
                                    lineNumber: 57,
                                    columnNumber: 13
                                }, this),
                                residencyOptions.map((o)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: o
                                    }, o, false, {
                                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                                        lineNumber: 61,
                                        columnNumber: 15
                                    }, this))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/inputs/StatusWizard.tsx",
                            lineNumber: 51,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                        lineNumber: 50,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/StatusWizard.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this),
            needPermit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-4 sm:grid-cols-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                        label: "Permit type",
                        err: errors.permitType?.message,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            ...register("permitType"),
                            className: "mt-1 w-full rounded border border-slate-300 p-2",
                            placeholder: "e.g., LMIA, PGWP"
                        }, void 0, false, {
                            fileName: "[project]/components/inputs/StatusWizard.tsx",
                            lineNumber: 70,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                        lineNumber: 69,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                        label: "Permit expiry",
                        err: errors.permitExpiry?.message,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "date",
                            ...register("permitExpiry"),
                            className: "mt-1 w-full rounded border border-slate-300 p-2"
                        }, void 0, false, {
                            fileName: "[project]/components/inputs/StatusWizard.tsx",
                            lineNumber: 73,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                        lineNumber: 72,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                        label: "UCI (Client ID)",
                        err: errors.uci?.message,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            ...register("uci"),
                            className: "mt-1 w-full rounded border border-slate-300 p-2 font-mono",
                            placeholder: "0000-0000 or 00-0000-0000"
                        }, void 0, false, {
                            fileName: "[project]/components/inputs/StatusWizard.tsx",
                            lineNumber: 76,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                        lineNumber: 75,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/StatusWizard.tsx",
                lineNumber: 68,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/StatusWizard.tsx",
        lineNumber: 38,
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
                fileName: "[project]/components/inputs/StatusWizard.tsx",
                lineNumber: 89,
                columnNumber: 7
            }, this),
            children,
            err && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-rose-600",
                children: err
            }, void 0, false, {
                fileName: "[project]/components/inputs/StatusWizard.tsx",
                lineNumber: 91,
                columnNumber: 15
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/StatusWizard.tsx",
        lineNumber: 88,
        columnNumber: 5
    }, this);
} // countries now sourced from i18n-iso-countries via allCountries()
}),
"[project]/components/inputs/LicenseClassSelect.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LicenseClassSelect
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$classes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/license-classes.ts [app-ssr] (ecmascript)");
"use client";
;
;
const AIR_BRAKE_LABEL = {
    "CA-ON": "Air brake (Z)",
    "CA-MB": "Air brake (A)",
    "CA-AB": "Air brake (Q/endorsement)",
    "CA-SK": "Air brake",
    "CA-BC": "Air brake",
    "CA-QC": "Air brake (F endorsement)",
    "CA-NB": "Air brake",
    "CA-NL": "Air brake",
    "CA-NS": "Air brake",
    "CA-PE": "Air brake"
};
function LicenseClassSelect({ register, setValue, watch, errors }) {
    const jurisdiction = watch("jurisdiction");
    const allowed = jurisdiction ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$classes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["classesFor"])(jurisdiction) : [];
    const label = AIR_BRAKE_LABEL[jurisdiction ?? ""] ?? "Air brake";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid gap-4 sm:grid-cols-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "block",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "block text-sm text-slate-700",
                        children: "Licence class"
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        ...register("licenseClass"),
                        disabled: !jurisdiction,
                        onChange: (e)=>setValue("licenseClass", e.target.value),
                        className: "mt-1 w-full rounded border border-slate-300 p-2",
                        children: [
                            !jurisdiction && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "Select jurisdiction first"
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                                lineNumber: 44,
                                columnNumber: 29
                            }, this),
                            jurisdiction && allowed.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "No classes found"
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                                lineNumber: 45,
                                columnNumber: 52
                            }, this),
                            allowed.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: c,
                                    children: c
                                }, c, false, {
                                    fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                                    lineNumber: 47,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this),
                    errors?.licenseClass?.message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-rose-600",
                        children: String(errors.licenseClass.message)
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                        lineNumber: 53,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "mt-6 inline-flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "checkbox",
                        ...register("airBrake"),
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-sm text-slate-700",
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/inputs/CountrySelect.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CountrySelect
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/countries.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
const COUNTRIES = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["allCountries"])();
function CountrySelect({ name, label = "Country", register, setValue, errors, defaultCode }) {
    const [q, setQ] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const filtered = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const s = q.trim().toLowerCase();
        if (!s) return COUNTRIES;
        return COUNTRIES.filter((c)=>c.name.toLowerCase().includes(s) || c.code.toLowerCase().includes(s));
    }, [
        q
    ]);
    function errorOf() {
        const e = errors?.[name];
        const msg = e?.message;
        return typeof msg === "string" ? msg : undefined;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "block",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "block text-sm text-slate-700",
                    children: label
                }, void 0, false, {
                    fileName: "[project]/components/inputs/CountrySelect.tsx",
                    lineNumber: 35,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/inputs/CountrySelect.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-2 sm:grid-cols-[1fr_18rem]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        value: q,
                        onChange: (e)=>setQ(e.target.value),
                        className: "rounded border border-slate-300 p-2",
                        placeholder: "Search country…"
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/CountrySelect.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        ...register(name),
                        defaultValue: defaultCode ?? "",
                        onChange: (e)=>setValue(name, e.target.value, {
                                shouldValidate: true,
                                shouldDirty: true
                            }),
                        className: "rounded border border-slate-300 p-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                disabled: true,
                                children: "Select country"
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/CountrySelect.tsx",
                                lineNumber: 50,
                                columnNumber: 11
                            }, this),
                            filtered.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: c.code,
                                    children: c.name
                                }, c.code, false, {
                                    fileName: "[project]/components/inputs/CountrySelect.tsx",
                                    lineNumber: 54,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/inputs/CountrySelect.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/CountrySelect.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            errorOf() && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-rose-600",
                children: errorOf()
            }, void 0, false, {
                fileName: "[project]/components/inputs/CountrySelect.tsx",
                lineNumber: 60,
                columnNumber: 21
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/CountrySelect.tsx",
        lineNumber: 33,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/inputs/PassportInput.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PassportInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/passport/validate.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function PassportInput({ countryCode, register, setValue, errors }) {
    const [v, setV] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const pat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["passportPatternFor"])(countryCode), [
        countryCode
    ]);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!inputRef.current) return;
        if (pat.maxLen && v.length > pat.maxLen) {
            const clipped = v.slice(0, pat.maxLen);
            setV(clipped);
            setValue("passportNumber", clipped, {
                shouldValidate: true
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        countryCode
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "block",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "block text-sm text-slate-700",
                    children: "Passport number"
                }, void 0, false, {
                    fileName: "[project]/components/inputs/PassportInput.tsx",
                    lineNumber: 35,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/inputs/PassportInput.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                ...(()=>{
                    const r = register("passportNumber");
                    return r;
                })(),
                ref: (el)=>{
                    const r = register("passportNumber");
                    if (typeof r.ref === "function") r.ref(el);
                    else if (r.ref) r.ref.current = el;
                    inputRef.current = el;
                },
                value: v,
                onChange: (e)=>{
                    let s = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                    if (pat.maxLen) s = s.slice(0, pat.maxLen);
                    setV(s);
                    setValue("passportNumber", s, {
                        shouldValidate: false
                    });
                },
                onBlur: (e)=>{
                    const canon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["normalizePassport"])(e.target.value);
                    setV(canon);
                    setValue("passportNumber", canon, {
                        shouldValidate: true
                    });
                },
                inputMode: "text",
                autoCapitalize: "characters",
                className: "mt-1 w-full rounded border border-slate-300 p-2 font-mono",
                placeholder: pat.hint,
                "aria-describedby": "passport-hint"
            }, void 0, false, {
                fileName: "[project]/components/inputs/PassportInput.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                id: "passport-hint",
                className: "text-xs text-slate-500",
                children: [
                    "Format: ",
                    pat.hint
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/PassportInput.tsx",
                lineNumber: 63,
                columnNumber: 7
            }, this),
            errors?.passportNumber?.message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-rose-600",
                children: String(errors.passportNumber.message)
            }, void 0, false, {
                fileName: "[project]/components/inputs/PassportInput.tsx",
                lineNumber: 67,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/PassportInput.tsx",
        lineNumber: 33,
        columnNumber: 5
    }, this);
}
}),
"[project]/lib/languages.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "allLanguages",
    ()=>allLanguages,
    "isLanguage",
    ()=>isLanguage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$iso$2d$639$2d$1$40$3$2e$1$2e$5$2f$node_modules$2f$iso$2d$639$2d$1$2f$src$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/iso-639-1@3.1.5/node_modules/iso-639-1/src/index.js [app-ssr] (ecmascript)");
;
function allLanguages() {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$iso$2d$639$2d$1$40$3$2e$1$2e$5$2f$node_modules$2f$iso$2d$639$2d$1$2f$src$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getAllCodes().map((code)=>({
            code,
            name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$iso$2d$639$2d$1$40$3$2e$1$2e$5$2f$node_modules$2f$iso$2d$639$2d$1$2f$src$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getName(code)
        })).filter((l)=>Boolean(l.name)).sort((a, b)=>a.name.localeCompare(b.name));
}
function isLanguage(code) {
    return Boolean(code && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$iso$2d$639$2d$1$40$3$2e$1$2e$5$2f$node_modules$2f$iso$2d$639$2d$1$2f$src$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].validate(code));
}
}),
"[project]/components/inputs/LanguageMulti.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LanguageMulti
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$languages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/languages.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
function LanguageMulti({ value, onChange }) {
    const LANGS = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$languages$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["allLanguages"])(), []);
    const [q, setQ] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [level, setLevel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("Conversational");
    const filtered = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const s = q.trim().toLowerCase();
        if (!s) return LANGS.slice(0, 100);
        return LANGS.filter((l)=>l.name.toLowerCase().includes(s) || l.code.toLowerCase().includes(s)).slice(0, 100);
    }, [
        q,
        LANGS
    ]);
    function add(code) {
        if (!code) return;
        if (value.some((v)=>v.lang === code)) return;
        onChange([
            ...value,
            {
                lang: code,
                level
            }
        ]);
        setQ("");
    }
    function setItemLevel(code, lvl) {
        onChange(value.map((v)=>v.lang === code ? {
                ...v,
                level: lvl
            } : v));
    }
    function remove(code) {
        onChange(value.filter((v)=>v.lang !== code));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-2 sm:grid-cols-[1fr_14rem]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        value: q,
                        onChange: (e)=>setQ(e.target.value),
                        className: "rounded border border-slate-300 p-2",
                        placeholder: "Type to search language…"
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/LanguageMulti.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: level,
                                onChange: (e)=>setLevel(e.target.value),
                                className: "rounded border border-slate-300 p-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: "Basic"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/LanguageMulti.tsx",
                                        lineNumber: 48,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: "Conversational"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/LanguageMulti.tsx",
                                        lineNumber: 49,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: "Fluent"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/LanguageMulti.tsx",
                                        lineNumber: 50,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: "Native"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/LanguageMulti.tsx",
                                        lineNumber: 51,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/inputs/LanguageMulti.tsx",
                                lineNumber: 47,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "rounded bg-slate-900 px-3 py-2 text-white hover:bg-slate-800",
                                onClick: ()=>add(q.toLowerCase().length === 2 ? q.toLowerCase() : filtered[0]?.code ?? ""),
                                children: "Add"
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/LanguageMulti.tsx",
                                lineNumber: 53,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/inputs/LanguageMulti.tsx",
                        lineNumber: 46,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/LanguageMulti.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap gap-2",
                children: [
                    value.map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-medium",
                                    children: v.lang.toUpperCase()
                                }, void 0, false, {
                                    fileName: "[project]/components/inputs/LanguageMulti.tsx",
                                    lineNumber: 65,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    value: v.level,
                                    onChange: (e)=>setItemLevel(v.lang, e.target.value),
                                    className: "text-xs",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            children: "Basic"
                                        }, void 0, false, {
                                            fileName: "[project]/components/inputs/LanguageMulti.tsx",
                                            lineNumber: 67,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            children: "Conversational"
                                        }, void 0, false, {
                                            fileName: "[project]/components/inputs/LanguageMulti.tsx",
                                            lineNumber: 68,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            children: "Fluent"
                                        }, void 0, false, {
                                            fileName: "[project]/components/inputs/LanguageMulti.tsx",
                                            lineNumber: 69,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            children: "Native"
                                        }, void 0, false, {
                                            fileName: "[project]/components/inputs/LanguageMulti.tsx",
                                            lineNumber: 70,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/inputs/LanguageMulti.tsx",
                                    lineNumber: 66,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>remove(v.lang),
                                    className: "text-xs text-slate-600 hover:underline",
                                    children: "Remove"
                                }, void 0, false, {
                                    fileName: "[project]/components/inputs/LanguageMulti.tsx",
                                    lineNumber: 72,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, v.lang, true, {
                            fileName: "[project]/components/inputs/LanguageMulti.tsx",
                            lineNumber: 64,
                            columnNumber: 11
                        }, this)),
                    value.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-slate-500",
                        children: "No additional languages added."
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/LanguageMulti.tsx",
                        lineNumber: 77,
                        columnNumber: 32
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/LanguageMulti.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/LanguageMulti.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/driver/register/page.tsx [app-ssr] (ecmascript)", (() => {{

throw new Error("An error occurred while generating the chunk item [project]/app/driver/register/page.tsx [app-ssr] (ecmascript)\n\nCaused by:\n- CJS module can't be async.\n\nDebug info:\n- An error occurred while generating the chunk item [project]/app/driver/register/page.tsx [app-ssr] (ecmascript)\n- Execution of *EcmascriptChunkItemContent::module_factory failed\n- Execution of <ModuleChunkItem as EcmascriptChunkItem>::content_with_async_module_info failed\n- Execution of EcmascriptChunkItemContent::new failed\n- CJS module can't be async.");

}}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e37b0d6e._.js.map