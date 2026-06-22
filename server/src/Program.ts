import {
  HttpApi,
  HttpApiBuilder,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpServer,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Context, Effect, Layer, Schema } from "effect";
import { createServer } from "node:http";

class BookGroup extends HttpApiGroup.make("book")
  .add(HttpApiEndpoint.get("get", "/").addSuccess(Schema.String))
  .prefix("/book") {}

const Api = HttpApi.make("Api").add(BookGroup).prefix("/api");

const BookGroupLive = HttpApiBuilder.group(Api, "book", (handlers) =>
  handlers.handle("get", () => Effect.succeed("Your book")),
);

const ApiLive = HttpApiBuilder.api(Api).pipe(Layer.provide(BookGroupLive));

const HttpLive = HttpApiBuilder.serve().pipe(
  HttpServer.withLogAddress,
  Layer.provide(ApiLive),
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
);

const program = Layer.launch(HttpLive);

NodeRuntime.runMain(program);
