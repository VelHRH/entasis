import { FetchHttpClient, HttpApiClient } from "@effect/platform";
import { Api } from "@entasis/domain";
import { Effect } from "effect";

export const apiBaseUrl: string = import.meta.env.VITE_API_URL ?? "http://localhost:3222";

// Typed client derived from the shared contract — the only way the client talks
// to the API. If the contract changes in @entasis/domain, this stops compiling.
export const makeApiClient = HttpApiClient.make(Api, { baseUrl: apiBaseUrl });

export const apiClient = makeApiClient.pipe(Effect.provide(FetchHttpClient.layer));
