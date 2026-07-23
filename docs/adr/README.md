# Architecture Decision Records

The log of architecture decisions for Entasis. Each ADR is an immutable,
numbered record of one decision — its context, the alternatives, and the
consequences. Superseded records stay in place (struck through below) rather
than being deleted.

**Area** locates the decision: `client`, `server`, `domain`, or `repo`
(repo-wide). **Status** is one of `accepted`, `superseded`, or `proposed`.

Add an ADR when a choice is hard to reverse, surprising without context, and the
result of a real trade-off. The standing rules that these decisions produce are
summarized in [`CLAUDE.md`](../../CLAUDE.md#conventions).

## Adding an ADR

This index and `CLAUDE.md` do not update themselves. When you add an ADR, do all
of these in the same change:

1. Create `NNNN-title.md` using the next free number and the existing ADR format.
2. **Add a row** to the table below (`# | Title | Area | Status`).
3. If the ADR produces a **standing rule** for new code, add one terse line to
   the [Conventions section of `CLAUDE.md`](../../CLAUDE.md#conventions), tagged
   with a link to the ADR. If it's a one-off architectural choice with no
   standing rule (e.g. "Postgres over X"), leave `CLAUDE.md` alone — it only
   carries the hot subset.
4. If the ADR **supersedes** another, strike through the old row here and set its
   Status to `superseded`; update or remove the old rule in `CLAUDE.md`.

Steps 1–2 are enforced in CI (the **ADR index** job runs
`node scripts/check-adr-index.mjs`, which fails if any ADR file lacks a row or
any row links to a missing file). Steps 3–4 need judgment and rest on review.

| #    | Title                                                                                   | Area          | Status   |
| ---- | --------------------------------------------------------------------------------------- | ------------- | -------- |
| [0001](./0001-client-derives-api-client-from-shared-domain-package.md) | Client derives its API client from the shared domain package | client, domain | accepted |
| [0002](./0002-client-feature-modules-layout.md) | Client source is organized by feature module | client | accepted |
| [0003](./0003-absolute-imports-no-parent-relative.md) | Absolute imports — parent-relative paths are banned | repo | accepted |
| [0004](./0004-string-enums-for-fixed-value-sets.md) | Fixed value sets are string enums, not literal unions | repo | accepted |
| [0005](./0005-file-naming-kebab-case-pascalcase-vue.md) | File naming — kebab-case, PascalCase for Vue SFCs | client, server, domain | accepted |
| [0007](./0007-event-reservation-model.md) | City-scoped Events, two-stage intent, auto-composition at cutoff | server, domain | accepted |
| [0008](./0008-room-composition-algorithm.md) | Room composition — compatibility-graph viability and drop-streak fairness | server, domain | accepted |
