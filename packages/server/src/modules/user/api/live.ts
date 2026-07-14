import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder";
import { Api } from "@entasis/domain/api";
import { AuthResponse } from "@entasis/domain/user/credentials";
import { Authorization, CurrentUser, SessionCookie } from "@entasis/domain/user/http";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { AuthResult } from "../domain/dto/auth-result.js";
import { AuthService, SESSION_TTL } from "../domain/service.js";

// TODO: drop `secure: false` once the server is behind HTTPS.
const cookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: false,
} as const;

export const AuthorizationLive = Layer.effect(
  Authorization,
  Effect.gen(function*() {
    const auth = yield* AuthService;

    return {
      cookie: (token) => auth.identify(token), // web
      bearer: (token) => auth.identify(token), // mobile
    };
  }),
);

export const UsersGroupLive = HttpApiBuilder.group(Api, "users", (handlers) =>
  Effect.gen(function*() {
    const auth = yield* AuthService;

    const startSession = (headers: {
      readonly "x-client"?: string | undefined;
    }) =>
      headers["x-client"] === "mobile"
        ? (result: AuthResult) =>
          Effect.succeed(
            new AuthResponse({ user: result.user, token: result.token }),
          )
        : (result: AuthResult) =>
          HttpApiBuilder.securitySetCookie(SessionCookie, result.token, {
            ...cookieOptions,
            maxAge: SESSION_TTL,
          }).pipe(Effect.as(new AuthResponse({ user: result.user })));

    return handlers
      .handle("signUp", ({ headers, payload }) => Effect.flatMap(auth.signUp(payload), startSession(headers)))
      .handle("login", ({ headers, payload }) => Effect.flatMap(auth.login(payload), startSession(headers)))
      .handle("me", () => CurrentUser)
      .handle("logout", () =>
        Effect.gen(function*() {
          const user = yield* CurrentUser;
          yield* auth.logout(user.id);
          yield* HttpApiBuilder.securitySetCookie(SessionCookie, "", {
            ...cookieOptions,
            maxAge: 0,
          });
        }));
  }));
