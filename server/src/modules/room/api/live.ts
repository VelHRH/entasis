import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder";
import * as Effect from "effect/Effect";
import { Api } from "src/api.js";
import { RoomsService } from "../domain/service.js";

export const RoomsGroupLive = HttpApiBuilder.group(Api, "rooms", (handlers) =>
  Effect.gen(function* () {
    const service = yield* RoomsService;

    return handlers
      .handle("list", () => service.list())
      .handle("upsert", ({ payload }) => service.upsert(payload))
      .handle("delete", ({ payload }) => service.delete(payload.id));
  }),
);
