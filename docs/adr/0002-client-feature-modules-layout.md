# ADR-0002: Client source is organized by feature module

Status: accepted
Date: 2026-07-17

## Context

The client skeleton (#5) shipped with a layer-based `src` layout — `services/`,
`stores/`, `views/` — holding one feature (auth) smeared across three folders.
The server already groups code by feature under `modules/*`. With the design
tokens pass (#6) and the Rooms and Chat verticals (#7, #8) about to add
screens, stores and services, the client layout needed to be settled before
those tickets pour code into the old shape. Decided with the owner in a design
session (issue #14).

## Decision

`packages/client/src` is organized by feature module, mirroring the server:

```
src/
├── modules/
│   └── auth/            AuthView.vue, session.store.ts, auth.service.ts
├── ui/                  shared UI primitives (Button, Input, …) — may start empty
├── lib/                 shared infrastructure; runtime.ts (the single ManagedRuntime)
├── utils/               shared pure helpers (created only when something needs it)
├── router.ts            the one global router; assembles routes, owns the guard
├── App.vue
└── main.ts
```

Rules:

- **A module owns its feature.** Views, Pinia stores (`*.store.ts`) and Effect
  services (`*.service.ts`) for a feature live in its module folder.
  `session.store.ts` belongs to `modules/auth`.
- **Effect confinement, restated from ADR-0001 / spec #1:** Effect appears
  only in `*.service.ts` files and `lib/runtime.ts`. There is exactly one
  `ManagedRuntime` (in `lib/runtime.ts`); modules never create their own.
  Components and stores work with plain data and Promises.
- **Cross-module imports go through a module's public files only** — its
  stores and exported route names (the `routeNames` constants in `router.ts`;
  no string literals). Never import another module's `*.service.ts`.
  (Conventional for now: the client has no ESLint yet, so the rule is not
  machine-enforced.)
- **One global `router.ts`.** No per-module route files until the screen count
  demands it.

## Alternatives considered

### Keep the layer layout (`services/`, `stores/`, `views/`)

Works at one feature, dies at the second vertical: a single feature ends up
smeared over three or four folders, and every feature change touches all of
them. It also diverges from the server's `modules/*` convention for no gain.

### Per-module route files (each module exports its routes)

Needless indirection at 4–5 screens. The global `router.ts` stays small,
keeps the guard in one obvious place, and can be split later if the route
table actually grows.

## Consequences

- The Rooms and Chat verticals (#7, #8) each land as one folder under
  `modules/`, with their own `*.store.ts` and `*.service.ts`. The placeholder
  home screen lives in `modules/home` until the Rooms list (#7) replaces it.
- Shared UI primitives extracted during the token pass (#6) go to `ui/`.
- The Effect rule is grep-checkable:
  `grep -rlE "from ['\"](effect|@effect/)" src` must list only `*.service.ts`
  files and `lib/runtime.ts`.
- Until ESLint lands, the cross-module import rule is enforced by review, not
  tooling.
