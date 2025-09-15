(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/license-rules.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
            return s.length > 6 ? "".concat(s.slice(0, 6), "-").concat(s.slice(6)) : s;
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
    var _caRules_jurisdiction;
    const rule = (_caRules_jurisdiction = caRules[jurisdiction]) !== null && _caRules_jurisdiction !== void 0 ? _caRules_jurisdiction : fallback;
    return rule.format(input);
}
function isValidLicence(jurisdiction, input) {
    const fallback = caRules["CA-DEFAULT"];
    var _caRules_jurisdiction;
    const rule = (_caRules_jurisdiction = caRules[jurisdiction]) !== null && _caRules_jurisdiction !== void 0 ? _caRules_jurisdiction : fallback;
    return rule.test(stripSep(input.toUpperCase()));
}
function normalizedLicence(input) {
    return stripSep(input.toUpperCase());
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/postal.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
    const norm = "".concat(s.slice(0, 3), " ").concat(s.slice(3));
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
    var _PROV_first;
    const province = (_PROV_first = PROV[first]) !== null && _PROV_first !== void 0 ? _PROV_first : undefined;
    return {
        ok: true,
        normalized: norm,
        province
    };
}
function isUSZip(raw) {
    return /^\d{5}(-\d{4})?$/.test(raw.trim());
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/phone-format.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatPhoneForDisplay",
    ()=>formatPhoneForDisplay,
    "toE164",
    ()=>toE164
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$libphonenumber$2d$js$40$1$2e$12$2e$17$2f$node_modules$2f$libphonenumber$2d$js$2f$min$2f$exports$2f$AsYouType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/libphonenumber-js@1.12.17/node_modules/libphonenumber-js/min/exports/AsYouType.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$libphonenumber$2d$js$40$1$2e$12$2e$17$2f$node_modules$2f$libphonenumber$2d$js$2f$min$2f$exports$2f$parsePhoneNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__parsePhoneNumber__as__parsePhoneNumberFromString$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/libphonenumber-js@1.12.17/node_modules/libphonenumber-js/min/exports/parsePhoneNumber.js [app-client] (ecmascript) <export parsePhoneNumber as parsePhoneNumberFromString>");
;
function formatPhoneForDisplay(input, defaultCountry) {
    const ayt = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$libphonenumber$2d$js$40$1$2e$12$2e$17$2f$node_modules$2f$libphonenumber$2d$js$2f$min$2f$exports$2f$AsYouType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AsYouType"](defaultCountry);
    return ayt.input(input);
}
function toE164(input, defaultCountry) {
    const p = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$libphonenumber$2d$js$40$1$2e$12$2e$17$2f$node_modules$2f$libphonenumber$2d$js$2f$min$2f$exports$2f$parsePhoneNumber$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__parsePhoneNumber__as__parsePhoneNumberFromString$3e$__["parsePhoneNumberFromString"])(input, defaultCountry);
    return (p === null || p === void 0 ? void 0 : p.isValid()) ? p.number : null; // E.164 or null
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/license-classes.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
    var _CA_CLASSES_jurisdiction;
    return (_CA_CLASSES_jurisdiction = CA_CLASSES[jurisdiction]) !== null && _CA_CLASSES_jurisdiction !== void 0 ? _CA_CLASSES_jurisdiction : [];
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/passport/patterns.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/countries.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "allCountries",
    ()=>allCountries,
    "isCountry",
    ()=>isCountry
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$i18n$2d$iso$2d$countries$40$7$2e$14$2e$0$2f$node_modules$2f$i18n$2d$iso$2d$countries$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/i18n-iso-countries@7.14.0/node_modules/i18n-iso-countries/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$i18n$2d$iso$2d$countries$40$7$2e$14$2e$0$2f$node_modules$2f$i18n$2d$iso$2d$countries$2f$langs$2f$en$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/i18n-iso-countries@7.14.0/node_modules/i18n-iso-countries/langs/en.json (json)");
;
;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$i18n$2d$iso$2d$countries$40$7$2e$14$2e$0$2f$node_modules$2f$i18n$2d$iso$2d$countries$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].registerLocale(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$i18n$2d$iso$2d$countries$40$7$2e$14$2e$0$2f$node_modules$2f$i18n$2d$iso$2d$countries$2f$langs$2f$en$2e$json__$28$json$29$__["default"]);
function allCountries() {
    const names = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$i18n$2d$iso$2d$countries$40$7$2e$14$2e$0$2f$node_modules$2f$i18n$2d$iso$2d$countries$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].getNames("en", {
        select: "official"
    });
    return Object.entries(names).map((param)=>{
        let [code, name] = param;
        return {
            code,
            name
        };
    }).sort((a, b)=>a.name.localeCompare(b.name));
}
function isCountry(code) {
    if (!code) return false;
    try {
        return Boolean(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$i18n$2d$iso$2d$countries$40$7$2e$14$2e$0$2f$node_modules$2f$i18n$2d$iso$2d$countries$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].alpha2ToNumeric(code.toUpperCase()));
    } catch (e) {
        return false;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/passport/validate.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isValidPassport",
    ()=>isValidPassport,
    "normalizePassport",
    ()=>normalizePassport,
    "passportPatternFor",
    ()=>passportPatternFor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$patterns$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/passport/patterns.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/countries.ts [app-client] (ecmascript)");
;
;
function passportPatternFor(country) {
    const code = (country || "").toUpperCase();
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCountry"])(code)) return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$patterns$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FALLBACK"];
    var _PASSPORT_code;
    return (_PASSPORT_code = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$patterns$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PASSPORT"][code]) !== null && _PASSPORT_code !== void 0 ? _PASSPORT_code : __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$patterns$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FALLBACK"];
}
function isValidPassport(country, value) {
    const pat = passportPatternFor(country);
    return pat.re.test((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$patterns$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["canon"])(value));
}
function normalizePassport(value) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$patterns$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["canon"])(value);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/register-schemas.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RegisterSchema",
    ()=>RegisterSchema,
    "normalizeForStorage",
    ()=>normalizeForStorage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/zod@4.1.8/node_modules/zod/v4/classic/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$rules$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/license-rules.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/postal.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$phone$2d$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/phone-format.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$classes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/license-classes.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/passport/validate.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/countries.ts [app-client] (ecmascript)");
