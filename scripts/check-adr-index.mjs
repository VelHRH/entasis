#!/usr/bin/env node
// Verifies docs/adr stays in sync with its index (docs/adr/README.md).
// Mechanical half of the "Adding an ADR" checklist: every ADR file must have a
// row in the index, and every link in the index must point at a real file.
// The judgment half — whether an ADR also earns a line in CLAUDE.md's
// Conventions — can't be automated and is left to review.
//
// Dependency-free: run with `node scripts/check-adr-index.mjs`.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const adrDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "docs", "adr");
const indexPath = resolve(adrDir, "README.md");

const adrFilePattern = /^\d{4}-.*\.md$/;

const adrFiles = readdirSync(adrDir)
  .filter((name) => name !== "README.md" && adrFilePattern.test(name))
  .sort();

const index = readFileSync(indexPath, "utf8");

// Link targets in the index that point at sibling ADR files: `](./NNNN-...md)`.
const linkedFiles = new Set(
  [...index.matchAll(/\]\(\.\/(\d{4}-[^)]*\.md)\)/g)].map((m) => m[1]),
);

const errors = [];

for (const file of adrFiles) {
  if (!linkedFiles.has(file)) {
    errors.push(`  • ${file} exists but has no row in docs/adr/README.md`);
  }
}

for (const linked of linkedFiles) {
  if (!adrFiles.includes(linked)) {
    errors.push(`  • docs/adr/README.md links ${linked}, which does not exist`);
  }
}

if (errors.length > 0) {
  console.error("ADR index out of sync:\n" + errors.join("\n"));
  console.error(
    "\nFix: follow the checklist in docs/adr/README.md (“Adding an ADR”).",
  );
  process.exit(1);
}

console.log(`ADR index in sync (${adrFiles.length} ADRs).`);
