// Smoke-tests the contract: derives a typed client from @landline/domain and
// round-trips against a running dev server (pnpm dev:server). Verifies both the
// success path (AuthResponse decode) and the tagged-error path
// (InvalidCredentialsError decode).
import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Api, CredentialsPayload } from "@landline/domain";
import { Effect, Redacted } from "effect";

const baseUrl = process.env.API_URL ?? "http://localhost:3222";

const program = Effect.gen(function* () {
  const client = yield* HttpApiClient.make(Api, { baseUrl });

  const email = `smoke-${Date.now()}@example.com`;

  const signedUp = yield* client.users.signUp({
    payload: new CredentialsPayload({
      email,
      password: Redacted.make("smoke-password-123"),
    }),
    headers: {},
  });
  yield* Effect.log(
    `signUp ok: decoded AuthResponse for ${signedUp.user.email} (id ${signedUp.user.id})`,
  );

  const rejection = yield* client.users
    .login({
      payload: new CredentialsPayload({
        email,
        password: Redacted.make("wrong-password-123"),
      }),
      headers: {},
    })
    .pipe(Effect.flip);

  if (rejection._tag !== "InvalidCredentialsError") {
    return yield* Effect.dieMessage(`expected InvalidCredentialsError, got ${rejection._tag}`);
  }
  yield* Effect.log("login with bad password: decoded tagged InvalidCredentialsError");
});

program.pipe(Effect.provide(FetchHttpClient.layer), Effect.runPromise).then(
  () => {
    console.log(`smoke OK against ${baseUrl}`);
  },
  (error) => {
    console.error(`smoke FAILED against ${baseUrl}`);
    console.error(error);
    process.exitCode = 1;
  },
);
