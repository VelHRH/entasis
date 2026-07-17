import { HttpApiClient } from "@effect/platform";
import { Api } from "@entasis/domain";
import { Effect } from "effect";

// The one typed client derived from the shared contract (ADR-0001). No
// baseUrl: requests go to relative /api/... so the Vite dev proxy (and the
// reverse proxy in production) keeps the session cookie first-party.
const apiClient = HttpApiClient.make(Api);

export type ApiClient = Effect.Effect.Success<typeof apiClient>;

// Every server request needs the derived client and ends up in the
// effectRunner; callApi bundles the client half. Services give it a function
// of the typed client and get the request Effect back, ready to shape
// (mapError, catchAll, …) and hand to effectRunner.
export const callApi = <A, E>(call: (client: ApiClient) => Effect.Effect<A, E>) =>
  Effect.flatMap(apiClient, call);
