# ADR-0005: File naming — kebab-case, PascalCase for Vue SFCs

Status: accepted
Date: 2026-07-21

## Context

The TypeScript packages grew without a written file-naming rule. In practice
`.ts`/`.css` files already landed in kebab-case, and Vue single-file components
in PascalCase — but nothing recorded it, so the next file was a coin flip. Vue
tooling and the wider ecosystem expect PascalCase component filenames (the
filename mirrors the component's name in templates and devtools), which sits
awkwardly beside the kebab-case rule for everything else and is exactly the kind
of exception a reader would otherwise second-guess.

## Decision

Applies to the **TypeScript packages** — `@entasis/client`, `@entasis/server`,
`@entasis/domain`.

- **Files are kebab-case** — `chat-socket.service.ts`, `button-config.ts`,
  `pg-client.ts`.
- **Vue SFCs are the sole exception: PascalCase** — `AuthView.vue`,
  `ButtonLink.vue`. The filename matches the component it exports.
- **A component that needs companion files** (config, types, variants, …) lives
  in its own folder alongside them — `ui/button/` holds `Button.vue`,
  `button-config.ts`, and `button-variant.ts`. A component with no companions
  stays a flat file (`ui/Input.vue`).
- **No barrel `index.ts` on the client.** Import the file you mean; the absolute
  imports of ADR-0003 already keep paths short. Server and domain are unchanged,
  including their per-module `index.ts` entry points.

The planned native packages (Swift for iOS, Kotlin for Android — see
[`CLAUDE.md`](../../CLAUDE.md)) are **out of scope**: they follow their own
platform idioms (which are not kebab-case), and this repo will not prescribe
their conventions until they land.

## Alternatives considered

- **kebab-case for Vue files too.** Rejected: it fights Vue tooling and the
  convention that a `.vue` filename mirrors its PascalCase component name.
- **Barrel `index.ts` per client folder.** Rejected on the client: barrels blur
  what actually depends on what, complicate tree-shaking, and duplicate the
  navigability that ADR-0003's absolute imports already provide.
- **One repo-wide rule covering the future native packages.** Rejected as
  premature: Swift/Kotlin have their own established naming norms, and committing
  to them now — before either package exists — would be a guess, not a decision.

## Consequences

- The TypeScript packages already conform; this ADR ratifies the status quo
  rather than forcing a migration.
- The no-barrel rule is client-only — server/domain module `index.ts` files are
  deliberately untouched.
- A future ADR will cover native-package layout when iOS/Android work begins.
