import { readFileSync } from "node:fs";
import path from "node:path";

import type { CaseKey } from "@/types/simulator";

const SNIPPETS_DIR = path.join(process.cwd(), "lib", "case-code");

// Reads a case's real source excerpt straight from lib/case-code/, kept as plain .txt files (not string literals in lib/simulator-cases.ts, a module shared with client components) so they stay easy to read and edit on their own. Returns null when a case has no snippet yet.
//
// `device: "mobile"` looks for a `<key>.mobile.<variant>.txt` override first (only a couple of cases whose bad/good code genuinely differs by platform need one - see contextOverhead) and falls back to the shared `<key>.<variant>.txt` file when no mobile-specific snippet exists, so most cases never need a second file at all.
function readSnippet(
  key: CaseKey,
  variant: "bad" | "good",
  device?: "mobile",
): string | null {
  const fileName = device
    ? `${key}.${device}.${variant}.txt`
    : `${key}.${variant}.txt`;
  try {
    return readFileSync(path.join(SNIPPETS_DIR, fileName), "utf-8").trimEnd();
  } catch {
    return device ? readSnippet(key, variant) : null;
  }
}

export function getBadCodeSnippet(
  key: CaseKey,
  device?: "mobile",
): string | null {
  return readSnippet(key, "bad", device);
}

export function getGoodCodeSnippet(
  key: CaseKey,
  device?: "mobile",
): string | null {
  return readSnippet(key, "good", device);
}