;
;
;
;
;
;
;
const dateISO = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().refine((v)=>/^\d{4}-\d{2}-\d{2}$/.test(v), "Use YYYY-MM-DD");
const RegisterSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    // Names (required)
    givenName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Enter given name").max(60),
    surname: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Enter surname").max(60),
    middleName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    givenNameKey: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    surnameKey: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Jurisdiction & licence (required)
    jurisdiction: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
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
    licenseNo: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "Enter licence number"),
    licenseClass: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, "Enter class").max(5),
    airBrake: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    licenseExpiry: dateISO,
    dob: dateISO,
    gender: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "Male",
        "Female",
        "Non-binary",
        "Prefer not to say"
    ]).optional(),
    // Contact
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email(),
    phone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(7),
    phoneCountry: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "CA",
        "US"
    ]).default("CA"),
    // Address (postal required; others optional)
    address1: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    address2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    city: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    region: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    postal: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "Enter postal/ZIP"),
    country: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    // Status wizard
    citizenship: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "CA",
        "US",
        "Other"
    ]).default("CA"),
    residencyCA: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "Citizen",
        "PR",
        "Work Permit",
        "Study Permit",
        "Visitor"
    ]).default("Citizen"),
    prNumber: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    prExpiry: dateISO.optional(),
    permitType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    permitExpiry: dateISO.optional(),
    uci: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    passportCountry: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    passportNumber: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    passportExpiry: dateISO.optional(),
    englishLevel: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "Basic",
        "Conversational",
        "Fluent",
        "Native"
    ]),
    otherLanguages: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        lang: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2),
        level: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            "Basic",
            "Conversational",
            "Fluent",
            "Native"
        ])
    })).max(10).optional(),
    work: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        company: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        role: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        start: dateISO.optional(),
        end: dateISO.optional()
    })).max(10).optional(),
    consentAbstract: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().refine((v)=>v === true, {
        message: "Consent is required"
    }),
    consentName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, "Type your name to sign"),
    consentDate: dateISO,
    certifyAccurate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().refine((v)=>v === true, {
        message: "You must certify accuracy"
    }),
    // Documents
    docLicenseFront: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File).optional(),
    docLicenseBack: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File).optional(),
    docPassport: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File).optional(),
    docPR: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File).optional(),
    docPermit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$4$2e$1$2e$8$2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File).optional()
}).superRefine(_c = (v, ctx)=>{
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
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$rules$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidLicence"])(v.jurisdiction, v.licenseNo)) {
        ctx.addIssue({
            code: "custom",
            path: [
                "licenseNo"
            ],
            message: "Number doesn’t match jurisdiction format"
        });
    }
    // Licence class allowed for jurisdiction
    const allowed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$classes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["classesFor"])(v.jurisdiction);
    if (allowed.length > 0 && !allowed.includes(v.licenseClass)) {
        ctx.addIssue({
            code: "custom",
            path: [
                "licenseClass"
            ],
            message: "Select a valid class for ".concat(v.jurisdiction)
        });
    }
    // Phone → must parse to E.164
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$phone$2d$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toE164"])(v.phone, v.phoneCountry)) {
        ctx.addIssue({
            code: "custom",
            path: [
                "phone"
            ],
            message: "Enter a valid phone number"
        });
    }
    // Postal logic
    const ca = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["detectCA"])(v.postal);
    if (ca.ok) {
    // ok
    } else if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isUSZip"])(v.postal)) {
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
        if (v.passportCountry && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isCountry"])(v.passportCountry)) {
            ctx.addIssue({
                code: "custom",
                path: [
                    "passportCountry"
                ],
                message: "Select a valid country"
            });
        }
        if (v.passportCountry && v.passportNumber && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidPassport"])(v.passportCountry, v.passportNumber)) {
            const pat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["passportPatternFor"])(v.passportCountry);
            ctx.addIssue({
                code: "custom",
                path: [
                    "passportNumber"
                ],
                message: "Format doesn’t match (".concat(pat.hint, ")")
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
        var _v_prExpiry;
        var _v_prNumber;
        const pr = ((_v_prNumber = v.prNumber) !== null && _v_prNumber !== void 0 ? _v_prNumber : "").replace(/\D/g, "");
        if (pr.length !== 10) {
            ctx.addIssue({
                code: "custom",
                path: [
                    "prNumber"
                ],
                message: "PR card number must be exactly 10 digits"
            });
        }
        if (!((_v_prExpiry = v.prExpiry) === null || _v_prExpiry === void 0 ? void 0 : _v_prExpiry.trim())) ctx.addIssue({
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
        var _v_uci;
        const uci = ((_v_uci = v.uci) !== null && _v_uci !== void 0 ? _v_uci : "").replace(/\D/g, "");
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
            message: "".concat(label, " is required")
        });
    }
    if (need.licenseFront) req("docLicenseFront", v.docLicenseFront, "Licence (front)");
    if (need.licenseBack) req("docLicenseBack", v.docLicenseBack, "Licence (back)");
    if (need.pr) req("docPR", v.docPR, "PR card image");
    if (need.passport) req("docPassport", v.docPassport, "Passport image");
    if (need.permit) req("docPermit", v.docPermit, "Permit document image");
});
_c1 = RegisterSchema;
function normalizeForStorage(values) {
    var _values_passportNumber;
    return {
        ...values,
        licenseNo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$rules$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizedLicence"])(values.licenseNo),
        passportNumber: values.passportCountry ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizePassport"])((_values_passportNumber = values.passportNumber) !== null && _values_passportNumber !== void 0 ? _values_passportNumber : "") : undefined,
        prNumber: values.prNumber ? values.prNumber.replace(/\D/g, "") : undefined,
        uci: values.uci ? values.uci.replace(/\D/g, "") : undefined
    };
}
var _c, _c1;
__turbopack_context__.k.register(_c, 'RegisterSchema$z\n  .object({\n    // Names (required)\n    givenName: z.string().min(1, "Enter given name").max(60),\n    surname: z.string().min(1, "Enter surname").max(60),\n    middleName: z.string().optional(),\n    givenNameKey: z.string().optional(),\n    surnameKey: z.string().optional(),\n\n    // Jurisdiction & licence (required)\n    jurisdiction: z.enum(\n      ["CA-AB", "CA-BC", "CA-MB", "CA-NB", "CA-NL", "CA-NS", "CA-ON", "CA-PE", "CA-QC", "CA-SK"],\n      { message: "Select issuing authority" },\n    ),\n    licenseNo: z.string().min(3, "Enter licence number"),\n    licenseClass: z.string().min(1, "Enter class").max(5),\n    airBrake: z.boolean().optional(),\n\n    licenseExpiry: dateISO,\n    dob: dateISO,\n    gender: z.enum(["Male", "Female", "Non-binary", "Prefer not to say"]).optional(),\n\n    // Contact\n    email: z.string().email(),\n    phone: z.string().min(7),\n    phoneCountry: z.enum(["CA", "US"]).default("CA"),\n\n    // Address (postal required; others optional)\n    address1: z.string().optional(),\n    address2: z.string().optional(),\n    city: z.string().optional(),\n    region: z.string().optional(),\n    postal: z.string().min(3, "Enter postal/ZIP"),\n    country: z.string().optional(),\n\n    // Status wizard\n    citizenship: z.enum(["CA", "US", "Other"]).default("CA"),\n    residencyCA: z.enum(["Citizen", "PR", "Work Permit", "Study Permit", "Visitor"]).default("Citizen"),\n    prNumber: z.string().optional(),\n    prExpiry: dateISO.optional(),\n    permitType: z.string().optional(),\n    permitExpiry: dateISO.optional(),\n    uci: z.string().optional(),\n    passportCountry: z.string().optional(),\n    passportNumber: z.string().optional(),\n    passportExpiry: dateISO.optional(),\n\n    englishLevel: z.enum(["Basic", "Conversational", "Fluent", "Native"]),\n    otherLanguages: z\n      .array(\n        z.object({\n          lang: z.string().min(2),\n          level: z.enum(["Basic", "Conversational", "Fluent", "Native"]),\n        }),\n      )\n      .max(10)\n      .optional(),\n\n    work: z\n      .array(\n        z.object({\n          company: z.string().optional(),\n          role: z.string().optional(),\n          start: dateISO.optional(),\n          end: dateISO.optional(),\n        }),\n      )\n      .max(10)\n      .optional(),\n\n    consentAbstract: z.boolean().refine((v) => v === true, { message: "Consent is required" }),\n    consentName: z.string().min(2, "Type your name to sign"),\n    consentDate: dateISO,\n    certifyAccurate: z.boolean().refine((v) => v === true, { message: "You must certify accuracy" }),\n\n    // Documents\n    docLicenseFront: z.instanceof(File).optional(),\n    docLicenseBack: z.instanceof(File).optional(),\n    docPassport: z.instanceof(File).optional(),\n    docPR: z.instanceof(File).optional(),\n    docPermit: z.instanceof(File).optional(),\n  })\n  .superRefine');
__turbopack_context__.k.register(_c1, "RegisterSchema");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/driver/DocUploadField.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DocUploadField
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
const ACCEPT = [
    "image/jpeg",
    "image/png"
]; // JPG/PNG only
const MAX = 4 * 1024 * 1024; // 4 MB
function DocUploadField(param) {
    let { label, hint, value, onChange, id, required = false } = param;
    _s();
    const generatedId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"])();
    const inputId = id !== null && id !== void 0 ? id : generatedId;
    const [err, setErr] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    function handle(e) {
        var _e_target_files;
        const f = (_e_target_files = e.target.files) === null || _e_target_files === void 0 ? void 0 : _e_target_files[0];
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                htmlFor: inputId,
                className: "block text-sm font-medium text-slate-700",
                children: [
                    label,
                    " ",
                    required && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
            hint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-slate-500",
                children: hint
            }, void 0, false, {
                fileName: "[project]/components/driver/DocUploadField.tsx",
                lineNumber: 55,
                columnNumber: 16
            }, this),
            err && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-rose-600",
                "aria-live": "polite",
                children: err
            }, void 0, false, {
                fileName: "[project]/components/driver/DocUploadField.tsx",
                lineNumber: 57,
                columnNumber: 9
            }, this),
            value && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-3 rounded border border-slate-200 p-2 text-xs text-slate-600",
                children: [
                    value.name,
                    " • ",
                    (value.size / 1024 / 1024).toFixed(1),
                    " MB",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
_s(DocUploadField, "IOeeuo2fJgzWE3E1LJR172MuvZY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useId"]
    ];
});
_c = DocUploadField;
var _c;
__turbopack_context__.k.register(_c, "DocUploadField");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/pdf/DriverCardPDF.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* eslint-disable jsx-a11y/alt-text */ __turbopack_context__.s([
    "default",
    ()=>DriverCardPDF
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$renderer$40$4$2e$3$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f40$react$2d$pdf$2f$renderer$2f$lib$2f$react$2d$pdf$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-pdf+renderer@4.3.0_react@19.1.0/node_modules/@react-pdf/renderer/lib/react-pdf.browser.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$primitives$40$4$2e$1$2e$1$2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-pdf+primitives@4.1.1/node_modules/@react-pdf/primitives/lib/index.js [app-client] (ecmascript)");
"use client";
;
;
const styles = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$renderer$40$4$2e$3$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f40$react$2d$pdf$2f$renderer$2f$lib$2f$react$2d$pdf$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["StyleSheet"].create({
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
function DriverCardPDF(param) {
    let { name, qrPng } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$primitives$40$4$2e$1$2e$1$2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Document"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$primitives$40$4$2e$1$2e$1$2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Page"], {
            size: "A6",
            style: styles.page,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$primitives$40$4$2e$1$2e$1$2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                style: styles.card,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$primitives$40$4$2e$1$2e$1$2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                        style: styles.title,
                        children: "Driver Identity Card"
                    }, void 0, false, {
                        fileName: "[project]/components/pdf/DriverCardPDF.tsx",
                        lineNumber: 25,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$primitives$40$4$2e$1$2e$1$2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                        style: styles.row,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$primitives$40$4$2e$1$2e$1$2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["View"], {
                                style: styles.col,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$primitives$40$4$2e$1$2e$1$2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$primitives$40$4$2e$1$2e$1$2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$primitives$40$4$2e$1$2e$1$2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Image"], {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$primitives$40$4$2e$1$2e$1$2f$node_modules$2f40$react$2d$pdf$2f$primitives$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Text"], {
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
_c = DriverCardPDF;
var _c;
__turbopack_context__.k.register(_c, "DriverCardPDF");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/qr.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildQrPayload",
    ()=>buildQrPayload,
    "makeQrPng",
    ()=>makeQrPng
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$qrcode$40$1$2e$5$2e$4$2f$node_modules$2f$qrcode$2f$lib$2f$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/qrcode@1.5.4/node_modules/qrcode/lib/browser.js [app-client] (ecmascript)");
;
function buildQrPayload(input) {
    var _input_origin;
    const origin = (_input_origin = input.origin) !== null && _input_origin !== void 0 ? _input_origin : ("TURBOPACK compile-time truthy", 1) ? window.location.origin : "TURBOPACK unreachable";
    return {
        v: 1,
        url: "".concat(origin, "/v/").concat(input.qrid)
    };
}
async function makeQrPng(payload) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$qrcode$40$1$2e$5$2e$4$2f$node_modules$2f$qrcode$2f$lib$2f$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].toDataURL(JSON.stringify(payload), {
        errorCorrectionLevel: "M",
        margin: 1,
        scale: 6
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/demo-store-remote.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
        var _getErrorMessage;
        const msg = (_getErrorMessage = getErrorMessage(j)) !== null && _getErrorMessage !== void 0 ? _getErrorMessage : "Failed to save snapshot (".concat(res.status, ")");
        throw new Error(msg);
    }
}
async function loadSnapshotRemote(qrid) {
    const res = await fetch("/api/demo/snapshots/".concat(encodeURIComponent(qrid)), {
        method: "GET",
        cache: "no-store"
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Fetch failed (".concat(res.status, ")"));
    return await res.json();
}
function getErrorMessage(x) {
    if (!x || typeof x !== "object") return null;
    const rec = x;
    const e = rec["error"];
    return typeof e === "string" ? e : null;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/uuid.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
            var _bytes_;
            // Per RFC4122 section 4.4
            const b6 = (_bytes_ = bytes[6]) !== null && _bytes_ !== void 0 ? _bytes_ : 0;
            bytes[6] = b6 & 0x0f | 0x40; // version 4
            var _bytes_1;
            const b8 = (_bytes_1 = bytes[8]) !== null && _bytes_1 !== void 0 ? _bytes_1 : 0;
            bytes[8] = b8 & 0x3f | 0x80; // variant 10
            const hex = Array.from(bytes, (b)=>b.toString(16).padStart(2, "0")).join("");
            return "".concat(hex.slice(0, 8), "-").concat(hex.slice(8, 12), "-").concat(hex.slice(12, 16), "-").concat(hex.slice(16, 20), "-").concat(hex.slice(20));
        }
    }
    // Last-resort (not cryptographically strong)
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c)=>{
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : r & 0x3 | 0x8;
        return v.toString(16);
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/names.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "canonicalKey",
    ()=>canonicalKey,
    "titleCaseName",
    ()=>titleCaseName
]);
function titleCaseName(s) {
    return s.trim().toLowerCase().replace(RegExp("\\b[\\p{L}\\p{M}]+", "gu"), (w)=>{
        var _w_;
        var _w__toUpperCase;
        return ((_w__toUpperCase = (_w_ = w[0]) === null || _w_ === void 0 ? void 0 : _w_.toUpperCase()) !== null && _w__toUpperCase !== void 0 ? _w__toUpperCase : "") + w.slice(1);
    });
}
function canonicalKey(s) {
    // Uppercase, strip diacritics, collapse spaces
    return s.normalize("NFD").replace(RegExp("\\p{Diacritic}", "gu"), "").toUpperCase().replace(/\s+/g, " ").trim();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/inputs/NameFields.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NameFields
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$names$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/names.ts [app-client] (ecmascript)");
"use client";
;
;
function NameFields(param) {
    let { register, setValue, errors } = param;
    var _errors_givenName, _errors_middleName, _errors_surname;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid gap-4 sm:grid-cols-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                label: "Given name",
                err: (_errors_givenName = errors.givenName) === null || _errors_givenName === void 0 ? void 0 : _errors_givenName.message,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    ...register("givenName"),
                    className: "mt-1 w-full rounded border border-slate-300 p-2",
                    onBlur: (e)=>{
                        const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$names$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["titleCaseName"])(e.target.value);
                        setValue("givenName", t, {
                            shouldValidate: true
                        });
                        setValue("givenNameKey", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$names$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["canonicalKey"])(t));
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                label: "Middle (optional)",
                err: (_errors_middleName = errors.middleName) === null || _errors_middleName === void 0 ? void 0 : _errors_middleName.message,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    ...register("middleName"),
                    className: "mt-1 w-full rounded border border-slate-300 p-2",
                    onBlur: (e)=>{
                        const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$names$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["titleCaseName"])(e.target.value);
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                label: "Surname",
                err: (_errors_surname = errors.surname) === null || _errors_surname === void 0 ? void 0 : _errors_surname.message,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    ...register("surname"),
                    className: "mt-1 w-full rounded border border-slate-300 p-2",
                    onBlur: (e)=>{
                        const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$names$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["titleCaseName"])(e.target.value);
                        setValue("surname", t, {
                            shouldValidate: true
                        });
                        setValue("surnameKey", (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$names$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["canonicalKey"])(t));
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
_c = NameFields;
function Field(param) {
    let { label, err, children } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "block",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "block text-sm text-slate-700",
                children: label
            }, void 0, false, {
                fileName: "[project]/components/inputs/NameFields.tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            children,
            err && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
_c1 = Field;
var _c, _c1;
__turbopack_context__.k.register(_c, "NameFields");
__turbopack_context__.k.register(_c1, "Field");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/inputs/PhoneInput.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PhoneInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function PhoneInput(param) {
    let { register, setValue, watch, errors } = param;
    var _errors_phone;
    _s();
    const [display, setDisplay] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const phoneCountry = watch("phoneCountry");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid gap-3 sm:grid-cols-[8rem_1fr]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "block",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "block text-sm text-slate-700",
                        children: "Country"
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/PhoneInput.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        ...register("phoneCountry"),
                        defaultValue: "CA",
                        className: "mt-1 w-full rounded border border-slate-300 p-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                            value: "CA",
                            children: "Canada (+1)"
                        }, void 0, false, {
                            fileName: "[project]/components/inputs/PhoneInput.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/PhoneInput.tsx",
                        lineNumber: 30,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/PhoneInput.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "block",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "block text-sm text-slate-700",
                        children: "Phone"
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/PhoneInput.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        ...register("phone"),
                        value: display,
                        onChange: (e)=>{
                            // Keep only digits
                            const digits = e.target.value.replace(/\D/g, "");
                            // Max length: 10 digits for Canadian numbers
                            const truncated = digits.slice(0, 10);
                            setDisplay(truncated);
                            setValue("phone", truncated, {
                                shouldValidate: true
                            });
                        },
                        inputMode: "numeric",
                        pattern: "\\d{10}",
                        className: "mt-1 w-full rounded border border-slate-300 p-2",
                        placeholder: "2045551234"
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/PhoneInput.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this),
                    ((_errors_phone = errors.phone) === null || _errors_phone === void 0 ? void 0 : _errors_phone.message) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-rose-600",
                        children: errors.phone.message
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/PhoneInput.tsx",
                        lineNumber: 59,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/PhoneInput.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/PhoneInput.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, this);
}
_s(PhoneInput, "3ayO6qsu05Ea/idyt2/wbUh1H3s=");
_c = PhoneInput;
var _c;
__turbopack_context__.k.register(_c, "PhoneInput");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/inputs/PostalInput.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PostalInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/postal.ts [app-client] (ecmascript)");
"use client";
;
;
function PostalInput(param) {
    let { register, setValue, errors } = param;
    var _errors_postal;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "block",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "block text-sm text-slate-700",
                children: "Postal/ZIP"
            }, void 0, false, {
                fileName: "[project]/components/inputs/PostalInput.tsx",
                lineNumber: 17,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                        t.value = s.length > 3 ? "".concat(s.slice(0, 3), " ").concat(s.slice(3)) : s;
                    }
                },
                onBlur: (e)=>{
                    const raw = e.target.value;
                    const ca = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["detectCA"])(raw);
                    if (ca.ok) {
                        if (ca.normalized) setValue("postal", ca.normalized);
                        setValue("country", "CA");
                        if (ca.province) setValue("region", ca.province);
                        return;
                    }
                    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$postal$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isUSZip"])(raw)) {
                        setValue("country", "US");
                    }
                }
            }, void 0, false, {
                fileName: "[project]/components/inputs/PostalInput.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            ((_errors_postal = errors.postal) === null || _errors_postal === void 0 ? void 0 : _errors_postal.message) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
_c = PostalInput;
var _c;
__turbopack_context__.k.register(_c, "PostalInput");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/inputs/LicenceInput.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LicenceInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$rules$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/license-rules.ts [app-client] (ecmascript)");
"use client";
;
;
function LicenceInput(param) {
    let { register, setValue, watch, errors } = param;
    var _errors_licenseNo;
    const jurisdiction = watch("jurisdiction");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "block",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "block text-sm text-slate-700",
                children: "Licence number"
            }, void 0, false, {
                fileName: "[project]/components/inputs/LicenceInput.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                ...register("licenseNo"),
                className: "mt-1 w-full rounded border border-slate-300 p-2 font-mono",
                placeholder: maskHint(jurisdiction),
                onInput: (e)=>{
                    const t = e.target;
                    const newVal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$rules$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatLicence"])(jurisdiction, t.value);
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
            ((_errors_licenseNo = errors.licenseNo) === null || _errors_licenseNo === void 0 ? void 0 : _errors_licenseNo.message) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-rose-600",
                children: errors.licenseNo.message
            }, void 0, false, {
                fileName: "[project]/components/inputs/LicenceInput.tsx",
                lineNumber: 32,
                columnNumber: 37
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
_c = LicenceInput;
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
var _c;
__turbopack_context__.k.register(_c, "LicenceInput");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/inputs/StatusWizard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StatusWizard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function StatusWizard(param) {
    let { register, watch, setValue, errors } = param;
    var _errors_citizenship, _errors_residencyCA, _errors_permitType;
    var _watch;
    const citizenship = (_watch = watch("citizenship")) !== null && _watch !== void 0 ? _watch : "CA";
    var _watch1;
    const residency = (_watch1 = watch("residencyCA")) !== null && _watch1 !== void 0 ? _watch1 : "Citizen";
    const showPermitType = residency === "Work Permit"; // hidden for Study Permit
    // Reset dependent fields on category changes to avoid stale values
    function onCitizenshipChange(e) {
        const val = e.target.value;
        setValue("citizenship", val, {
            shouldValidate: true
        });
        if (val === "CA") {
            setValue("passportCountry", undefined, {
                shouldValidate: true
            });
            setValue("passportNumber", undefined, {
                shouldValidate: true
            });
            setValue("docPassport", undefined, {
                shouldValidate: true
            });
        }
    }
    function onResidencyChange(e) {
        const val = e.target.value;
        setValue("residencyCA", val, {
            shouldValidate: true
        });
        // Clear PR/Permit-specific fields when switching
        if (val !== "PR") setValue("prNumber", undefined, {
            shouldValidate: true
        });
        if (val !== "Work Permit" && val !== "Study Permit") {
            setValue("permitType", undefined, {
                shouldValidate: true
            });
            setValue("docPermit", undefined, {
                shouldValidate: true
            });
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "space-y-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: "text-lg font-medium",
                children: "Status in Canada"
            }, void 0, false, {
                fileName: "[project]/components/inputs/StatusWizard.tsx",
                lineNumber: 51,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-4 sm:grid-cols-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "block",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "block text-sm text-slate-700",
                                children: "Citizenship"
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/StatusWizard.tsx",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                ...register("citizenship"),
                                defaultValue: citizenship,
                                onChange: onCitizenshipChange,
                                className: "mt-1 w-full rounded border border-slate-300 p-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "CA",
                                        children: "Canada"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                                        lineNumber: 62,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Other",
                                        children: "Other"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                                        lineNumber: 64,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/inputs/StatusWizard.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this),
                            ((_errors_citizenship = errors.citizenship) === null || _errors_citizenship === void 0 ? void 0 : _errors_citizenship.message) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-rose-600",
                                children: String(errors.citizenship.message)
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/StatusWizard.tsx",
                                lineNumber: 67,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "block",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "block text-sm text-slate-700",
                                children: "Residency"
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/StatusWizard.tsx",
                                lineNumber: 73,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                ...register("residencyCA"),
                                defaultValue: residency,
                                onChange: onResidencyChange,
                                className: "mt-1 w-full rounded border border-slate-300 p-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Citizen",
                                        children: "Citizen"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                                        lineNumber: 80,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "PR",
                                        children: "Permanent Resident"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                                        lineNumber: 81,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Work Permit",
                                        children: "Work Permit"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                                        lineNumber: 82,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Study Permit",
                                        children: "Study Permit"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                                        lineNumber: 83,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/inputs/StatusWizard.tsx",
                                lineNumber: 74,
                                columnNumber: 11
                            }, this),
                            ((_errors_residencyCA = errors.residencyCA) === null || _errors_residencyCA === void 0 ? void 0 : _errors_residencyCA.message) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-rose-600",
                                children: String(errors.residencyCA.message)
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/StatusWizard.tsx",
                                lineNumber: 87,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                        lineNumber: 72,
                        columnNumber: 9
                    }, this),
                    showPermitType ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "block",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "block text-sm text-slate-700",
                                children: "Permit type"
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/StatusWizard.tsx",
                                lineNumber: 94,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                ...register("permitType"),
                                className: "mt-1 w-full rounded border border-slate-300 p-2",
                                defaultValue: "",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        disabled: true,
                                        children: "Select type"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                                        lineNumber: 100,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Closed (employer-specific)",
                                        children: "Closed (employer-specific)"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                                        lineNumber: 103,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Open work permit",
                                        children: "Open work permit"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                                        lineNumber: 104,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "PGWP",
                                        children: "Post-Graduation Work Permit (PGWP)"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                                        lineNumber: 105,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "IEC",
                                        children: "IEC (Working Holiday, YP, Co-op)"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                                        lineNumber: 106,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Other",
                                        children: "Other"
                                    }, void 0, false, {
                                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                                        lineNumber: 107,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/inputs/StatusWizard.tsx",
                                lineNumber: 95,
                                columnNumber: 13
                            }, this),
                            ((_errors_permitType = errors.permitType) === null || _errors_permitType === void 0 ? void 0 : _errors_permitType.message) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-rose-600",
                                children: String(errors.permitType.message)
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/StatusWizard.tsx",
                                lineNumber: 110,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                        lineNumber: 93,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {}, void 0, false, {
                        fileName: "[project]/components/inputs/StatusWizard.tsx",
                        lineNumber: 114,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/StatusWizard.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/StatusWizard.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
_c = StatusWizard;
var _c;
__turbopack_context__.k.register(_c, "StatusWizard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/inputs/LicenseClassSelect.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LicenseClassSelect
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$classes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/license-classes.ts [app-client] (ecmascript)");
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
function LicenseClassSelect(param) {
    let { register, setValue, watch, errors } = param;
    var _errors_licenseClass;
    const jurisdiction = watch("jurisdiction");
    const allowed = jurisdiction ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$license$2d$classes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["classesFor"])(jurisdiction) : [];
    var _AIR_BRAKE_LABEL_;
    const label = (_AIR_BRAKE_LABEL_ = AIR_BRAKE_LABEL[jurisdiction !== null && jurisdiction !== void 0 ? jurisdiction : ""]) !== null && _AIR_BRAKE_LABEL_ !== void 0 ? _AIR_BRAKE_LABEL_ : "Air brake";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid gap-4 sm:grid-cols-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "block",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "block text-sm text-slate-700",
                        children: "Licence class"
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        ...register("licenseClass"),
                        disabled: !jurisdiction,
                        onChange: (e)=>setValue("licenseClass", e.target.value),
                        className: "mt-1 w-full rounded border border-slate-300 p-2",
                        children: [
                            !jurisdiction && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "Select jurisdiction first"
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                                lineNumber: 44,
                                columnNumber: 29
                            }, this),
                            jurisdiction && allowed.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "No classes found"
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                                lineNumber: 45,
                                columnNumber: 52
                            }, this),
                            allowed.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
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
                    (errors === null || errors === void 0 ? void 0 : (_errors_licenseClass = errors.licenseClass) === null || _errors_licenseClass === void 0 ? void 0 : _errors_licenseClass.message) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "mt-6 inline-flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "checkbox",
                        ...register("airBrake"),
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/LicenseClassSelect.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_c = LicenseClassSelect;
var _c;
__turbopack_context__.k.register(_c, "LicenseClassSelect");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/inputs/CountrySelect.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CountrySelect
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/countries.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const COUNTRIES = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$countries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allCountries"])();
function CountrySelect(param) {
    let { name, label = "Country", register, setValue, errors, defaultCode } = param;
    _s();
    const [q, setQ] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const filtered = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "CountrySelect.useMemo[filtered]": ()=>{
            const s = q.trim().toLowerCase();
            if (!s) return COUNTRIES;
            return COUNTRIES.filter({
                "CountrySelect.useMemo[filtered]": (c)=>c.name.toLowerCase().includes(s) || c.code.toLowerCase().includes(s)
            }["CountrySelect.useMemo[filtered]"]);
        }
    }["CountrySelect.useMemo[filtered]"], [
        q
    ]);
    function errorOf() {
        var _this;
        const e = errors === null || errors === void 0 ? void 0 : errors[name];
        const msg = (_this = e) === null || _this === void 0 ? void 0 : _this.message;
        return typeof msg === "string" ? msg : undefined;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "block",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-2 sm:grid-cols-[1fr_18rem]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        value: q,
                        onChange: (e)=>setQ(e.target.value),
                        className: "rounded border border-slate-300 p-2",
                        placeholder: "Search country…"
                    }, void 0, false, {
                        fileName: "[project]/components/inputs/CountrySelect.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        ...register(name),
                        defaultValue: defaultCode !== null && defaultCode !== void 0 ? defaultCode : "",
                        onChange: (e)=>setValue(name, e.target.value, {
                                shouldValidate: true,
                                shouldDirty: true
                            }),
                        className: "rounded border border-slate-300 p-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                disabled: true,
                                children: "Select country"
                            }, void 0, false, {
                                fileName: "[project]/components/inputs/CountrySelect.tsx",
                                lineNumber: 50,
                                columnNumber: 11
                            }, this),
                            filtered.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
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
            errorOf() && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
