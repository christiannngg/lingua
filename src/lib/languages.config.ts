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
  /** Flag code for supported languages only */
  flagCode: "CN" | "DE" | "ES" | "FR" | "IT" | "JP" | "KR" | "PT" | "RU";
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
  {
    code: "fr",
    displayName: "French",
    personaName: "Camille",
    flagCode: "FR",
  },
  {
    code: "pt",
    displayName: "Portuguese",
    personaName: "Beatriz",
    flagCode: "PT",
  },
  {
    code: "de",
    displayName: "German",
    personaName: "Lena",
    flagCode: "DE",
  },
  {
    code: "ja",
    displayName: "Japanese",
    personaName: "Hana",
    flagCode: "JP",
  },
  {
    code: "zh",
    displayName: "Mandarin",
    personaName: "Wei",
    flagCode: "CN",
  },
  {
    code: "ko",
    displayName: "Korean",
    personaName: "Jisoo",
    flagCode: "KR",
  },
  {
    code: "ru",
    displayName: "Russian",
    personaName: "Natasha",
    flagCode: "RU",
  },
] as const satisfies LanguageConfig[];

// ---------------------------------------------------------------------------
// Derived types — inferred from the config, never manually maintained
// ---------------------------------------------------------------------------

/** Union of all supported language codes: "es" | "it" | "fr" | "pt" | "de" | "ja" | "zh" | "ko" | "ru" */
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
 * @example isSupportedLanguage("de") // false (before this update: now true)
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