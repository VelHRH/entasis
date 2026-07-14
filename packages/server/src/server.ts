import { HttpLayerRouter, HttpServerResponse, PlatformConfigProvider } from "@effect/platform";
import { NodeContext, NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Api } from "@entasis/domain/api";
import { Config, Layer } from "effect";
import { createServer } from "node:http";
import * as path from "node:path";
import { ChatModuleLive, ChatWsModuleLive } from "./modules/chat/index.js";
import { RoomsModuleLive } from "./modules/room/index.js";
import { AuthorizationModuleLive, UsersModuleLive } from "./modules/user/index.js";

const ApiLive = HttpLayerRouter.addHttpApi(Api).pipe(
  Layer.provide([RoomsModuleLive, UsersModuleLive, ChatModuleLive]),
  Layer.provide(AuthorizationModuleLive),
);

const HealthRouter = HttpLayerRouter.use((router) => router.add("GET", "/health", HttpServerResponse.text("OK")));

const AllRoutes = Layer.mergeAll(ApiLive, HealthRouter, ChatWsModuleLive).pipe(
  Layer.provide(
    HttpLayerRouter.cors({
      allowedOrigins: ["*"],
      allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "B3", "traceparent"],
      credentials: true,
    }),
  ),
);

const HttpLive = HttpLayerRouter.serve(AllRoutes)
  .pipe(
    Layer.provide(
      NodeHttpServer.layerConfig(createServer, {
        port: Config.integer("PORT").pipe(Config.withDefault(3000)),
      }),
    ),
  )
  .pipe(
    Layer.provide(
      PlatformConfigProvider.layerDotEnvAdd(path.join(process.cwd(), ".env")),
    ),
    Layer.provide(NodeContext.layer),
  );

const program = Layer.launch(HttpLive);

NodeRuntime.runMain(program);
