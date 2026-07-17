import { HttpApiClient } from "@effect/platform";
import { Api } from "@entasis/domain";
import type { Effect } from "effect";

// The one typed client derived from the shared contract (ADR-0001), shared by
// every module's services. No baseUrl: requests go to relative /api/... so the
// Vite dev proxy (and the reverse proxy in production) keeps the session
// cookie first-party.
export const apiClient = HttpApiClient.make(Api);

export type ApiClient = Effect.Effect.Success<typeof apiClient>;
