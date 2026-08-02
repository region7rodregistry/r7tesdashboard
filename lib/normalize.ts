// Canonicalization for controlled-vocabulary columns.
//
// Keys are spreadsheet letters (see lib/columns.ts). A value is looked up by its
// upper-cased, whitespace-collapsed form and mapped to one canonical spelling.
// This runs on every read AND on every sync write, so the dashboard (and its
// filter dropdowns) stay consistent even after a Google-Sheet Sync re-imports
// raw values.
//
// Most entries collapse pure capitalization variants. A few are explicit,
// human-approved aliases for beyond-case duplicates (typos, a missing Oxford
// comma, a stray space, token order, wording, and truncated entries). New
// aliases should be added here so they survive future syncs.
import type { NttcRecord } from "./columns";

const VOCAB: Record<string, Record<string, string>> = {
  // N = Type of Training Institution
  N: {
    PRIVATE: "Private",
    PUBLIC: "Public",
    NONE: "None",
    PRIVAET: "Private", // typo
    PULIC: "Public", // typo
  },
  // Q = Sector
  Q: {
    "AGRICULTURE, FORESTRY AND FISHERY": "AGRICULTURE, FORESTRY, AND FISHERY", // missing Oxford comma
    "TOURISM (HOTEL AND RESTAURANT)": "TOURISM", // canonical sector name is the bare "TOURISM"
    AUTOMOTIVE: "AUTOMOTIVE AND LAND TRANSPORTATION", // truncated entry
  },
  // R = Qualification
  R: {
    "MOTORCYCLE/ SMALL ENGINE SERVICING NC II": "MOTORCYCLE/SMALL ENGINE SERVICING NC II", // stray space
    "SCAFFOLDING WORKS (SUPPORTED TYPE SCAFFOLD) NC II":
      "SCAFFOLDING WORKS NC II (SUPPORTED TYPE SCAFFOLD)", // token order
  },
};

const normKey = (s: string) => s.trim().toUpperCase().replace(/\s+/g, " ");

/** Canonicalize a single field value for a controlled-vocabulary column. */
export function normalizeValue(letter: string, value: string): string {
  const map = VOCAB[letter];
  if (!map) return value;
  return map[normKey(value)] ?? value;
}

/** Return a copy of a record with its controlled-vocabulary columns canonicalized. */
export function normalizeRecord(rec: NttcRecord): NttcRecord {
  const out: NttcRecord = { ...rec };
  for (const letter of Object.keys(VOCAB)) {
    const v = out[letter];
    if (typeof v === "string") out[letter] = normalizeValue(letter, v);
  }
  return out;
}
