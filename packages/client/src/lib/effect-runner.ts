import { FetchHttpClient } from "@effect/platform";
import { ManagedRuntime } from "effect";

// The single Effect runner for the whole client: services hand it Effects and
// get plain data (Promises) back — components and stores never see Effect.
// There is exactly one ManagedRuntime; modules never create their own.
export const effectRunner = ManagedRuntime.make(FetchHttpClient.layer);
