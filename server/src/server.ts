import { HttpLayerRouter, HttpServerResponse } from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { createServer } from "node:http";
import { Api } from "./api.js";
import { RoomsModuleLive } from "./modules/room/index.js";

const ApiLive = HttpLayerRouter.addHttpApi(Api).pipe(
  Layer.provide(RoomsModuleLive),
);

const HealthRouter = HttpLayerRouter.use((router) =>
  router.add("GET", "/health", HttpServerResponse.text("OK")),
);

const AllRoutes = Layer.mergeAll(ApiLive, HealthRouter).pipe(
  Layer.provide(
    HttpLayerRouter.cors({
      allowedOrigins: ["*"],
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "B3", "traceparent"],
      credentials: true,
    }),
  ),
);

const HttpLive = HttpLayerRouter.serve(AllRoutes).pipe(
  Layer.provide(
    NodeHttpServer.layer(createServer, {
      port: 3000,
    }),
  ),
);

const program = Layer.launch(HttpLive);

NodeRuntime.runMain(program);
