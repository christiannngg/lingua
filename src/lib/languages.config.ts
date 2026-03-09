/**
 * languages.config.ts
 *
 * Single source of truth for all supported languages in Lingua.
 *
 * Adding a new language requires ONLY:
 *   1. A new entry in LANGUAGE_CONFIG below
 *   2. A new key in GRAMMAR_CONCEPTS (imported by grammar-concepts.ts)
 *   3. A new entry in the PERSONAS record in conversation-prompt.ts
 *
 * No other files need to change.
 */

// ---------------------------------------------------------------------------
// Core language config
// ---------------------------------------------------------------------------

export interface LanguageConfig {
  flagCode:
    | "AC"
    | "AD"
    | "AE"
    | "AF"
    | "AG"
    | "AI"
    | "AL"
    | "AM"
    | "AO"
    | "AQ"
    | "AR"
    | "AS"
    | "AT"
    | "AU"
    | "AW"
    | "AX"
    | "AZ"
    | "BA"
    | "BB"
    | "BD"
    | "BE"
    | "BF"
    | "BG"
    | "BH"
    | "BI"
    | "BJ"
    | "BL"
    | "BM"
    | "BN"
    | "BO"
    | "BQ_BO"
    | "BQ_SA"
    | "BQ_SE"
    | "BQ"
    | "BR"
    | "BS"
    | "BT"
    | "BV"
    | "BW"
    | "BY"
    | "BZ"
    | "CA"
    | "CC"
    | "CD"
    | "CF"
    | "CG"
    | "CH"
    | "CI"
    | "CK"
    | "CL"
    | "CM"
    | "CN"
    | "CO"
    | "CR"
    | "CU"
    | "CV"
    | "CW"
    | "CX"
    | "CY"
    | "CZ"
    | "DE"
    | "DJ"
    | "DK"
    | "DM"
    | "DO"
    | "DZ"
    | "EC"
    | "EE"
    | "EG"
    | "EH"
    | "ER"
    | "ES_CT"
    | "ES"
    | "ET"
    | "EU"
    | "FI"
    | "FJ"
    | "FK"
    | "FM"
    | "FO"
    | "FR"
    | "GA"
    | "GB_ENG"
    | "GB_NIR"
    | "GB_SCT"
    | "GB_WLS"
    | "GB"
    | "GD"
    | "GE"
    | "GF"
    | "GG"
    | "GH"
    | "GI"
    | "GL"
    | "GM"
    | "GN"
    | "GP"
    | "GQ"
    | "GR"
    | "GS"
    | "GT"
    | "GU"
    | "GW"
    | "GY"
    | "HK"
    | "HM"
    | "HN"
    | "HR"
    | "HT"
    | "HU"
    | "IC"
    | "ID"
    | "IE"
    | "IL"
    | "IM"
    | "IN"
    | "IO"
    | "IQ"
    | "IR"
    | "IS"
    | "IT"
    | "JE"
    | "JM"
    | "JO"
    | "JP"
    | "KE"
    | "KG"
    | "KH"
    | "KI"
    | "KM"
    | "KN"
    | "KP"
    | "KR"
    | "KW"
    | "KY"
    | "KZ"
    | "LA"
    | "LB"
    | "LC"
    | "LI"
    | "LK"
    | "LR"
    | "LS"
    | "LT"
    | "LU"
    | "LV"
    | "LY"
    | "MA"
    | "MC"
    | "MD"
    | "ME"
    | "MF"
    | "MG"
    | "MH"
    | "MK"
    | "ML"
    | "MM"
    | "MN"
    | "MO"
    | "MP"
    | "MQ"
    | "MR"
    | "MS"
    | "MT"
    | "MU"
    | "MV"
    | "MW"
    | "MX"
    | "MY"
    | "MZ"
    | "NA"
    | "NC"
    | "NE"
    | "NF"
    | "NG"
    | "NI"
    | "NL"
    | "NO"
    | "NP"
    | "NR"
    | "NU"
    | "NZ"
    | "OM"
    | "PA"
    | "PE"
    | "PF"
    | "PG"
    | "PH"
    | "PK"
    | "PL"
    | "PM"
    | "PN"
    | "PR"
    | "PS"
    | "PT"
    | "PW"
    | "PY"
    | "QA"
    | "RE"
    | "RO"
    | "RS"
    | "RU"
    | "RW"
    | "SA"
    | "SB"
    | "SC"
    | "SD"
    | "SE"
    | "SG"
    | "SH"
    | "SI"
    | "SJ"
    | "SK"
    | "SL"
    | "SM"
    | "SN"
    | "SO"
    | "SR"
    | "SS"
    | "ST"
    | "SV"
    | "SX"
    | "SY"
    | "SZ"
    | "TA"
    | "TC"
    | "TD"
    | "TF"
    | "TG"
    | "TH"
    | "TJ"
    | "TK"
    | "TL"
    | "TM"
    | "TN"
    | "TO"
    | "TR"
    | "TT"
    | "TV"
    | "TW"
    | "TZ"
    | "UA"
    | "UG"
    | "UM"
    | "US"
    | "UY"
    | "UZ"
    | "VA"
    | "VC"
    | "VE"
    | "VG"
    | "VI"
    | "VN"
    | "VU"
    | "WF"
    | "WS"
    | "XA"
    | "XC"
    | "XK"
    | "XO"
    | "YE"
    | "YT"
    | "ZA"
    | "ZM"
    | "ZW";
  /** BCP-47 language code used throughout the app and DB */
  code: string;
  /** Human-readable name shown in the UI */
  displayName: string;
  /** Name of the AI persona for this language */
  personaName: string;
}