_s(CountrySelect, "fyPxdXG/aeA/WY52X2qyAfQo02Q=");
_c = CountrySelect;
var _c;
__turbopack_context__.k.register(_c, "CountrySelect");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/inputs/PassportInput.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PassportInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/passport/validate.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function PassportInput(param) {
    let { countryCode, register, setValue, errors } = param;
    var _errors_passportNumber;
    _s();
    const [v, setV] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const pat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "PassportInput.useMemo[pat]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["passportPatternFor"])(countryCode)
    }["PassportInput.useMemo[pat]"], [
        countryCode
    ]);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // When country changes, clip to max length and re-validate
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PassportInput.useEffect": ()=>{
            if (!inputRef.current) return;
            if (pat.maxLen && v.length > pat.maxLen) {
                const clipped = v.slice(0, pat.maxLen);
                setV(clipped);
                setValue("passportNumber", clipped, {
                    shouldValidate: true
                });
            } else {
                // trigger validation when country changes even if length is ok
                setValue("passportNumber", v, {
                    shouldValidate: true
                });
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["PassportInput.useEffect"], [
        countryCode
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "block",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "block text-sm text-slate-700",
                    children: "Passport number"
                }, void 0, false, {
                    fileName: "[project]/components/inputs/PassportInput.tsx",
                    lineNumber: 40,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/inputs/PassportInput.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                    // Uppercase A–Z, digits only; hard limit by country pattern
                    let s = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                    if (pat.maxLen) s = s.slice(0, pat.maxLen);
                    setV(s);
                    setValue("passportNumber", s, {
                        shouldValidate: true
                    });
                },
                onBlur: (e)=>{
                    const canon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$passport$2f$validate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizePassport"])(e.target.value);
                    setV(canon);
                    setValue("passportNumber", canon, {
                        shouldValidate: true
                    });
                },
                inputMode: "text",
                autoCapitalize: "characters",
                className: "mt-1 w-full rounded border border-slate-300 p-2 font-mono tracking-wider",
                placeholder: pat.hint || "e.g., K1234567",
                "aria-describedby": "passport-hint"
            }, void 0, false, {
                fileName: "[project]/components/inputs/PassportInput.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                id: "passport-hint",
                className: "text-xs text-slate-500",
                children: [
                    countryCode ? "Expected format for ".concat(countryCode.toUpperCase(), ": ") : "Expected format: ",
                    pat.hint || "6–10 letters/digits"
                ]
            }, void 0, true, {
                fileName: "[project]/components/inputs/PassportInput.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, this),
            (errors === null || errors === void 0 ? void 0 : (_errors_passportNumber = errors.passportNumber) === null || _errors_passportNumber === void 0 ? void 0 : _errors_passportNumber.message) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-rose-600",
                children: String(errors.passportNumber.message)
            }, void 0, false, {
                fileName: "[project]/components/inputs/PassportInput.tsx",
                lineNumber: 77,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/inputs/PassportInput.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_s(PassportInput, "Osssn95UfjOfjAcpTUlnSz+nAzo=");
_c = PassportInput;
var _c;
__turbopack_context__.k.register(_c, "PassportInput");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/driver/register/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RegisterPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$hook$2d$form$40$7$2e$62$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-hook-form@7.62.0_react@19.1.0/node_modules/react-hook-form/dist/index.esm.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$hookform$2b$resolvers$40$5$2e$2$2e$1_react$2d$hook$2d$form$40$7$2e$62$2e$0_react$40$19$2e$1$2e$0_$2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@hookform+resolvers@5.2.1_react-hook-form@7.62.0_react@19.1.0_/node_modules/@hookform/resolvers/zod/dist/zod.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$register$2d$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/register-schemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$driver$2f$DocUploadField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/driver/DocUploadField.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$pdf$2f$DriverCardPDF$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/pdf/DriverCardPDF.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$qr$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/qr.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$renderer$40$4$2e$3$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f40$react$2d$pdf$2f$renderer$2f$lib$2f$react$2d$pdf$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@react-pdf+renderer@4.3.0_react@19.1.0/node_modules/@react-pdf/renderer/lib/react-pdf.browser.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.5.3_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$demo$2d$store$2d$remote$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/demo-store-remote.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$uuid$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/uuid.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$NameFields$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/inputs/NameFields.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$PhoneInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/inputs/PhoneInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$PostalInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/inputs/PostalInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$LicenceInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/inputs/LicenceInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$StatusWizard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/inputs/StatusWizard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$LicenseClassSelect$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/inputs/LicenseClassSelect.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$CountrySelect$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/inputs/CountrySelect.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$PassportInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/inputs/PassportInput.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
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
;
;
;
;
;
;
;
function RegisterPage() {
    var _errors_jurisdiction, _errors_licenseExpiry, _errors_dob, _errors_email, _errors_prNumber, _errors_englishLevel, _errors_consentName, _errors_consentDate, _errors_consentAbstract, _errors_certifyAccurate;
    _s();
    const { register, handleSubmit, control, formState: { errors }, watch, setValue } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$hook$2d$form$40$7$2e$62$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useForm"])({
        resolver: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$hookform$2b$resolvers$40$5$2e$2$2e$1_react$2d$hook$2d$form$40$7$2e$62$2e$0_react$40$19$2e$1$2e$0_$2f$node_modules$2f40$hookform$2f$resolvers$2f$zod$2f$dist$2f$zod$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["zodResolver"])(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$register$2d$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RegisterSchema"]),
        defaultValues: {
            englishLevel: undefined,
            phoneCountry: "CA",
            citizenship: "CA",
            residencyCA: "Citizen",
            consentDate: new Date().toISOString().slice(0, 10),
            certifyAccurate: false,
            otherLanguages: []
        }
    });
    const { fields: work, append: addWork, remove: removeWork } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$hook$2d$form$40$7$2e$62$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useFieldArray"])({
        control,
        name: "work"
    });
    const [submitting, setSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [qrPng, setQrPng] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [pdfUrl, setPdfUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [qrid, setQrid] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [submitError, setSubmitError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [errorSummary, setErrorSummary] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const citizenship = watch("citizenship");
    const residency = watch("residencyCA");
    const passportCountry = watch("passportCountry");
    const needPassport = citizenship !== "CA";
    const needPermit = residency === "Work Permit" || residency === "Study Permit";
    const needPR = residency === "PR";
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
            const storeReady = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$register$2d$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normalizeForStorage"])(values);
            const id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$uuid$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["uuidv4"])();
            setQrid(id);
            const payload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$qr$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildQrPayload"])({
                qrid: id,
                origin: window.location.origin
            });
            const png = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$qr$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["makeQrPng"])(payload);
            setQrPng(png);
            const snap = {
                qrid: id,
                name: [
                    storeReady.givenName,
                    storeReady.middleName,
                    storeReady.surname
                ].filter(Boolean).join(" "),
                jurisdiction: storeReady.jurisdiction,
                licenseNo: storeReady.licenseNo,
                licenseClass: storeReady.licenseClass,
                licenseExpiry: storeReady.licenseExpiry,
                issuedAt: new Date().toISOString()
            };
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$demo$2d$store$2d$remote$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["saveSnapshotRemote"])(snap);
            const doc = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$pdf$2f$DriverCardPDF$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                name: snap.name,
                qrPng: png
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 100,
                columnNumber: 19
            }, this);
            const blob = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$react$2d$pdf$2b$renderer$40$4$2e$3$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f40$react$2d$pdf$2f$renderer$2f$lib$2f$react$2d$pdf$2e$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["pdf"])(doc).toBlob();
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setSubmitError(msg);
            if ("TURBOPACK compile-time truthy", 1) window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
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
            var _k;
            const issue = (_k = errs[k]) === null || _k === void 0 ? void 0 : _k.message;
            if (issue) pushMsg(issue);
        }
        setErrorSummary(msgs.length ? msgs : [
            "Please review the highlighted fields."
        ]);
        const firstKey = order.find((k)=>Boolean(errs[k]));
        if (firstKey) {
            const el = document.querySelector('[name="'.concat(String(firstKey), '"]'));
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
        setValue(key, f !== null && f !== void 0 ? f : undefined, {
            shouldValidate: true
        });
    }
    var _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _qrid_slice;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "mx-auto max-w-3xl px-4 py-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900",
                children: "Secure submission • QR contains only a random ID • Minimal non-PII metadata is stored temporarily for the verification demo"
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 147,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "mb-4 text-2xl font-semibold text-slate-900",
                children: "Driver Registration"
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 151,
                columnNumber: 7
            }, this),
            submitError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900",
                children: submitError
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 154,
                columnNumber: 9
            }, this),
            errorSummary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-medium",
                        children: "Please fix the following:"
                    }, void 0, false, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 160,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "list-inside list-disc",
                        children: errorSummary.slice(0, 6).map((m, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: m
                            }, i, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 163,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 161,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 159,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: handleSubmit(onSubmit, onInvalid),
                className: "space-y-10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-medium",
                                children: "Identity & Licence"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 171,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$NameFields$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                register: register,
                                setValue: setValue,
                                errors: errors
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 172,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-4 sm:grid-cols-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "Issuing jurisdiction",
                                        err: (_errors_jurisdiction = errors.jurisdiction) === null || _errors_jurisdiction === void 0 ? void 0 : _errors_jurisdiction.message,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            ...register("jurisdiction"),
                                            className: "mt-1 w-full rounded border border-slate-300 p-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "Select"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 179,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "CA-MB"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 180,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "CA-ON"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 181,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "CA-AB"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 182,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "CA-BC"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 183,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "CA-SK"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 184,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "CA-QC"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 185,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "CA-NB"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 186,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "CA-NL"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 187,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "CA-NS"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 188,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "CA-PE"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 189,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "CA-YT"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 190,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "CA-NT"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 191,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "CA-NU"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 192,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 175,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 174,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$LicenseClassSelect$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        register: register,
                                        setValue: setValue,
                                        watch: watch,
                                        errors: errors
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 195,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "Licence expiry",
                                        err: (_errors_licenseExpiry = errors.licenseExpiry) === null || _errors_licenseExpiry === void 0 ? void 0 : _errors_licenseExpiry.message,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "date",
                                            ...register("licenseExpiry"),
                                            className: "mt-1 w-full rounded border border-slate-300 p-2",
                                            min: new Date().toISOString().slice(0, 10),
                                            max: "2099-12-31"
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 202,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 201,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "Date of birth",
                                        err: (_errors_dob = errors.dob) === null || _errors_dob === void 0 ? void 0 : _errors_dob.message,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "date",
                                            ...register("dob"),
                                            className: "mt-1 w-full rounded border border-slate-300 p-2",
                                            max: new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().slice(0, 10)
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 211,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 210,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 173,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$LicenceInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                register: register,
                                setValue: setValue,
                                watch: watch,
                                errors: errors
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 221,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 170,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-medium",
                                children: "Contact"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 231,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-4 sm:grid-cols-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "Email",
                                        err: (_errors_email = errors.email) === null || _errors_email === void 0 ? void 0 : _errors_email.message,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "email",
                                            ...register("email"),
                                            className: "mt-1 w-full rounded border border-slate-300 p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 234,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 233,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$PhoneInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        register: register,
                                        setValue: setValue,
                                        watch: watch,
                                        errors: errors
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 240,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 232,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 230,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-medium",
                                children: "Address"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 251,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-4 sm:grid-cols-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$PostalInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        register: register,
                                        setValue: setValue,
                                        errors: errors
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 253,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "Region/Province/State (auto for CA)",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("region"),
                                            className: "mt-1 w-full rounded border border-slate-300 p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 255,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 254,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "Country code (auto for CA/US)",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("country"),
                                            className: "mt-1 w-full rounded border border-slate-300 p-2",
                                            placeholder: "CA or US"
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 258,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 257,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "City",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("city"),
                                            className: "mt-1 w-full rounded border border-slate-300 p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 261,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 260,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "Address line 1",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("address1"),
                                            className: "mt-1 w-full rounded border border-slate-300 p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 264,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 263,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "Address line 2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("address2"),
                                            className: "mt-1 w-full rounded border border-slate-300 p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 267,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 266,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 252,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 250,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$StatusWizard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        register: register,
                        watch: watch,
                        setValue: setValue,
                        errors: errors
                    }, void 0, false, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this),
                    needPR && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "space-y-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-medium",
                                children: "Permanent Resident"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 281,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-4 sm:grid-cols-2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                    label: "PR card number (Document No.)",
                                    err: (_errors_prNumber = errors.prNumber) === null || _errors_prNumber === void 0 ? void 0 : _errors_prNumber.message,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        ...register("prNumber"),
                                        className: "mt-1 w-full rounded border border-slate-300 p-2 tracking-wider",
                                        placeholder: "AB12345678"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 287,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/driver/register/page.tsx",
                                    lineNumber: 283,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 282,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 280,
                        columnNumber: 11
                    }, this),
                    needPassport && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "space-y-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-medium",
                                children: "Passport"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 300,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-4 sm:grid-cols-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$CountrySelect$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        name: "passportCountry",
                                        label: "Passport country",
                                        register: register,
                                        setValue: setValue,
                                        errors: errors
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 302,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$inputs$2f$PassportInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        countryCode: passportCountry,
                                        register: register,
                                        setValue: setValue,
                                        errors: errors
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 309,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 301,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 299,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-medium",
                                children: "Languages"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 321,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-4 sm:grid-cols-2 items-end",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "block text-sm text-slate-700",
                                                children: "English"
                                            }, void 0, false, {
                                                fileName: "[project]/app/driver/register/page.tsx",
                                                lineNumber: 324,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                value: "English",
                                                readOnly: true,
                                                className: "mt-1 w-full rounded border border-slate-200 bg-slate-50 p-2 text-slate-700"
                                            }, void 0, false, {
                                                fileName: "[project]/app/driver/register/page.tsx",
                                                lineNumber: 325,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 323,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "Level (required)",
                                        err: (_errors_englishLevel = errors.englishLevel) === null || _errors_englishLevel === void 0 ? void 0 : _errors_englishLevel.message,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            ...register("englishLevel"),
                                            className: "mt-1 w-full rounded border border-slate-300 p-2",
                                            defaultValue: "",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    disabled: true,
                                                    children: "Fluency"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 337,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "Basic"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 340,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "Conversational"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 341,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "Fluent"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 342,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    children: "Native"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/driver/register/page.tsx",
                                                    lineNumber: 343,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 332,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 331,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 322,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OtherLanguagesRows, {
                                value: watch("otherLanguages") || [],
                                onChange: (rows)=>setValue("otherLanguages", rows, {
                                        shouldValidate: true
                                    })
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 347,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 320,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "space-y-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-medium",
                                children: "Work Experience (last 3 years)"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 357,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm text-slate-700",
                                        children: "Add up to 10 entries"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 359,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>addWork({}),
                                        className: "text-sm underline",
                                        children: "Add"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 360,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 358,
                                columnNumber: 11
                            }, this),
                            work.map((w, idx)=>{
                                var _company, _this, _errors_work, _role, _this1, _errors_work1, _start, _this2, _errors_work2, _end, _this3, _errors_work3;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid gap-2 sm:grid-cols-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                            label: "Company",
                                            err: (_this = (_errors_work = errors.work) === null || _errors_work === void 0 ? void 0 : _errors_work[idx]) === null || _this === void 0 ? void 0 : (_company = _this.company) === null || _company === void 0 ? void 0 : _company.message,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                ...register("work.".concat(idx, ".company")),
                                                className: "mt-1 rounded border border-slate-300 p-2"
                                            }, void 0, false, {
                                                fileName: "[project]/app/driver/register/page.tsx",
                                                lineNumber: 374,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 370,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                            label: "Role",
                                            err: (_this1 = (_errors_work1 = errors.work) === null || _errors_work1 === void 0 ? void 0 : _errors_work1[idx]) === null || _this1 === void 0 ? void 0 : (_role = _this1.role) === null || _role === void 0 ? void 0 : _role.message,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                ...register("work.".concat(idx, ".role")),
                                                className: "mt-1 rounded border border-slate-300 p-2"
                                            }, void 0, false, {
                                                fileName: "[project]/app/driver/register/page.tsx",
                                                lineNumber: 383,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 379,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                            label: "From",
                                            err: (_this2 = (_errors_work2 = errors.work) === null || _errors_work2 === void 0 ? void 0 : _errors_work2[idx]) === null || _this2 === void 0 ? void 0 : (_start = _this2.start) === null || _start === void 0 ? void 0 : _start.message,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "date",
                                                ...register("work.".concat(idx, ".start")),
                                                className: "mt-1 rounded border border-slate-300 p-2"
                                            }, void 0, false, {
                                                fileName: "[project]/app/driver/register/page.tsx",
                                                lineNumber: 392,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 388,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                            label: "To",
                                            err: (_this3 = (_errors_work3 = errors.work) === null || _errors_work3 === void 0 ? void 0 : _errors_work3[idx]) === null || _this3 === void 0 ? void 0 : (_end = _this3.end) === null || _end === void 0 ? void 0 : _end.message,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "date",
                                                        ...register("work.".concat(idx, ".end")),
                                                        className: "mt-1 w-full rounded border border-slate-300 p-2"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/driver/register/page.tsx",
                                                        lineNumber: 403,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        className: "text-sm underline",
                                                        onClick: ()=>removeWork(idx),
                                                        children: "Remove"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/driver/register/page.tsx",
                                                        lineNumber: 408,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/driver/register/page.tsx",
                                                lineNumber: 402,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 398,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, w.id, true, {
                                    fileName: "[project]/app/driver/register/page.tsx",
                                    lineNumber: 369,
                                    columnNumber: 13
                                }, this);
                            })
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 356,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-medium",
                                children: "Documents"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 423,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$driver$2f$DocUploadField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                label: "Licence - front",
                                required: true,
                                value: (_ref = watch("docLicenseFront")) !== null && _ref !== void 0 ? _ref : null,
                                onChange: (f)=>setFile("docLicenseFront", f)
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 424,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$driver$2f$DocUploadField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                label: "Licence - back",
                                required: true,
                                value: (_ref1 = watch("docLicenseBack")) !== null && _ref1 !== void 0 ? _ref1 : null,
                                onChange: (f)=>setFile("docLicenseBack", f)
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 430,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$driver$2f$DocUploadField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                label: "Health card",
                                required: true,
                                value: (_ref2 = watch("docHealthCard")) !== null && _ref2 !== void 0 ? _ref2 : null,
                                onChange: (f)=>setFile("docHealthCard", f)
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 436,
                                columnNumber: 11
                            }, this),
                            needPR && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$driver$2f$DocUploadField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                label: "PR Card",
                                required: true,
                                value: (_ref3 = watch("docPR")) !== null && _ref3 !== void 0 ? _ref3 : null,
                                onChange: (f)=>setFile("docPR", f)
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 443,
                                columnNumber: 13
                            }, this),
                            needPassport && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$driver$2f$DocUploadField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                label: "Passport",
                                required: true,
                                value: (_ref4 = watch("docPassport")) !== null && _ref4 !== void 0 ? _ref4 : null,
                                onChange: (f)=>setFile("docPassport", f)
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 451,
                                columnNumber: 13
                            }, this),
                            needPermit && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$driver$2f$DocUploadField$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                label: "Work/Study Permit",
                                required: true,
                                value: (_ref5 = watch("docPermit")) !== null && _ref5 !== void 0 ? _ref5 : null,
                                onChange: (f)=>setFile("docPermit", f)
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 459,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-slate-500",
                                children: "Accepted: JPG/PNG • Max 4 MB each."
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 466,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 422,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "space-y-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-medium",
                                children: "Consent"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 473,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "flex items-start gap-2 text-sm text-slate-800",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        ...register("consentAbstract"),
                                        className: "mt-1"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 475,
                                        columnNumber: 13
                                    }, this),
                                    "I authorise [ORG] to request my driver abstract from the issuing authority."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 474,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-4 sm:grid-cols-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "Type your name to sign",
                                        err: (_errors_consentName = errors.consentName) === null || _errors_consentName === void 0 ? void 0 : _errors_consentName.message,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ...register("consentName"),
                                            className: "mt-1 w-full rounded border border-slate-300 p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 480,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 479,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                                        label: "Date",
                                        err: (_errors_consentDate = errors.consentDate) === null || _errors_consentDate === void 0 ? void 0 : _errors_consentDate.message,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "date",
                                            ...register("consentDate"),
                                            defaultValue: new Date().toISOString().slice(0, 10),
                                            className: "mt-1 w-full rounded border border-slate-300 p-2"
                                        }, void 0, false, {
                                            fileName: "[project]/app/driver/register/page.tsx",
                                            lineNumber: 486,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 485,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 478,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "flex items-start gap-2 text-sm text-slate-800",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        ...register("certifyAccurate"),
                                        className: "mt-1"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 495,
                                        columnNumber: 13
                                    }, this),
                                    "I certify the information provided is accurate."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 494,
                                columnNumber: 11
                            }, this),
                            ((_errors_consentAbstract = errors.consentAbstract) === null || _errors_consentAbstract === void 0 ? void 0 : _errors_consentAbstract.message) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-rose-600",
                                children: String(errors.consentAbstract.message)
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 499,
                                columnNumber: 13
                            }, this),
                            ((_errors_certifyAccurate = errors.certifyAccurate) === null || _errors_certifyAccurate === void 0 ? void 0 : _errors_certifyAccurate.message) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-rose-600",
                                children: String(errors.certifyAccurate.message)
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 502,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 472,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3 pt-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "submit",
                                className: "rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50",
                                disabled: submitting,
                                children: submitting ? "Generating…" : "Submit & Generate QR"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 508,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-sm text-slate-500",
                                children: "Data stays on your device for this demo. No upload occurs."
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 515,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 507,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 168,
                columnNumber: 7
            }, this),
            qrPng && pdfUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mt-10 rounded border border-slate-200 p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "mb-2 text-base font-medium",
                        children: "Your QR & Card"
                    }, void 0, false, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 524,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                src: qrPng,
                                alt: "QR code",
                                width: 160,
                                height: 160,
                                className: "h-40 w-40 border border-slate-200"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 526,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: pdfUrl,
                                        download: "driver-card-".concat(safeFileName(fullName || ((_qrid_slice = qrid === null || qrid === void 0 ? void 0 : qrid.slice(0, 8)) !== null && _qrid_slice !== void 0 ? _qrid_slice : "card")), ".pdf"),
                                        className: "inline-flex rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800",
                                        children: "Download Card (PDF)"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 534,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-slate-600",
                                        children: "Card shows only your name and this QR. The QR contains only a random ID (no personal data). A minimal non-PII snapshot is stored temporarily to enable verification."
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 541,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 533,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 525,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 523,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/driver/register/page.tsx",
        lineNumber: 146,
        columnNumber: 5
    }, this);
}
_s(RegisterPage, "+9IKvjK9mV96BlYOvATRN8Y0V9U=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$hook$2d$form$40$7$2e$62$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useForm"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$hook$2d$form$40$7$2e$62$2e$0_react$40$19$2e$1$2e$0$2f$node_modules$2f$react$2d$hook$2d$form$2f$dist$2f$index$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useFieldArray"]
    ];
});
_c = RegisterPage;
function Field(param) {
    let { label, err, children } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: "block",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "block text-sm text-slate-700",
                children: label
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 556,
                columnNumber: 7
            }, this),
            children,
            err && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-rose-600",
                children: err
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 558,
                columnNumber: 15
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/driver/register/page.tsx",
        lineNumber: 555,
        columnNumber: 5
    }, this);
}
_c1 = Field;
function OtherLanguagesRows(param) {
    let { value, onChange } = param;
    const rows = value !== null && value !== void 0 ? value : [];
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-2",
        children: [
            rows.map((row, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid gap-3 sm:grid-cols-3 items-end",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Other language",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                list: "all-languages",
                                value: row.language,
                                onChange: (e)=>setRow(idx, {
                                        language: e.target.value
                                    }),
                                className: "mt-1 w-full rounded border border-slate-300 p-2",
                                placeholder: "Select language"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 589,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/driver/register/page.tsx",
                            lineNumber: 588,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                            label: "Level",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: row.level,
                                onChange: (e)=>setRow(idx, {
                                        level: e.target.value
                                    }),
                                className: "mt-1 w-full rounded border border-slate-300 p-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: "Basic"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 603,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: "Conversational"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 604,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: "Fluent"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 605,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: "Native"
                                    }, void 0, false, {
                                        fileName: "[project]/app/driver/register/page.tsx",
                                        lineNumber: 606,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 598,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/driver/register/page.tsx",
                            lineNumber: 597,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-end",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>remove(idx),
                                className: "ml-auto rounded border px-3 py-2 text-sm hover:bg-slate-50",
                                children: "Remove"
                            }, void 0, false, {
                                fileName: "[project]/app/driver/register/page.tsx",
                                lineNumber: 610,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/driver/register/page.tsx",
                            lineNumber: 609,
                            columnNumber: 11
                        }, this)
                    ]
                }, idx, true, {
                    fileName: "[project]/app/driver/register/page.tsx",
                    lineNumber: 587,
                    columnNumber: 9
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: add,
                    className: "ml-auto inline-flex items-center gap-2 rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800",
                    title: "Add another language",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "+ Add language"
                    }, void 0, false, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 627,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/driver/register/page.tsx",
                    lineNumber: 621,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 620,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("datalist", {
                id: "all-languages",
                children: [
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
                ].map((l)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$5$2e$3_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        value: l
                    }, l, false, {
                        fileName: "[project]/app/driver/register/page.tsx",
                        lineNumber: 636,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/driver/register/page.tsx",
                lineNumber: 630,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/driver/register/page.tsx",
        lineNumber: 585,
        columnNumber: 5
    }, this);
}
_c2 = OtherLanguagesRows;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "RegisterPage");
__turbopack_context__.k.register(_c1, "Field");
__turbopack_context__.k.register(_c2, "OtherLanguagesRows");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_948882c8._.js.map