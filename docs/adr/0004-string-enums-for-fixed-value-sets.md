# ADR-0004: Fixed value sets are string enums, not literal unions

Status: accepted
Date: 2026-07-17

## Context

The client expressed fixed value sets as string-literal unions — the auth
screen mode (`"login" | "signup"`) and the Button variant
(`"primary" | "secondary"`). The wider TypeScript community leans toward
literal unions, so the owner's contrary convention (decided in a design
session, issue #17) is recorded here precisely because a future reader would
otherwise assume the community default.

One obstacle: the client tsconfigs carried `erasableSyntaxOnly: true` (a Vue
starter default aimed at type-stripping runtimes), and the `enum` keyword is
not erasable syntax — the flag makes every enum a compile error.

## Decision

A **fixed value set** — a closed list of named alternatives where a value is
one of N known constants — is declared as a TypeScript **string enum**
(`enum AuthMode { LOGIN = "LOGIN", SIGNUP = "SIGNUP" }`), in every package.
Keys and values are identical and uppercase (see the rule at the end of this
section).

**Discriminated shapes stay unions.** `ApiResult<A>` (ADR-0002) is the
sanctioned example: its ok/err branches carry different fields, and the point
of the type is that checking the discriminant narrows access to those fields.
Rewriting it around an enum status would make `data` optional in both
branches. The same applies to the domain's tagged error classes, which Effect
discriminates by `_tag`. The test: if the alternatives carry different
payloads, it is a discriminated shape (union); if they are bare named values,
it is a value set (enum).

Consequently, `erasableSyntaxOnly` must go: #18 removes it from the client
tsconfigs alongside the union migration.

Both keys and values of the enum should be always the same and uppercase like this:

```typescript
export enum ButtonVariant {
  PRIMARY = "PRIMARY",
  SECONDARY = "SECONDARY",
  LINK = "LINK",
}
```

## Alternatives considered

### String-literal unions (status quo, community default)

Zero runtime footprint and no import needed at use sites. Rejected by the
owner: the set has no single named declaration to navigate to, values recur
as scattered string literals, and renaming a member is a find-and-replace
over strings rather than a symbol rename.

### Const-object pattern (`const Mode = { … } as const` + derived type)

Erasable (would keep the tsconfig flag) and enum-like at use sites. Rejected:
it takes two declarations (object plus derived type) to say one thing, and
IDE affordances (references, renames, exhaustiveness hints) are weaker than
for a real enum, while the runtime object it emits is the same cost.

### Enums for everything, including result shapes

Considered and explicitly rejected — see the narrowing argument in the
Decision. The owner confirmed `ApiResult` stays a union.

## Consequences

- Dropping `erasableSyntaxOnly` is safe here: Vite compiles enums natively;
  the flag exists for runtimes that strip types without transforming code,
  which this repo does not use.
- String (not numeric) enums keep runtime values readable wherever they leak
  — DOM attributes, logs, serialized state.
- Use sites import the enum, including Vue templates (a component binds
  `:variant="ButtonVariant.Secondary"` instead of passing a bare string).
- Existing literal unions are migrated in #18; new code follows the rule
  immediately — noting that client enums only compile once #18 drops the
  flag, so a client change made before then starts by removing it.
