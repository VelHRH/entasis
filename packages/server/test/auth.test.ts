import { expect, layer } from "@effect/vitest";
import { CredentialsPayload } from "@entasis/domain/user/credentials";
import { Effect, Redacted } from "effect";
import { makeApiClient, TestServerLive } from "./harness.js";

const password = Redacted.make("correct-horse-battery");

const credentials = (email: string, raw?: string) =>
  new CredentialsPayload({
    email,
    password: raw === undefined ? password : Redacted.make(raw),
  });

layer(TestServerLive, { excludeTestServices: true })("auth", (it) => {
  it.effect("signup → me → logout → login covers the whole session lifecycle", () =>
    Effect.gen(function*() {
      const client = yield* makeApiClient;
      const email = "lifecycle@example.com";

      const signedUp = yield* client.users.signUp({
        payload: credentials(email),
        headers: {},
      });
      expect(signedUp.user.email).toBe(email);
      // Web clients (no x-client header) get the session via cookie only.
      expect(signedUp.token).toBeUndefined();

      const me = yield* client.users.me();
      expect(me.id).toBe(signedUp.user.id);
      expect(me.email).toBe(email);

      yield* client.users.logout();

      const afterLogout = yield* client.users.me().pipe(Effect.flip);
      expect(afterLogout._tag).toBe("UnauthorizedError");

      const loggedIn = yield* client.users.login({
        payload: credentials(email),
        headers: {},
      });
      expect(loggedIn.user.id).toBe(signedUp.user.id);

      const meAgain = yield* client.users.me();
      expect(meAgain.id).toBe(signedUp.user.id);
    }));

  it.effect("signup with an already used email fails with EmailAlreadyInUseError", () =>
    Effect.gen(function*() {
      const client = yield* makeApiClient;
      const email = "taken@example.com";

      yield* client.users.signUp({ payload: credentials(email), headers: {} });

      const rejection = yield* client.users
        .signUp({ payload: credentials(email), headers: {} })
        .pipe(Effect.flip);

      expect(rejection._tag).toBe("EmailAlreadyInUseError");
      if (rejection._tag === "EmailAlreadyInUseError") {
        expect(rejection.email).toBe(email);
      }
    }));

  it.effect("login with a wrong password fails with InvalidCredentialsError", () =>
    Effect.gen(function*() {
      const client = yield* makeApiClient;
      const email = "wrong-password@example.com";

      yield* client.users.signUp({ payload: credentials(email), headers: {} });

      const rejection = yield* client.users
        .login({ payload: credentials(email, "not-the-password"), headers: {} })
        .pipe(Effect.flip);

      expect(rejection._tag).toBe("InvalidCredentialsError");
    }));

  it.effect("login with an unknown email fails with InvalidCredentialsError", () =>
    Effect.gen(function*() {
      const client = yield* makeApiClient;

      const rejection = yield* client.users
        .login({ payload: credentials("nobody@example.com"), headers: {} })
        .pipe(Effect.flip);

      expect(rejection._tag).toBe("InvalidCredentialsError");
    }));

  it.effect("guarded endpoint without a session fails with UnauthorizedError", () =>
    Effect.gen(function*() {
      const client = yield* makeApiClient;

      const rejection = yield* client.users.me().pipe(Effect.flip);

      expect(rejection._tag).toBe("UnauthorizedError");
    }));
});
