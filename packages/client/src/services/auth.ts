import { HttpApiClient } from "@effect/platform";
import { Api } from "@entasis/domain";
import type { AuthResponse } from "@entasis/domain/user/credentials";
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

type ApiClient = Effect.Effect.Success<typeof apiClient>;

const toSessionUser = (user: SessionUser): SessionUser => ({
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

// Shared signup/login pipeline: the endpoint's own tagged error keeps its
// readable message; anything else (transport, decode) is not the user's
// fault and collapses to a generic message.
const authCall = <E extends { readonly _tag: string; readonly message: string }>(
  email: string,
  password: string,
  call: (client: ApiClient, payload: CredentialsPayload) => Effect.Effect<AuthResponse, E>,
  userFacingTag: E["_tag"],
): Promise<AuthResult> =>
  runtime.runPromise(
    credentials(email, password).pipe(
      Effect.flatMap((payload) =>
        apiClient.pipe(
          Effect.flatMap((client) => call(client, payload)),
          Effect.mapError((error) =>
            error._tag === userFacingTag ? error : new Error("Something went wrong, try again")
          ),
        )
      ),
      Effect.map(({ user }): AuthResult => ({ ok: true, user: toSessionUser(user) })),
      Effect.catchAll((error) => Effect.succeed<AuthResult>({ ok: false, message: error.message })),
    ),
  );

export const signUp = (email: string, password: string): Promise<AuthResult> =>
  authCall(
    email,
    password,
    (client, payload) => client.users.signUp({ payload, headers: {} }),
    "EmailAlreadyInUseError",
  );

export const login = (email: string, password: string): Promise<AuthResult> =>
  authCall(
    email,
    password,
    (client, payload) => client.users.login({ payload, headers: {} }),
    "InvalidCredentialsError",
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