const LANGUAGE_CONFIG = [
  {
    code: "es",
    displayName: "Spanish",
    personaName: "Sofia",
    flagCode: "ES",
  },
  {
    code: "it",
    displayName: "Italian",
    personaName: "Marco",
    flagCode: "IT",
  },
  // ── Add new languages below this line ─────────────────────────────────────
  // Stub: French — persona prompt + grammar concepts still needed before
  // this language is fully functional, but all config-driven lookups will
  // work immediately once this entry exists.
  {
    code: "fr",
    displayName: "French",
    personaName: "Camille",
    flagCode: "FR",
  },
] as const satisfies LanguageConfig[];

// ---------------------------------------------------------------------------
// Derived types — inferred from the config, never manually maintained
// ---------------------------------------------------------------------------

/** Union of all supported language codes: "es" | "it" | "fr" */
export type SupportedLanguage = (typeof LANGUAGE_CONFIG)[number]["code"];

/** Tuple of all supported language codes — used for runtime validation */
export const SUPPORTED_LANGUAGE_CODES = LANGUAGE_CONFIG.map((l) => l.code) as unknown as readonly [
  SupportedLanguage,
  ...SupportedLanguage[],
];

// ---------------------------------------------------------------------------
// Lookup helpers — O(n) over a tiny list, no need for a Map
// ---------------------------------------------------------------------------

/**
 * Returns the full config for a language code, or undefined if not found.
 * Prefer the typed helpers below over accessing this directly.
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return LANGUAGE_CONFIG.find((l) => l.code === code);
}

/**
 * Returns the display name for a language code.
 * Falls back to the raw code if the language is unknown.
 *
 * @example getLanguageDisplayName("es") // "Spanish"
 */
export function getLanguageDisplayName(code: string): string {
  return getLanguageConfig(code)?.displayName ?? code;
}

/**
 * Returns the persona name for a language code.
 * Falls back to "Your tutor" if the language is unknown.
 *
 * @example getPersonaNameForLanguage("it") // "Marco"
 */
export function getPersonaNameForLanguage(code: string): string {
  return getLanguageConfig(code)?.personaName ?? "Your tutor";
}

/**
 * Type guard — returns true if the given string is a supported language code.
 * Use this anywhere you need to validate untrusted input (API routes, actions).
 *
 * @example isSupportedLanguage("fr") // true
 * @example isSupportedLanguage("de") // false
 */
export function isSupportedLanguage(code: string): code is SupportedLanguage {
  return SUPPORTED_LANGUAGE_CODES.includes(code as SupportedLanguage);
}

/**
 * Returns the full list of language configs.
 * Use this to render language selection UI without hardcoding options.
 */
export function getAllLanguages(): readonly LanguageConfig[] {
  return LANGUAGE_CONFIG;
}

/**
 * Returns the available languages for selection (alias for getAllLanguages,
 * kept for compatibility with Server Actions that call getAvailableLanguages).
 */
export function getAvailableLanguages(): readonly LanguageConfig[] {
  return LANGUAGE_CONFIG;
}
