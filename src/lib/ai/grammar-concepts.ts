/**
 * grammar-concepts.ts
 *
 * Canonical grammar concept names used in both the Claude prompt and DB seed.
 * Claude is forced to pick from this list — never invents its own categories.
 *
 * Adding a new language requires a new key here matching the language code
 * in languages.config.ts. The concepts will be picked up automatically by
 * extractAndSaveGrammar and the DB seed.
 */

import type { SupportedLanguage } from "@/lib/languages.config";

export const GRAMMAR_CONCEPTS: Record<
  SupportedLanguage,
  readonly { name: string; description: string }[]
> = {
  es: [
    { name: "ser-vs-estar", description: "Choosing between ser and estar (to be)" },
    { name: "preterite-tense", description: "Completed past actions (comí, fui)" },
    { name: "imperfect-tense", description: "Ongoing or habitual past actions (comía, era)" },
    { name: "subjunctive-mood", description: "Wishes, doubts, hypotheticals (quiero que vengas)" },
    { name: "gendered-nouns", description: "Noun gender agreement (el/la, un/una)" },
    { name: "adjective-agreement", description: "Adjective matching noun gender and number" },
    { name: "reflexive-verbs", description: "Verbs with reflexive pronouns (me llamo, se ducha)" },
    { name: "verb-conjugation", description: "Incorrect verb endings for person/number/tense" },
    {
      name: "direct-indirect-object",
      description: "Object pronoun placement and choice (lo, le, me)",
    },
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
    {
      name: "subjunctive-mood",
      description: "Wishes, doubts, hypotheticals (voglio che tu venga)",
    },
    { name: "gendered-nouns", description: "Noun gender agreement (il/la, un/una)" },
    { name: "adjective-agreement", description: "Adjective matching noun gender and number" },
    { name: "reflexive-verbs", description: "Verbs with reflexive pronouns (mi chiamo, si lava)" },
    { name: "verb-conjugation", description: "Incorrect verb endings for person/number/tense" },
    {
      name: "direct-indirect-object",
      description: "Object pronoun placement and choice (lo, gli, mi)",
    },
    { name: "prepositions", description: "Incorrect use of di, a, da, in, con, su, per, tra/fra" },
    {
      name: "articulated-prepositions",
      description: "Fused prepositions (del, alla, negli, etc.)",
    },
    { name: "word-order", description: "Incorrect sentence structure or word ordering" },
    { name: "future-tense", description: "Future actions (parlerò, andrò)" },
    { name: "conditional-tense", description: "Hypothetical outcomes (parlerei, andrei)" },
    { name: "plural-forms", description: "Incorrect plural endings for nouns or adjectives" },
  ],

  fr: [
    { name: "etre-vs-avoir", description: "Choosing the correct auxiliary verb (être/avoir)" },
    { name: "passe-compose", description: "Recent past tense with auxiliary + past participle" },
    { name: "imparfait", description: "Ongoing or habitual past actions (mangeais, étais)" },
    {
      name: "subjunctive-mood",
      description: "Wishes, doubts, hypotheticals (je veux que tu viennes)",
    },
    { name: "gendered-nouns", description: "Noun gender agreement (le/la, un/une)" },
    { name: "adjective-agreement", description: "Adjective matching noun gender and number" },
    {
      name: "reflexive-verbs",
      description: "Verbs with reflexive pronouns (je m'appelle, il se lave)",
    },
    { name: "verb-conjugation", description: "Incorrect verb endings for person/number/tense" },
    {
      name: "direct-indirect-object",
      description: "Object pronoun placement and choice (le, lui, me)",
    },
    { name: "prepositions", description: "Incorrect use of de, à, en, dans, par, pour, etc." },
    { name: "word-order", description: "Incorrect sentence structure or word ordering" },
    { name: "future-tense", description: "Future actions (je parlerai, je vais parler)" },
    { name: "conditional-tense", description: "Hypothetical outcomes (je parlerais, j'irais)" },
    { name: "plural-forms", description: "Incorrect plural endings for nouns or adjectives" },
    {
      name: "liaison-elision",
      description: "Missing or incorrect liaison or elision (l'ami, ils ont)",
    },
  ],

  // ---------------------------------------------------------------------------
  // Portuguese
  // ---------------------------------------------------------------------------
  pt: [
    { name: "ser-vs-estar", description: "Choosing between ser and estar (to be)" },
    { name: "preterite-tense", description: "Completed past actions (comi, fui)" },
    { name: "imperfect-tense", description: "Ongoing or habitual past actions (comia, era)" },
    {
      name: "subjunctive-mood",
      description: "Wishes, doubts, hypotheticals (quero que venhas)",
    },
    { name: "gendered-nouns", description: "Noun gender agreement (o/a, um/uma)" },
    { name: "adjective-agreement", description: "Adjective matching noun gender and number" },
    {
      name: "reflexive-verbs",
      description: "Verbs with reflexive pronouns (chamo-me, ele se levanta)",
    },
    { name: "verb-conjugation", description: "Incorrect verb endings for person/number/tense" },
    {
      name: "direct-indirect-object",
      description: "Object pronoun placement and clitic climbing (o, lhe, me)",
    },
    {
      name: "personal-infinitive",
      description: "Correct use of the inflected infinitive unique to Portuguese (para irmos)",
    },
    { name: "prepositions", description: "Incorrect use of por, para, a, em, de, etc." },
    {
      name: "contractions",
      description: "Mandatory preposition + article contractions (do, na, pelo)",
    },
    { name: "future-tense", description: "Future actions (falarei, vou falar)" },
    { name: "conditional-tense", description: "Hypothetical outcomes (falaria, comeria)" },
    { name: "plural-forms", description: "Incorrect plural endings (-ões, -ães, -ais)" },
    { name: "accent-marks", description: "Missing or incorrect written accent marks" },
  ],

  // ---------------------------------------------------------------------------
  // German
  // ---------------------------------------------------------------------------
  de: [
    {
      name: "grammatical-cases",
      description: "Correct use of nominative, accusative, dative, and genitive cases",
    },
    {
      name: "article-declension",
      description: "Declining definite and indefinite articles by case and gender (den, dem, des)",
    },
    {
      name: "noun-gender",
      description: "Assigning correct grammatical gender to nouns (der/die/das)",
    },
    {
      name: "adjective-endings",
      description: "Adjective declension endings depending on case, gender, and article type",
    },
    {
      name: "verb-conjugation",
      description: "Incorrect verb endings for person, number, or tense",
    },
    {
      name: "separable-verbs",
      description: "Splitting separable prefix verbs correctly (anfangen -> ich fange an)",
    },
    {
      name: "modal-verbs",
      description: "Correct usage and position of modal verbs (können, müssen, dürfen, etc.)",
    },
    {
      name: "word-order",
      description:
        "Verb-second rule, subordinate clause verb-final order, and inversion after adverbials",
    },
    {
      name: "subordinate-clauses",
      description: "Verb placement and conjunctions in subordinate clauses (weil, dass, obwohl)",
    },
    {
      name: "two-way-prepositions",
      description: "Accusative vs dative after two-way prepositions (in, an, auf, über, etc.)",
    },
    {
      name: "perfect-tense",
      description: "Forming Perfekt with haben or sein + past participle",
    },
    {
      name: "haben-vs-sein",
      description: "Choosing haben or sein as the auxiliary in perfect and pluperfect tenses",
    },
    {
      name: "reflexive-verbs",
      description:
        "Reflexive pronoun choice and case (sich freuen, sich waschen — accusative vs dative)",
    },
    {
      name: "compound-nouns",
      description: "Forming and reading compound nouns correctly (Handtuch, Hauptbahnhof)",
    },
    {
      name: "comparative-superlative",
      description: "Forming comparative and superlative adjectives (größer, am größten)",
    },
    {
      name: "genitive-case",
      description:
        "Expressing possession and relationships with the genitive (des Mannes, wegen des Wetters)",
    },
  ],

  // ---------------------------------------------------------------------------
  // Japanese
  // ---------------------------------------------------------------------------
  ja: [
    {
      name: "topic-subject-particles",
      description: "Correct use of は (wa) vs が (ga) as topic and subject markers",
    },
    {
      name: "object-particle",
      description: "Using を (wo/o) correctly to mark the direct object",
    },
    {
      name: "direction-location-particles",
      description:
        "Choosing correctly among に, へ, で, から, まで for direction, location, and time",
    },
    {
      name: "verb-conjugation",
      description:
        "Correct verb forms across tenses, groups (う/る/irregular), and politeness levels",
    },
    {
      name: "te-form",
      description: "Forming and using the て-form for requests, sequences, and compound actions",
    },
    {
      name: "plain-vs-polite-form",
      description: "Switching correctly between plain (dictionary) form and polite ます/です form",
    },
    {
      name: "keigo-honorifics",
      description: "Appropriate use of respectful (尊敬語) and humble (謙譲語) speech registers",
    },
    {
      name: "counter-words",
      description:
        "Correct counter suffixes for objects, people, animals, floors (本, 枚, 人, 階, etc.)",
    },
    {
      name: "adjective-conjugation",
      description:
        "Conjugating い-adjectives and な-adjectives correctly in past, negative, and adverbial forms",
    },
    {
      name: "hiragana-katakana",
      description:
        "Using hiragana and katakana in the correct contexts (foreign loanwords -> katakana)",
    },
    {
      name: "kanji-reading",
      description: "Selecting the correct on'yomi or kun'yomi reading for a kanji in context",
    },
    {
      name: "sentence-final-particles",
      description: "Using ね, よ, か, な, わ appropriately to convey nuance and seek confirmation",
    },
    {
      name: "conditionals",
      description: "Choosing the right conditional form: と, ば, たら, なら",
    },
    {
      name: "passive-causative",
      description: "Forming passive (〜られる) and causative (〜させる) constructions correctly",
    },
    {
      name: "relative-clauses",
      description: "Placing modifier clauses before the noun they describe (verb + noun pattern)",
    },
  ],

  // ---------------------------------------------------------------------------
  // Mandarin Chinese
  // ---------------------------------------------------------------------------
  zh: [
    {
      name: "tones",
      description:
        "Applying the correct tone (1st–4th + neutral) to syllables in pinyin and speech",
    },
    {
      name: "measure-words",
      description: "Using the correct measure word (量词) before nouns (一本书, 三条鱼, 两个人)",
    },
    {
      name: "aspect-particles",
      description:
        "Correct use of 了, 着, and 过 to express completion, ongoing state, and experience",
    },
    {
      name: "topic-comment-structure",
      description: "Framing sentences with a topic followed by a comment (那本书我看过了)",
    },
    {
      name: "ba-construction",
      description: "Using the 把 construction to indicate disposal or action on a specific object",
    },
    {
      name: "bei-passive",
      description: "Forming passive constructions with 被 and understanding their pragmatic weight",
    },
    {
      name: "resultative-complements",
      description: "Attaching result complements to verbs (做完, 听懂, 写好)",
    },
    {
      name: "directional-complements",
      description: "Using directional complements (上来, 出去, 回来) with movement verbs",
    },
    {
      name: "negation",
      description:
        "Choosing correctly between 不 (habitual/general) and 没 (completed action absent)",
    },
    {
      name: "time-expressions",
      description: "Correct placement of time words and duration phrases in a sentence",
    },
    {
      name: "question-formation",
      description: "Forming questions with 吗, 呢, or question words without inverting word order",
    },
    {
      name: "verb-reduplication",
      description: "Using reduplicated verb forms to express brevity or casualness (看看, 想想)",
    },
    {
      name: "complements-of-degree",
      description: "Expressing extent or degree with 得 (她跑得很快)",
    },
    {
      name: "chengyu-usage",
      description: "Using four-character idiomatic expressions (成语) in the correct context",
    },
    {
      name: "simplified-characters",
      description: "Writing commonly confused simplified characters correctly",
    },
  ],

  // ---------------------------------------------------------------------------
  // Korean
  // ---------------------------------------------------------------------------
  ko: [
    {
      name: "topic-subject-particles",
      description: "Choosing correctly between topic marker 은/는 and subject marker 이/가",
    },
    {
      name: "object-particle",
      description: "Using the object particle 을/를 correctly",
    },
    {
      name: "location-direction-particles",
      description:
        "Distinguishing 에 (location/destination), 에서 (action location), and 으로/로 (direction/means)",
    },
    {
      name: "verb-endings-politeness",
      description:
        "Conjugating verbs at the correct speech level: formal (합쇼체), polite (해요체), or informal (해체)",
    },
    {
      name: "honorific-speech",
      description:
        "Using honorific verb forms and vocabulary when addressing elders or superiors (드시다, 계시다)",
    },
    {
      name: "sentence-final-endings",
      description:
        "Choosing the appropriate sentence-final ending for declarative, interrogative, and imperative mood",
    },
    {
      name: "verb-connective-endings",
      description:
        "Using connective endings correctly to link clauses (고, 아서/어서, 지만, 는데, etc.)",
    },
    {
      name: "tense-aspect",
      description:
        "Expressing past (았/었), progressive (고 있다), and future/intention (을 것이다, 겠)",
    },
    {
      name: "negation",
      description:
        "Forming negative sentences with 안 (short form) vs 지 않다 (long form) correctly",
    },
    {
      name: "relative-clauses",
      description:
        "Forming noun-modifying clauses with the correct adnominal endings (는, 은/ㄴ, 을/ㄹ, 던)",
    },
    {
      name: "postpositions",
      description:
        "Selecting the correct postposition from near-synonyms (한테 vs 에게 vs 께, etc.)",
    },
    {
      name: "numeral-systems",
      description:
        "Choosing between sino-Korean (일, 이, 삼) and native Korean (하나, 둘, 셋) numerals in the right contexts",
    },
    {
      name: "passive-causative",
      description:
        "Forming passive (이/히/리/기) and causative (이/히/리/기/우/구/추) verb derivatives",
    },
    {
      name: "conditional-expressions",
      description: "Using conditional endings correctly (으면/면, 아야/어야, 거든)",
    },
    {
      name: "hangul-spelling",
      description:
        "Correct spelling of words affected by phonological rules (liaison, nasalization, aspiration)",
    },
  ],

  // ---------------------------------------------------------------------------
  // Russian
  // ---------------------------------------------------------------------------
  ru: [
    {
      name: "grammatical-cases",
      description:
        "Correct use of all six cases: nominative, accusative, genitive, dative, instrumental, prepositional",
    },
    {
      name: "noun-declension",
      description:
        "Declining nouns correctly by case, number, and gender across all declension classes",
    },
    {
      name: "adjective-agreement",
      description:
        "Adjective agreement with noun in gender, number, and case (новый/новая/новое/новые)",
    },
    {
      name: "verb-aspect",
      description:
        "Choosing the correct aspect pair — imperfective (несов.) for process, perfective (сов.) for completion",
    },
    {
      name: "verb-conjugation",
      description:
        "Correct verb endings for person and number across first and second conjugation classes",
    },
    {
      name: "motion-verbs",
      description:
        "Distinguishing unidirectional (идти/ехать) from multidirectional (ходить/ездить) verbs of motion",
    },
    {
      name: "past-tense-gender",
      description: "Past tense verbs agreeing with the subject in gender (он читал / она читала)",
    },
    {
      name: "genitive-of-negation",
      description:
        "Using the genitive case (not accusative) after negated verbs (не знаю этого человека)",
    },
    {
      name: "preposition-case-government",
      description:
        "Each preposition governing the correct case (в + accusative for direction, в + prepositional for location)",
    },
    {
      name: "short-form-adjectives",
      description:
        "Using short-form adjectives (рад, готов, должен) in predicative position correctly",
    },
    {
      name: "reflexive-verbs",
      description: "Using the reflexive particle -ся/-сь correctly (мыться, улыбаться, бояться)",
    },
    {
      name: "numeral-agreement",
      description:
        "Correct noun case after numerals (один -> nominative, два/три/четыре -> genitive singular, пять+ -> genitive plural)",
    },
    {
      name: "soft-hard-consonants",
      description:
        "Correct use of the soft sign (ь) and hard sign (ъ) affecting pronunciation and meaning",
    },
    {
      name: "stress-and-vowel-reduction",
      description:
        "Recognizing that unstressed о reduces to /а/ — affects both spelling awareness and pronunciation",
    },
    {
      name: "perfective-future",
      description:
        "Forming the future tense: imperfective (буду + infinitive) vs perfective (conjugated perfective verb)",
    },
  ],
} as const;

export type GrammarConceptName =
  | (typeof GRAMMAR_CONCEPTS.es)[number]["name"]
  | (typeof GRAMMAR_CONCEPTS.it)[number]["name"]
  | (typeof GRAMMAR_CONCEPTS.fr)[number]["name"]
  | (typeof GRAMMAR_CONCEPTS.pt)[number]["name"]
  | (typeof GRAMMAR_CONCEPTS.de)[number]["name"]
  | (typeof GRAMMAR_CONCEPTS.ja)[number]["name"]
  | (typeof GRAMMAR_CONCEPTS.zh)[number]["name"]
  | (typeof GRAMMAR_CONCEPTS.ko)[number]["name"]
  | (typeof GRAMMAR_CONCEPTS.ru)[number]["name"];
