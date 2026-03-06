// Canonical grammar concept names used in both the Claude prompt and DB seed.
// Claude is forced to pick from this list — never invents its own categories.

export const GRAMMAR_CONCEPTS = {
  es: [
    { name: "ser-vs-estar", description: "Choosing between ser and estar (to be)" },
    { name: "preterite-tense", description: "Completed past actions (comí, fui)" },
    { name: "imperfect-tense", description: "Ongoing or habitual past actions (comía, era)" },
    { name: "subjunctive-mood", description: "Wishes, doubts, hypotheticals (quiero que vengas)" },
    { name: "gendered-nouns", description: "Noun gender agreement (el/la, un/una)" },
    { name: "adjective-agreement", description: "Adjective matching noun gender and number" },
    { name: "reflexive-verbs", description: "Verbs with reflexive pronouns (me llamo, se ducha)" },
    { name: "verb-conjugation", description: "Incorrect verb endings for person/number/tense" },
    { name: "direct-indirect-object", description: "Object pronoun placement and choice (lo, le, me)" },
    { name: "prepositions", description: "Incorrect use of por, para, a, en, de, etc." },
    { name: "word-order", description: "Incorrect sentence structure or word ordering" },
    { name: "future-tense", description: "Future actions (hablaré, voy a hablar)" },
    { name: "conditional-tense", description: "Hypothetical outcomes (hablaría, comería)" },
    { name: "plural-forms", description: "Incorrect plural endings for nouns or adjectives" },
    { name: "accent-marks", description: "Missing or incorrect written accent marks" },
  ],
  it: [
    { name: "essere-vs-avere", description: "Choosing the correct auxiliary verb (essere/avere)" },
    { name: "passato-prossimo", description: "Recent past tense with auxiliary + past participle" },
    { name: "imperfetto", description: "Ongoing or habitual past actions (mangiavo, ero)" },
    { name: "subjunctive-mood", description: "Wishes, doubts, hypotheticals (voglio che tu venga)" },
    { name: "gendered-nouns", description: "Noun gender agreement (il/la, un/una)" },
    { name: "adjective-agreement", description: "Adjective matching noun gender and number" },
    { name: "reflexive-verbs", description: "Verbs with reflexive pronouns (mi chiamo, si lava)" },
    { name: "verb-conjugation", description: "Incorrect verb endings for person/number/tense" },
    { name: "direct-indirect-object", description: "Object pronoun placement and choice (lo, gli, mi)" },
    { name: "prepositions", description: "Incorrect use of di, a, da, in, con, su, per, tra/fra" },
    { name: "articulated-prepositions", description: "Fused prepositions (del, alla, negli, etc.)" },
    { name: "word-order", description: "Incorrect sentence structure or word ordering" },
    { name: "future-tense", description: "Future actions (parlerò, andrò)" },
    { name: "conditional-tense", description: "Hypothetical outcomes (parlerei, andrei)" },
    { name: "plural-forms", description: "Incorrect plural endings for nouns or adjectives" },
  ],
} as const;

export type GrammarConceptName =
  | (typeof GRAMMAR_CONCEPTS.es)[number]["name"]
  | (typeof GRAMMAR_CONCEPTS.it)[number]["name"];