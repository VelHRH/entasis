import { runMigrations } from "#db/migrate.js";
import { PgLive } from "#db/pg-client.js";
import { AllRoutes } from "#http.js";
import { Cookies, FetchHttpClient, HttpApiClient, HttpClient, HttpLayerRouter, HttpServer } from "@effect/platform";
import { NodeContext, NodeHttpServer } from "@effect/platform-node";
import { Api } from "@landline/domain/api";
import { Effect, Layer, Ref } from "effect";
import { createServer } from "node:http";

// The api-seam test server: the exact route layer production serves, bound to
// an ephemeral port against the test database (DATABASE_URL is pointed at it
// by vitest.config.ts). Migrations run before the first request is accepted.
export const TestServerLive = Layer.unwrapEffect(
  runMigrations().pipe(
    Effect.as(
      HttpLayerRouter.serve(AllRoutes, { disableLogger: true }).pipe(
        Layer.provideMerge(NodeHttpServer.layer(createServer, { port: 0 })),
      ),
    ),
    Effect.provide([PgLive, NodeContext.layer]),
  ),
).pipe(
  Layer.merge(FetchHttpClient.layer),
  Layer.provide(NodeContext.layer),
);

// A fresh typed client with its own cookie jar — the same derived client the
// Vue app uses, plus browser-like session-cookie persistence across requests.
export const makeApiClient = Effect.gen(function*() {
  const cookies = yield* Ref.make(Cookies.empty);
  const baseUrl = yield* HttpServer.addressFormattedWith(Effect.succeed);
  return yield* HttpApiClient.make(Api, {
    baseUrl,
    transformClient: HttpClient.withCookiesRef(cookies),
  });
});
