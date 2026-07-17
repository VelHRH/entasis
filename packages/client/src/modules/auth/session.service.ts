import { Effect } from "effect";
import { callApi } from "../../lib/api-client";
import { effectRunner } from "../../lib/effect-runner";

// Plain view of the current user for stores/components.
export interface SessionUser {
  readonly id: string;
  readonly email: string;
}

export const toSessionUser = (user: SessionUser): SessionUser => ({
  id: user.id,
  email: user.email,
});

// Resolves the current user from the session cookie; null when logged out.
export const me = (): Promise<SessionUser | null> =>
  effectRunner.runPromise(
    callApi((client) => client.users.me()).pipe(
      Effect.map(toSessionUser),
      Effect.catchAll(() => Effect.succeed(null)),
    ),
  );

export const logout = (): Promise<void> =>
  effectRunner.runPromise(
    callApi((client) => client.users.logout()).pipe(
      // Even if the request fails the client-side session state is dropped;
      // the guard will send the user back to auth either way.
      Effect.catchAll(() => Effect.void),
    ),
  );
