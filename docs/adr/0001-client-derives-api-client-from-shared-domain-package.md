# ADR-0001: Client derives its API client from the shared domain package

Status: accepted
Date: 2026-07-14

## Context

The server already defines its HTTP API as an Effect `HttpApi` contract: Schema
entities with branded IDs (User, Room, Chat, Message), request/response DTOs,
tagged API errors, and a WebSocket protocol with JSON codecs. The Vue client
(#1) needs to talk to that API. The question is how the client obtains a typed
view of the contract, and how drift between server and client is detected.

We extracted the contract into `@landline/domain`, a package with no node-only
dependencies (only `effect` and `@effect/platform`), consumed by both
`@landline/server` and `@landline/client` via the pnpm workspace.

## Decision

The client derives its API client directly from the shared `HttpApi`
definition with `HttpApiClient.make(Api, ...)` over `FetchHttpClient`. This
means running Effect on the frontend: requests are Effects, responses are
decoded through the same Schemas the server encodes with, and API errors
arrive as the same tagged error classes the server declares
(`InvalidCredentialsError`, `RoomNotFoundError`, ...).

The domain package is the single source of truth. Neither side hand-writes
request/response types; the server implements the contract and the client
consumes it, both by the type checker.

## Alternatives considered

### Hand-written fetch client

A plain `fetch` wrapper with hand-maintained TypeScript types. No new runtime
dependency on the frontend, smallest bundle. Rejected because the types are
asserted, not derived: nothing fails to compile when the server contract
changes, so drift surfaces at runtime. It also duplicates validation and error
mapping that the Schemas already define, including Redacted handling for
credentials.

### OpenAPI codegen

Generate an OpenAPI spec from the `HttpApi` (which `@effect/platform`
supports) and run a generator such as `openapi-typescript` for the client.
Keeps Effect off the frontend and is the standard cross-language answer.
Rejected because it inserts a lossy generation step into a same-repo,
same-language pipeline: branded IDs, `Redacted` fields, and tagged error
unions flatten into plain strings and status codes, and the generated
artifacts have to be regenerated and committed (or built) on every contract
change. With one TypeScript monorepo, the compiler can check the real contract
directly.

## Consequences

- Contract changes in `@landline/domain` break the client build immediately —
  verified by hand: renaming `User.email` fails `@landline/client` type-check
  in `scripts/smoke.ts` (TS2339).
- `effect` and `@effect/platform` become frontend runtime dependencies, which
  costs bundle size but buys Schema decoding, tagged errors, and structured
  concurrency for API calls.
- The domain package must stay free of node-only dependencies; its tsconfig
  compiles with `"types": []` so any node import fails the build.
- The WebSocket protocol codecs (`ClientEventFromJson` / `ServerEventFromJson`)
  live in the same package, so the chat transport (#4 onward) is covered by
  the same source of truth.
- Non-TypeScript consumers would need the OpenAPI export after all; the
  `HttpApi` definition keeps that option open without committing to it now.
