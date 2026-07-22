import { HttpApiClient } from "@effect/platform";
import { Api } from "@landline/domain";
import { Effect } from "effect";
import { effectRunner } from "./effect-runner";

// The one typed client derived from the shared contract (ADR-0001). No
// baseUrl: requests go to relative /api/... so the Vite dev proxy (and the
// reverse proxy in production) keeps the session cookie first-party.
const apiClient = HttpApiClient.make(Api);

export type ApiClient = Effect.Effect.Success<typeof apiClient>;

// The result shape for front: success carries the data,
// failure carries a user-facing message. Failure is a value — the Promises
// returned by services never reject.
export type ApiResult<A> =
  | {
      readonly ok: true;
      readonly data: A;
    }
  | { readonly ok: false; readonly message: string };

export const ok = <A>(data: A): ApiResult<A> => ({ ok: true, data });
export const err = <A = never>(message: string): ApiResult<A> => ({ ok: false, message });

// One-shot HTTP calls always pair the derived client with the effectRunner,
// so runApi merges the two: build the whole request pipeline from the typed
// client, get a Promise back. Long-lived work (the WebSocket transport, #8)
// is not one-shot and uses the effectRunner directly (runFork/runCallback).
export const runApi = <A, E>(call: (client: ApiClient) => Effect.Effect<A, E>): Promise<A> =>
  effectRunner.runPromise(Effect.flatMap(apiClient, call));
