import { HttpApiClient, type HttpClient } from "@effect/platform";
import { Api } from "@entasis/domain";
import { CredentialsPayload } from "@entasis/domain/user/credentials";
import { Effect, Redacted } from "effect";
import { runtime } from "./runtime";

// Plain view of the current user for stores/components.
export interface SessionUser {
  readonly id: string;
  readonly email: string;
}

export type AuthResult =
  | { readonly ok: true; readonly user: SessionUser }
  | { readonly ok: false; readonly message: string };

// No baseUrl: requests go to relative /api/... so the Vite dev proxy (and the
// reverse proxy in production) keeps the session cookie first-party.
const apiClient = HttpApiClient.make(Api);

const toSessionUser = (user: { id: string; email: string }): SessionUser => ({
  id: user.id,
  email: user.email,
});

// CredentialsPayload validates on construction (email shape, password
// length); surface those as the same kind of readable message as API errors.
const credentials = (email: string, password: string) =>
  Effect.try({
    try: () => new CredentialsPayload({ email, password: Redacted.make(password) }),
    catch: () => new Error("Enter a valid email and a password of at least 8 characters"),
  });

const toAuthResult = (
  effect: Effect.Effect<
    { readonly user: { id: string; email: string } },
    { readonly message: string },
    HttpClient.HttpClient
  >,
): Promise<AuthResult> =>
  runtime.runPromise(
    effect.pipe(
      Effect.map(({ user }): AuthResult => ({ ok: true, user: toSessionUser(user) })),
      Effect.catchAll((error) => Effect.succeed<AuthResult>({ ok: false, message: error.message })),
    ),
  );

export const signUp = (email: string, password: string): Promise<AuthResult> =>
  toAuthResult(
    credentials(email, password).pipe(
      Effect.flatMap((payload) =>
        apiClient.pipe(
          Effect.flatMap((client) => client.users.signUp({ payload, headers: {} })),
          // Decode/transport failures are bugs or outages, not user errors.
          Effect.catchTag("EmailAlreadyInUseError", (error) => Effect.fail(error)),
          Effect.catchAll(() => Effect.fail(new Error("Something went wrong, try again"))),
        )
      ),
    ),
  );

export const login = (email: string, password: string): Promise<AuthResult> =>
  toAuthResult(
    credentials(email, password).pipe(
      Effect.flatMap((payload) =>
        apiClient.pipe(
          Effect.flatMap((client) => client.users.login({ payload, headers: {} })),
          Effect.catchTag("InvalidCredentialsError", (error) => Effect.fail(error)),
          Effect.catchAll(() => Effect.fail(new Error("Something went wrong, try again"))),
        )
      ),
    ),
  );

// Resolves the current user from the session cookie; null when logged out.
export const me = (): Promise<SessionUser | null> =>
  runtime.runPromise(
    apiClient.pipe(
      Effect.flatMap((client) => client.users.me()),
      Effect.map(toSessionUser),
      Effect.catchAll(() => Effect.succeed(null)),
    ),
  );

export const logout = (): Promise<void> =>
  runtime.runPromise(
    apiClient.pipe(
      Effect.flatMap((client) => client.users.logout()),
      // Even if the request fails the client-side session state is dropped;
      // the guard will send the user back to auth either way.
      Effect.catchAll(() => Effect.void),
    ),
  );
