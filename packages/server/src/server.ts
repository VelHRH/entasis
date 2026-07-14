import { HttpLayerRouter, PlatformConfigProvider } from "@effect/platform";
import { NodeContext, NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Config, Layer } from "effect";
import { createServer } from "node:http";
import * as path from "node:path";
import { AllRoutes } from "./http.js";

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
