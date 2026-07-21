import { RoomsService } from "#modules/room/domain/service.js";
import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder";
import { Api } from "@entasis/domain/api";
import { CurrentUser } from "@entasis/domain/user/http";
import * as Effect from "effect/Effect";

export const RoomsGroupLive = HttpApiBuilder.group(Api, "rooms", (handlers) =>
  Effect.gen(function*() {
    const service = yield* RoomsService;

    return handlers
      .handle("list", () => Effect.flatMap(CurrentUser, (user) => service.list(user.id)))
      .handle("members", ({ path }) => Effect.flatMap(CurrentUser, (user) => service.members(path.roomId, user.id)))
      .handle("upsert", ({ payload }) => service.upsert(payload))
      .handle("join", ({ payload }) => Effect.flatMap(CurrentUser, (user) => service.join(payload.id, user.id)))
      .handle("delete", ({ payload }) => service.delete(payload.id));
  }));
