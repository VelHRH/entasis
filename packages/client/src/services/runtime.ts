import { FetchHttpClient } from "@effect/platform";
import { ManagedRuntime } from "effect";

// The single Effect runtime for the whole client. Every service runs its
// Effects through this and hands plain data (Promises) outward — components
// and stores never see Effect.
export const runtime = ManagedRuntime.make(FetchHttpClient.layer);
