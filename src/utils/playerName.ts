export const DEFAULT_HERO_NAME = "Lữ Khách";

/**
 * Severe slurs & offensive roots matched anywhere in leetspeak/collapsed strings
 * (chosen carefully so legitimate Vietnamese & fantasy names never false-positive).
 */
const SUBSTRING_PROFANITY_ROOTS: readonly string[] = [
  "nigg",
  "fagg",
  "fuck",
  "fuk",
  "shit",
  "bitch",
  "cunt",
  "dick",
  "cock",
  "pussy",
  "porn",
  "nazi",
  "hitler",
  "whore",
  "slut",
  "chode",
  "rape",
  "ditme",
  "duma",
  "dkm",
  "dmm",
  "vcl",
  "vkl",
  "concac",
  "cailon",
  "daubuoi",
  "conchodien",
];

/**
 * Short Vietnamese/English profanity roots matched on word tokens
 * so legitimate words like "Hỏa Long", "Lữ Khách", "Cầu Vồng" remain 100% valid.
 */
const TOKEN_PROFANITY_WORDS = new Set<string>([
  "dit",
  "lon",
  "loz",
  "cac",
  "cak",
  "buoi",
  "deo",
  "dm",
  "dkm",
  "dmm",
  "vcl",
  "vkl",
  "vl",
  "cc",
  "cl",
  "chode",
  "ngu",
]);

const PHRASE_PROFANITY_PATTERNS: readonly RegExp[] = [
  /\bdu\s*ma\b/,
  /\bdit\s*me\b/,
  /\bdit\s*con\b/,
  /\bcon\s*cac\b/,
  /\bcai\s*lon\b/,
  /\bdau\s*buoi\b/,
  /\bdeo\s*me\b/,
  /\bcho\s*de\b/,
];

function foldAsciiAndLeet(input: string): string {
  return input
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/0/g, "o")
    .replace(/[4@]/g, "a")
    .replace(/[$5]/g, "s");
}

/**
 * Returns true if `raw` contains English or Vietnamese profanity, slurs, or leetspeak variants.
 */
export function isProfanePlayerName(raw: string): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;

  // Check both NFD-folded plain text and leetspeak-folded text
  const plainFolded = trimmed
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const leetFolded = foldAsciiAndLeet(trimmed);

  for (const variant of [plainFolded, leetFolded]) {
    const collapsed = variant.replace(/[^a-z0-9]+/g, "");
    const deduped = collapsed.replace(/(.)\1{2,}/g, "$1$1");

    for (const root of SUBSTRING_PROFANITY_ROOTS) {
      if (collapsed.includes(root) || deduped.includes(root)) {
        return true;
      }
    }

    const spaced = variant.replace(/[^a-z0-9]+/g, " ").trim();
    for (const rx of PHRASE_PROFANITY_PATTERNS) {
      if (rx.test(spaced)) {
        return true;
      }
    }

    const tokens = spaced ? spaced.split(/\s+/) : [];
    for (const tok of tokens) {
      if (TOKEN_PROFANITY_WORDS.has(tok)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Trims whitespace, strips control characters, caps at 16 characters, and replaces empty or profane names with `fallback`.
 */
export function sanitizePlayerName(
  raw: string | null | undefined,
  fallback: string = DEFAULT_HERO_NAME
): string {
  if (typeof raw !== "string") return fallback;
  const clean = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16)
    .trim();
  if (!clean || isProfanePlayerName(clean)) {
    return fallback;
  }
  return clean;
}
