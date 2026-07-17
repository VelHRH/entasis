import type { AuthResponse } from "@entasis/domain/user/credentials";
import { CredentialsPayload } from "@entasis/domain/user/credentials";
import { Effect, Redacted } from "effect";
import type { ApiClient } from "../../lib/api-client";
import { runApi } from "../../lib/api-client";
import type { SessionUser } from "./session.service";
import { toSessionUser } from "./session.service";

export type AuthResult =
  | { readonly ok: true; readonly user: SessionUser }
  | { readonly ok: false; readonly message: string };

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
  runApi((client) =>
    credentials(email, password).pipe(
      Effect.flatMap((payload) =>
        call(client, payload).pipe(
          Effect.mapError((error) =>
            error._tag === userFacingTag ? error : new Error("Something went wrong, try again"),
          ),
        ),
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
