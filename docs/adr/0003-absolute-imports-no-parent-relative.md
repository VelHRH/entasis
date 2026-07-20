# ADR-0003: Absolute imports — parent-relative paths are banned

Status: accepted
Date: 2026-07-17

## Context

Nothing in the repo constrained import style, and three styles accumulated:
parent-relative imports (`../` and deeper) in a handful of client files,
fourteen server files, and five domain files; plus a compiler-only `src/*`
alias on the server (a `paths` entry in its tsconfig) used by five more
files. The owner reviewed the project state and banned `..` in import paths
outright (decided in a design session, issue #17).

Any replacement has to work across two different platforms in one monorepo:
the client is bundled by Vite, while the server is NodeNext ESM compiled by
`tsc` (then babel) and executed by Node/tsx — and TypeScript does **not**
rewrite `paths` aliases in emitted JavaScript, so a compiler-only alias
type-checks and works under tsx in dev, then breaks in the compiled output.
The server's existing `src/*` alias embodies exactly this hazard.

## Decision

Parent-relative imports are banned repo-wide. Each package uses the absolute
mechanism native to its platform:

- **Client:** the `@/` alias pointing at the client source root, declared
  twice as the toolchain requires — in the TypeScript config (`paths`) for
  the type checker, and in the Vite config (`resolve.alias`) for the bundler.
- **Server and domain:** Node subpath imports — a `#` prefix declared in the
  package's `package.json` `imports` field. `tsc` (NodeNext), `tsx`, and
  Node all resolve it natively; the build gains no extra step. The server's
  compiler-only `src/*` alias is banned along with `..` (same hazard, see
  Context) and migrates to `#` too.
- **Same-directory imports (`./sibling`) remain allowed.** The ban is on
  `..`, not on locality: a file may reference its own folder's neighbors
  relatively.

Migration of existing imports is ticketed separately (#18 client; #19
server `../` and `src/*`, plus the domain files). New code follows the rule
immediately.

## Alternatives considered

### Keep relative imports (status quo)

Deep `../../..` chains obscure what is being imported, break when the
importing file moves, and make grep-by-path unreliable. Rejected by the
owner.

### Uniform `@/` alias in every package

One prefix everywhere reads nicer, but on the server it requires a
path-rewriting step (e.g. `tsc-alias`) wedged into the tsc + babel build and
kept consistent with tsx in dev — a permanent extra moving part bought for
cosmetic uniformity. Rejected.

### Uniform `#` subpath imports in every package

Technically possible (Vite also resolves the `imports` field), but `@/` is
the entrenched Vue-ecosystem convention; tooling, templates, and
documentation all assume it on the client side. Rejected.

## Consequences

- Two prefixes coexist by design: `@/` in client code, `#` in server code.
  Each is the native idiom of its platform, so neither needs build tooling
  beyond what already exists.
- The rule is grep-checkable per package: `grep -r 'from "\.\./' src` must
  come back empty.
- Moving a file no longer edits its own imports (only same-folder siblings
  can require attention).
- The server's `src/*` `paths` entry is deleted once its importers are
  migrated, closing the type-checks-but-breaks-when-compiled trap.
- Like the cross-module rule in ADR-0002, enforcement is by review until
  ESLint lands in the affected packages.
